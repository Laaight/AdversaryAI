const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../frontend/dist/img/figures');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const figures = [
  { id: 'lincoln', wiki: 'Abraham_Lincoln' },
  { id: 'churchill', wiki: 'Winston_Churchill' },
  { id: 'socrates', wiki: 'Socrates' },
  { id: 'douglass', wiki: 'Frederick_Douglass' },
  { id: 'mlk', wiki: 'Martin_Luther_King_Jr.' },
  { id: 'einstein', wiki: 'Albert_Einstein' },
  { id: 'aurelius', wiki: 'Marcus_Aurelius' },
  { id: 'voltaire', wiki: 'Voltaire' },
  { id: 'eleanor', wiki: 'Eleanor_Roosevelt' },
  { id: 'smith', wiki: 'Adam_Smith' },
  { id: 'cs_lewis', wiki: 'C._S._Lewis' },
  { id: 'aquinas', wiki: 'Thomas_Aquinas' },
  { id: 'nietzsche', wiki: 'Friedrich_Nietzsche' },
  { id: 'hitchens', wiki: 'Christopher_Hitchens' },
  { id: 'god_reformed', wiki: 'Creation_of_Adam' },
  { id: 'the_devil', wiki: 'The_Fallen_Angel_(painting)' }
];

async function downloadAll() {
  for (const f of figures) {
    const dest = path.join(outDir, `${f.id}.jpg`);
    try {
      console.log(`Fetching wiki for ${f.id} (${f.wiki})...`);
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${f.wiki}`, {
        headers: { 'User-Agent': 'AdversaryAIBot/1.0 (contact@getadversaryai.com)' }
      });
      if (!res.ok) {
        console.error(`Failed summary for ${f.id}: ${res.status}`);
        continue;
      }
      const data = await res.json();
      const imgUrl = data.thumbnail?.source || data.originalimage?.source;
      if (!imgUrl) {
        console.warn(`No image found for ${f.id}`);
        continue;
      }
      const imgRes = await fetch(imgUrl, {
        headers: { 'User-Agent': 'AdversaryAIBot/1.0 (contact@getadversaryai.com)' }
      });
      if (!imgRes.ok) {
        console.error(`Failed to download image for ${f.id}: ${imgRes.status}`);
        continue;
      }
      const buf = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync(dest, buf);
      console.log(`Saved ${f.id}.jpg (${buf.byteLength} bytes)`);
    } catch (err) {
      console.error(`Error for ${f.id}:`, err);
    }
  }
}

downloadAll();
