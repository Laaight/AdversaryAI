/**
 * scripts/setup-stripe.js
 *
 * Automated Stripe Product and Price Setup for AdversaryAI.
 * Connects to Stripe via REST API, ensures all 7 products and prices exist,
 * saves the price IDs to remote Cloudflare D1 (app_config), and outputs
 * the wrangler secret commands.
 *
 * Usage:
 *   node scripts/setup-stripe.js <STRIPE_SECRET_KEY>
 */

const { execSync } = require('child_process');

const STRIPE_SECRET_KEY = process.argv[2] || process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('\x1b[31mError: Stripe Secret Key is required.\x1b[0m');
  console.log('Usage: node scripts/setup-stripe.js <sk_live_... or sk_test_...>');
  process.exit(1);
}

const STRIPE_API = 'https://api.stripe.com/v1';

async function stripeReq(method, path, bodyParams = null) {
  const headers = {
    Authorization: `Basic ${Buffer.from(STRIPE_SECRET_KEY + ':').toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  let body = undefined;
  if (bodyParams && method !== 'GET') {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(bodyParams)) {
      if (v !== undefined && v !== null) {
        params.append(k, String(v));
      }
    }
    body = params.toString();
  }

  const res = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers,
    body
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Stripe API ${method} ${path} failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

const ITEMS = [
  {
    key: 'debater',
    name: 'AdversaryAI Debater',
    description: '300 sparring rounds per month across all 10 practice modes',
    type: 'recurring',
    amount: 1200, // $12.00
    interval: 'month'
  },
  {
    key: 'coach',
    name: 'AdversaryAI Coach',
    description: '1,000 sparring rounds per month plus coaching analytics and rubrics',
    type: 'recurring',
    amount: 2900, // $29.00
    interval: 'month'
  },
  {
    key: 'champion',
    name: 'AdversaryAI Champion',
    description: '2,500 sparring rounds per month with DeepSeek-V4-Pro & photorealistic 3D personas',
    type: 'recurring',
    amount: 4900, // $49.00
    interval: 'month'
  },
  {
    key: 'pack10',
    name: '100 Sparring Rounds Pack',
    description: '100 round one-time credit top-up. Credits never expire.',
    type: 'one_time',
    amount: 900 // $9.00
  },
  {
    key: 'pack25',
    name: '250 Sparring Rounds Pack',
    description: '250 round one-time credit top-up. Credits never expire.',
    type: 'one_time',
    amount: 1900 // $19.00
  },
  {
    key: 'pack60',
    name: '600 Sparring Rounds Pack',
    description: '600 round one-time credit top-up. Credits never expire.',
    type: 'one_time',
    amount: 3900 // $39.00
  },
  {
    key: 'eduSeat',
    name: 'AdversaryAI Education Seat',
    description: '1 seat license with 300 pooled rounds per month for classrooms & teams',
    type: 'recurring',
    amount: 600, // $6.00
    interval: 'month'
  }
];

async function main() {
  console.log('\x1b[36mValidating Stripe credentials...\x1b[0m');
  const account = await stripeReq('GET', '/account');
  console.log(`\x1b[32m✓ Connected to Stripe account: ${account.id} (${account.business_profile?.name || account.settings?.dashboard?.display_name || account.email || 'AdversaryAI'})\x1b[0m\n`);

  console.log('\x1b[36mFetching existing products and prices from Stripe...\x1b[0m');
  const existingProducts = (await stripeReq('GET', '/products?limit=100')).data || [];
  const existingPrices = (await stripeReq('GET', '/prices?limit=100&active=true')).data || [];

  const priceResults = {};

  for (const item of ITEMS) {
    console.log(`\x1b[33mProcessing: ${item.name} ($${(item.amount / 100).toFixed(2)}${item.type === 'recurring' ? '/mo' : ''})\x1b[0m`);

    // 1. Find or create Product
    let product = existingProducts.find(
      p => (p.metadata && p.metadata.adversaryai_key === item.key) || p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
    );

    if (!product) {
      console.log(`  Creating product: ${item.name}...`);
      product = await stripeReq('POST', '/products', {
        name: item.name,
        description: item.description,
        'metadata[adversaryai_key]': item.key
      });
      console.log(`  ✓ Created product ${product.id}`);
    } else {
      console.log(`  ✓ Found existing product ${product.id}`);
    }

    // 2. Find or create Price
    let price = existingPrices.find(p => {
      const matchProduct = p.product === product.id;
      const matchAmount = p.unit_amount === item.amount;
      const matchCurrency = p.currency === 'usd';
      const matchType = item.type === 'recurring' ? (p.type === 'recurring' && p.recurring?.interval === item.interval) : p.type === 'one_time';
      return matchProduct && matchAmount && matchCurrency && matchType;
    });

    if (!price) {
      console.log(`  Creating price for ${item.name}...`);
      const priceParams = {
        product: product.id,
        unit_amount: item.amount,
        currency: 'usd',
        'metadata[adversaryai_key]': item.key
      };
      if (item.type === 'recurring') {
        priceParams['recurring[interval]'] = item.interval;
      }
      price = await stripeReq('POST', '/prices', priceParams);
      console.log(`  ✓ Created price ${price.id}`);
    } else {
      console.log(`  ✓ Found existing price ${price.id}`);
    }

    priceResults[item.key] = price.id;
  }

  console.log('\n\x1b[32m================================================\x1b[0m');
  console.log('\x1b[32mAll Stripe Products and Prices Ready!\x1b[0m');
  console.log('\x1b[32m================================================\x1b[0m');
  console.table(priceResults);

  // 3. Save to remote D1 app_config
  console.log('\n\x1b[36mSaving price IDs to remote Cloudflare D1 (app_config table)...\x1b[0m');
  const now = Date.now();
  let sqlStatements = '';
  for (const [key, priceId] of Object.entries(priceResults)) {
    sqlStatements += `INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES ('stripe_price_${key}', '${priceId}', ${now}); `;
  }

  try {
    const cfToken = process.env.CLOUDFLARE_API_TOKEN || execSync('powershell -Command "[System.Environment]::GetEnvironmentVariable(\'cloudflarkey\', \'User\')"', { encoding: 'utf8' }).trim();
    execSync(`npx wrangler d1 execute adversaryai-db --remote --command "${sqlStatements}"`, {
      env: { ...process.env, CLOUDFLARE_API_TOKEN: cfToken },
      stdio: 'inherit'
    });
    console.log('\x1b[32m✓ Successfully saved all Stripe price IDs into remote D1!\x1b[0m');
  } catch (err) {
    console.warn('\x1b[33mWarning: Could not automatically save to D1 via CLI, will require manual secret sync.\x1b[0m', err.message);
  }

  // 4. Print Cloudflare secrets put commands
  console.log('\n\x1b[36mCloudflare Secret Key Mapping:\x1b[0m');
  const envMap = {
    debater: 'STRIPE_PRICE_DEBATER',
    coach: 'STRIPE_PRICE_COACH',
    champion: 'STRIPE_PRICE_CHAMPION',
    pack10: 'STRIPE_PRICE_PACK10',
    pack25: 'STRIPE_PRICE_PACK25',
    pack60: 'STRIPE_PRICE_PACK60',
    eduSeat: 'STRIPE_PRICE_EDU_SEAT'
  };

  for (const [key, envVar] of Object.entries(envMap)) {
    console.log(`  ${envVar}=${priceResults[key]}`);
  }

  return priceResults;
}

main().catch(err => {
  console.error('\x1b[31mSetup failed:\x1b[0m', err);
  process.exit(1);
});
