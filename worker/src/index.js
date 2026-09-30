var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// worker/src/config.ts
var config_exports = {};
__export(config_exports, {
  EDU: () => EDU,
  FIGURE_VOICES: () => FIGURE_VOICES,
  OWNER_EMAILS: () => OWNER_EMAILS,
  PACKS: () => PACKS,
  PERSONALITY_VOICES: () => PERSONALITY_VOICES,
  PERSONA_VISUAL_VOICES: () => PERSONA_VISUAL_VOICES,
  TIERS: () => TIERS,
  getStripePriceIds: () => getStripePriceIds,
  isOwnerEmail: () => isOwnerEmail
});
function getStripePriceIds(env) {
  return {
    debater: env.STRIPE_PRICE_DEBATER,
    coach: env.STRIPE_PRICE_COACH,
    champion: env.STRIPE_PRICE_CHAMPION,
    pack10: env.STRIPE_PRICE_PACK10,
    pack25: env.STRIPE_PRICE_PACK25,
    pack60: env.STRIPE_PRICE_PACK60,
    eduSeat: env.STRIPE_PRICE_EDU_SEAT
  };
}
async function getStripePriceIdsAsync(env) {
  const ids = {
    debater: env.STRIPE_PRICE_DEBATER,
    coach: env.STRIPE_PRICE_COACH,
    champion: env.STRIPE_PRICE_CHAMPION,
    pack10: env.STRIPE_PRICE_PACK10,
    pack25: env.STRIPE_PRICE_PACK25,
    pack60: env.STRIPE_PRICE_PACK60,
    eduSeat: env.STRIPE_PRICE_EDU_SEAT
  };
  if (env.DB) {
    try {
      const rows = (await env.DB.prepare("SELECT key, value FROM app_config WHERE key LIKE 'stripe_price_%'").all())?.results ?? [];
      for (const row of rows) {
        const k = row.key.replace("stripe_price_", "");
        if (!ids[k] && row.value) {
          ids[k] = row.value;
        }
      }
    } catch {}
  }
  return ids;
}
function isOwnerEmail(email, env) {
  const extra = (env?.OWNER_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return (/* @__PURE__ */ new Set([...OWNER_EMAILS, ...extra])).has(email.trim().toLowerCase());
}
var TIERS, PACKS, EDU, PERSONALITY_VOICES, FIGURE_VOICES, PERSONA_VISUAL_VOICES, OWNER_EMAILS;
var init_config = __esm({
  "worker/src/config.ts"() {
    "use strict";
    TIERS = {
      trial: { name: "Trial", debates: 15, rounds: 15, lifetime: true, price: 0 },
      debater: { name: "Debater", priceMonthly: 12, debatesPerMonth: 300, roundsPerMonth: 300, blurb: "All 11 practice modes, voiced 3D opponents with lip-sync, coaching scorecards, and credit rollover." },
      coach: { name: "Coach", priceMonthly: 29, debatesPerMonth: 1000, roundsPerMonth: 1000, analytics: true, blurb: "Detailed coaching analytics, scorecard rubrics, and judge feedback. Unused credits roll over." },
      champion: { name: "Champion", priceMonthly: 49, debatesPerMonth: 1e3, roundsPerMonth: 1e3, premiumModel: true, photorealMinutes: 150, blurb: "Photoreal video opponents that look you in the eye, our strongest reasoning model for sharper arguments and deeper judge feedback, and priority speed." }
    };
    PACKS = [
      { id: "pack10", name: "100 Rounds", debates: 100, rounds: 100, price: 9 },
      { id: "pack25", name: "250 Rounds", debates: 250, rounds: 250, price: 19 },
      { id: "pack60", name: "600 Rounds", debates: 600, rounds: 600, price: 39 }
    ];
    EDU = {
      /** Displayed price per seat per month (USD). Stripe price configured via STRIPE_PRICE_EDU_SEAT. */
      pricePerSeatMonthly: 6,
      /** Monthly debate rounds each paid seat contributes to the org pool. */
      sessionsPerSeat: 300,
      roundsPerSeat: 300
    };
    PERSONALITY_VOICES = {
      prosecutor: "en-US-DavisNeural",
      professor: "en-US-BrianNeural",
      contrarian: "en-US-AvaNeural",
      coach: "en-US-JennyNeural",
      theist_mathematician: "en-US-BrianNeural",
      secular_rationalist: "en-US-DavisNeural",
      evolutionary_biologist: "en-US-RogerNeural",
      islamic_theologian: "en-US-JasonNeural",
      biblical_creationist: "en-US-GuyNeural",
      moral_humanist: "en-US-SaraNeural",
      archetypal_psychologist: "en-US-DavisNeural",
      jordan_peterson: "en-US-DavisNeural"
    };
    FIGURE_VOICES = {
      lincoln: "en-US-DavisNeural",
      churchill: "en-US-BrianNeural",
      socrates: "en-US-JasonNeural",
      douglass: "en-US-GuyNeural",
      mlk: "en-US-ChristopherNeural",
      einstein: "en-US-TonyNeural",
      aurelius: "en-US-RogerNeural",
      voltaire: "en-US-AndrewNeural",
      eleanor: "en-US-SaraNeural",
      smith: "en-US-RyanMultilingualNeural",
      god_reformed: "en-US-ChristopherNeural",
      the_devil: "en-US-BrianNeural",
      cs_lewis: "en-US-AndrewMultilingualNeural",
      aquinas: "en-US-JasonNeural",
      nietzsche: "en-US-RogerNeural",
      hitchens: "en-US-GuyNeural"
    };
    PERSONA_VISUAL_VOICES = {
      "teen-boy": "en-US-TonyNeural",
      "teen-girl": "en-US-AriaNeural",
      "man-pro": "en-US-GuyNeural",
      "woman-pro": "en-US-JennyNeural",
      "older-man": "en-US-DavisNeural",
      "older-woman": "en-US-JennyNeural",
      "man-casual": "en-US-GuyNeural",
      "woman-casual": "en-US-JennyNeural",
      "default-masc": "en-US-GuyNeural",
      "default-fem": "en-US-JennyNeural"
    };
    __name(getStripePriceIds, "getStripePriceIds");
    OWNER_EMAILS = ["matthewmhuston@gmail.com"];
    __name(isOwnerEmail, "isOwnerEmail");
  }
});

// worker/node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// worker/node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// worker/node_modules/hono/dist/utils/buffer.js
var bufferToFormData = /* @__PURE__ */ __name((arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      // Normalize the media type (case-insensitive) while keeping parameters like the boundary
      "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase())
    }
  });
  return response.formData();
}, "bufferToFormData");

// worker/node_modules/hono/dist/utils/body.js
var MAX_NESTING_DEPTH = 32;
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = /* @__PURE__ */ __name((request) => "headers" in request, "isRawRequest");
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const contentType = headers.get("Content-Type");
  const mediaType = contentType?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) {
    return convertFormDataToBodyData(
      await request.bodyCache.formData,
      options
    );
  }
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) {
    request.bodyCache.formData = formDataPromise;
  }
  const formData = await formDataPromise;
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value, nestingState);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".", MAX_NESTING_DEPTH + 2);
  if (keys.length > MAX_NESTING_DEPTH + 1) {
    throwNestingLimitExceeded();
  }
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS) {
          throwNestingLimitExceeded();
        }
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");
var throwNestingLimitExceeded = /* @__PURE__ */ __name(() => {
  throw new Error("Nesting limit exceeded");
}, "throwNestingLimitExceeded");

// worker/node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str, "tryDecodeURIComponent");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return tryDecodeURIComponent(value);
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1) {
    url = url.slice(0, hashIndex);
  }
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// worker/node_modules/hono/dist/request.js
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = tryDecodeURIComponent(value);
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    for (const anyCachedKey in bodyCache) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        const contentType = anyCachedKey === "formData" ? void 0 : raw2.headers.get("content-type");
        return new Response(body, {
          headers: contentType ? { "Content-Type": contentType } : void 0
        })[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    ;
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// worker/node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// worker/node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   // Append multiple headers using the append option (e.g. Vary)
   *   c.header('Vary', 'Accept-Encoding', { append: true })
   *   c.header('Vary', 'User-Agent', { append: true })
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) {
        if (key === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) {
          if (++count > 1 || typeof headers[k] !== "string") {
            responseHeaders = new Headers();
            break;
          }
        }
      }
      if (responseHeaders) {
        for (const k in headers) {
          const v = headers[k];
          if (typeof v === "string") {
            responseHeaders.set(k, v);
          } else {
            responseHeaders.delete(k);
            for (const v2 of v) {
              responseHeaders.append(k, v2);
            }
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibytes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// worker/node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch", "query"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// worker/node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// worker/node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(methodName, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(methodName, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler of handlers) {
            this.#addRoute(methodName, this.#path, handler);
          }
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} env - env Object
   * @param {ExecutionContext} executionCtx - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// worker/node_modules/hono/dist/router/utils.js
var createNullObject = /* @__PURE__ */ __name(() => /* @__PURE__ */ Object.create(null), "createNullObject");

// worker/node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// worker/node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return b === TAIL_WILDCARD_REG_EXP_STR ? -1 : 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  // handler index of a dynamic path, or -1 for a static path terminal
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, isStatic) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : null : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
        if (name && pattern[2]) {
          if (regexpStr === ".*") {
            throw PATH_ERROR;
          }
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) {
            throw PATH_ERROR;
          }
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) {
            throw PATH_ERROR;
          }
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ONLY_WILDCARD_REG_EXP_STR && regexpStr !== TAIL_WILDCARD_REG_EXP_STR) {
            for (const k in node.#children) {
              if (
                // a single-char pattern coexists with single-char literals as a literal does
                (regexpStr.length > 1 || k.length > 1) && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
              ) {
                throw PATH_ERROR;
              }
            }
          }
          nextNode = node.#children[regexpStr] = new _Node();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) {
            if (k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR) {
              throw PATH_ERROR;
            }
          }
          nextNode = node.#children[token] = new _Node();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) {
      throw PATH_ERROR;
    }
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// worker/node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  // dynamic path -> [handler index, param assoc]; static paths are not registered
  paths = createNullObject();
  insert(path, isStatic) {
    if (isStatic) {
      this.#root.insert(path.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// worker/node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = createNullObject();
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    `^${path.replace(
      /\/:[^/{}]+(?:\{\[\^\/]\+})?(?=[/{]|$)|\/?\*$|([.\\+*[^\]$()?{}|])/g,
      (match2, metaChar) => metaChar ? `\\${metaChar}` : match2 === "/*" ? TAIL_WILDCARD_REG_EXP_STR : match2 === "*" ? ONLY_WILDCARD_REG_EXP_STR : `/:${LABEL_REG_EXP_STR}`
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function findMiddleware(middleware, path) {
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: createNullObject() };
    this.#routes = { [METHOD_NAME_ALL]: createNullObject() };
    this.#tries = { [METHOD_NAME_ALL]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      for (const handlerMap of [middleware, routes]) {
        handlerMap[method] = createNullObject();
        for (const p in handlerMap[METHOD_NAME_ALL]) {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
          this.#insertPath(method, p);
        }
      }
    }
    if (path === "/*") {
      path = "*";
    }
    const methods = method === METHOD_NAME_ALL ? Object.keys(middleware) : [method];
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      for (const m of methods) {
        if (!middleware[m][path]) {
          this.#insertPath(m, path);
          middleware[m][path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        }
      }
      for (const handlerMap of [middleware, routes]) {
        for (const m of methods) {
          for (const p in handlerMap[m]) {
            re.test(p) && handlerMap[m][p].push([handler, path]);
          }
        }
      }
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (const path2 of paths) {
      for (const m of methods) {
        if (!routes[m][path2]) {
          this.#insertPath(m, path2);
          routes[m][path2] = findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || [];
        }
        routes[m][path2].push([handler, path2]);
      }
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#routes)) {
      matchers[method] = this.#buildMatcher(method);
    }
    this.#middleware = this.#routes = this.#tries = void 0;
    wildcardRegExpCache = createNullObject();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (const r of [middleware, routes]) {
      for (const path in r) {
        const handlers = r[path];
        const pathData = trie.paths[path];
        if (!pathData) {
          staticMap[path] = [handlers.map(([h]) => [h, createNullObject()]), emptyParam];
          continue;
        }
        handlerData[pathData[0]] = handlers.map(([h, handlerPath]) => [
          h,
          trie.paths[handlerPath][1].reduceRight((map, [key], i) => {
            map[key] = paramReplacementMap[pathData[1][i][1]];
            return map;
          }, createNullObject())
        ]);
      }
    }
    return [regexp, indexReplacementMap.map((i) => handlerData[i]), staticMap];
  }
};

// worker/node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// worker/node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new _Node2();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam) {
        possibleKeys.add(pattern[1]);
      }
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: [...possibleKeys],
        score: ++order
      }
    });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          handlerSet.params[key] = params?.[key] && !i2 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true) {
            continue;
          }
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  node.#params,
                  params
                );
              }
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1]) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// worker/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node = new Node2();
  add(method, path, handler) {
    for (const result of checkOptionalParameter(path) || [path]) {
      this.#node.insert(method, result, handler);
    }
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// worker/node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// worker/node_modules/hono/dist/utils/cookie.js
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var relaxedCookieNameRegEx = /^[!#-:<>-[\]-~]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var trimCookieWhitespace = /* @__PURE__ */ __name((value) => {
  let start = 0;
  let end = value.length;
  while (start < end) {
    const charCode = value.charCodeAt(start);
    if (charCode !== 32 && charCode !== 9) {
      break;
    }
    start++;
  }
  while (end > start) {
    const charCode = value.charCodeAt(end - 1);
    if (charCode !== 32 && charCode !== 9) {
      break;
    }
    end--;
  }
  return start === 0 && end === value.length ? value : value.slice(start, end);
}, "trimCookieWhitespace");
var parse = /* @__PURE__ */ __name((cookie, name) => {
  if (name && cookie.indexOf(name) === -1) {
    return {};
  }
  const pairs = cookie.split(";");
  const parsedCookie = /* @__PURE__ */ Object.create(null);
  for (const pairStr of pairs) {
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      continue;
    }
    const cookieName = trimCookieWhitespace(pairStr.substring(0, valueStartPos));
    if (name && name !== cookieName || !relaxedCookieNameRegEx.test(cookieName) || cookieName in parsedCookie) {
      continue;
    }
    let cookieValue = trimCookieWhitespace(pairStr.substring(valueStartPos + 1));
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = tryDecodeURIComponent(cookieValue);
      if (name) {
        break;
      }
    }
  }
  return parsedCookie;
}, "parse");
var _serialize = /* @__PURE__ */ __name((name, value, opt = {}) => {
  if (!validCookieNameRegEx.test(name)) {
    throw new Error("Invalid cookie name");
  }
  let cookie = `${name}=${value}`;
  if (name.startsWith("__Secure-") && !opt.secure) {
    throw new Error("__Secure- Cookie must have Secure attributes");
  }
  if (name.startsWith("__Host-")) {
    if (!opt.secure) {
      throw new Error("__Host- Cookie must have Secure attributes");
    }
    if (opt.path !== "/") {
      throw new Error('__Host- Cookie must have Path attributes with "/"');
    }
    if (opt.domain) {
      throw new Error("__Host- Cookie must not have Domain attributes");
    }
  }
  for (const key of ["domain", "path", "sameSite", "priority"]) {
    if (opt[key] && /[;\r\n]/.test(opt[key])) {
      throw new Error(`${key} must not contain ";", "\\r", or "\\n"`);
    }
  }
  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    if (opt.maxAge > 3456e4) {
      throw new Error(
        "Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration."
      );
    }
    cookie += `; Max-Age=${opt.maxAge | 0}`;
  }
  if (opt.domain && opt.prefix !== "host") {
    cookie += `; Domain=${opt.domain}`;
  }
  if (opt.path) {
    cookie += `; Path=${opt.path}`;
  }
  if (opt.expires) {
    if (opt.expires.getTime() - Date.now() > 3456e7) {
      throw new Error(
        "Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future."
      );
    }
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) {
    cookie += "; HttpOnly";
  }
  if (opt.secure) {
    cookie += "; Secure";
  }
  if (opt.sameSite) {
    cookie += `; SameSite=${opt.sameSite.charAt(0).toUpperCase() + opt.sameSite.slice(1)}`;
  }
  if (opt.priority) {
    cookie += `; Priority=${opt.priority.charAt(0).toUpperCase() + opt.priority.slice(1)}`;
  }
  if (opt.partitioned) {
    if (!opt.secure) {
      throw new Error("Partitioned Cookie must have Secure attributes");
    }
    cookie += "; Partitioned";
  }
  return cookie;
}, "_serialize");
var serialize = /* @__PURE__ */ __name((name, value, opt) => {
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
}, "serialize");

// worker/node_modules/hono/dist/helper/cookie/index.js
var getCookie = /* @__PURE__ */ __name((c, key, prefix) => {
  const cookie = c.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return void 0;
    }
    let finalKey = key;
    if (prefix === "secure") {
      finalKey = "__Secure-" + key;
    } else if (prefix === "host") {
      finalKey = "__Host-" + key;
    }
    const obj2 = parse(cookie, finalKey);
    return obj2[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = parse(cookie);
  return obj;
}, "getCookie");
var generateCookie = /* @__PURE__ */ __name((name, value, opt) => {
  let cookie;
  if (opt?.prefix === "secure") {
    cookie = serialize("__Secure-" + name, value, { path: "/", ...opt, secure: true });
  } else if (opt?.prefix === "host") {
    cookie = serialize("__Host-" + name, value, {
      ...opt,
      path: "/",
      secure: true,
      domain: void 0
    });
  } else {
    cookie = serialize(name, value, { path: "/", ...opt });
  }
  return cookie;
}, "generateCookie");
var setCookie = /* @__PURE__ */ __name((c, name, value, opt) => {
  const cookie = generateCookie(name, value, opt);
  c.header("Set-Cookie", cookie, { append: true });
}, "setCookie");
var deleteCookie = /* @__PURE__ */ __name((c, name, opt) => {
  const deletedCookie = getCookie(c, name, opt?.prefix);
  setCookie(c, name, "", { ...opt, maxAge: 0 });
  return deletedCookie;
}, "deleteCookie");

// worker/src/db.ts
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
__name(nowIso, "nowIso");
function currentMonth() {
  return nowIso().slice(0, 7);
}
__name(currentMonth, "currentMonth");
function newId(bytes = 16) {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}
__name(newId, "newId");
async function sha256Hex(input) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (x) => x.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
async function getUserById(db, id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
}
__name(getUserById, "getUserById");
async function getUserByEmail(db, email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").bind(email.toLowerCase()).first();
}
__name(getUserByEmail, "getUserByEmail");
async function getSubscription(db, userId) {
  return db.prepare("SELECT * FROM subscriptions WHERE user_id = ?").bind(userId).first();
}
__name(getSubscription, "getSubscription");
var ACTIVE_STATUSES = /* @__PURE__ */ new Set(["active", "trialing", "past_due"]);
function isSubscriptionActive(sub) {
  return !!sub && sub.tier !== "none" && ACTIVE_STATUSES.has(sub.status);
}
__name(isSubscriptionActive, "isSubscriptionActive");
function resolvePlan(sub) {
  if (isSubscriptionActive(sub)) return sub.tier;
  return "trial";
}
__name(resolvePlan, "resolvePlan");
async function creditBalance(db, userId) {
  const row = await db.prepare("SELECT COALESCE(SUM(delta), 0) AS balance FROM credit_ledger WHERE user_id = ?").bind(userId).first();
  return row?.balance ?? 0;
}
__name(creditBalance, "creditBalance");
async function getMonthlyUsage(db, userId, month) {
  const row = await db.prepare("SELECT debates_used FROM usage_monthly WHERE user_id = ? AND month = ?").bind(userId, month).first();
  return row?.debates_used ?? 0;
}
__name(getMonthlyUsage, "getMonthlyUsage");
async function incrementMonthlyUsage(db, userId, month) {
  await db.prepare(
    `INSERT INTO usage_monthly (user_id, month, debates_used) VALUES (?, ?, 1)
       ON CONFLICT(user_id, month) DO UPDATE SET debates_used = debates_used + 1`
  ).bind(userId, month).run();
}
__name(incrementMonthlyUsage, "incrementMonthlyUsage");

// worker/src/orgs.ts
init_config();

// worker/src/billing.ts
init_config();
var STRIPE_API = "https://api.stripe.com/v1";
async function stripePost(env, path, params) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) body.append(key, value);
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      // Stripe expects the secret key as the Basic-auth username, empty password.
      Authorization: `Basic ${btoa(`${env.STRIPE_SECRET_KEY}:`)}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Stripe API ${path} failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}
__name(stripePost, "stripePost");
async function requireUser(c) {
  return await getSessionUser(c);
}
__name(requireUser, "requireUser");
var billingRouter = new Hono2();
billingRouter.post("/api/billing/checkout", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.json().catch(() => ({}));
  const { kind, item } = body;
  const priceIds = await getStripePriceIdsAsync(c.env);
  const existing = await getSubscription(c.env.DB, user.id);
  const params = {
    client_reference_id: user.id,
    success_url: `${c.env.APP_URL}/app/#/account?checkout=success`,
    cancel_url: `${c.env.APP_URL}/app/#/account?checkout=cancelled`
  };
  // Always bill the same Stripe customer so the portal, invoices and upgrades line up.
  if (existing?.stripe_customer_id) params["customer"] = existing.stripe_customer_id;
  else if (user.email) params["customer_email"] = user.email;
  if (kind === "subscription" && (item === "debater" || item === "coach" || item === "champion")) {
    const priceId = priceIds[item];
    if (!priceId) return c.json({ error: "price not configured" }, 500);
    // A second Checkout would create a second subscription (double billing). Plan changes go
    // through the Stripe portal, which prorates and swaps the price on the existing subscription.
    if (isSubscriptionActive(existing) && existing.stripe_subscription_id) {
      return c.json({ error: "already_subscribed", message: "You already have an active plan. Use “Manage billing” to change it." }, 409);
    }
    params["mode"] = "subscription";
    params["line_items[0][price]"] = priceId;
    params["line_items[0][quantity]"] = "1";
    params["metadata[userId]"] = user.id;
    params["metadata[kind]"] = "subscription";
    params["metadata[item]"] = item;
  } else if (kind === "pack" && typeof item === "string") {
    const pack = PACKS.find((p) => p.id === item);
    if (!pack) return c.json({ error: "unknown pack" }, 400);
    const priceId = priceIds[pack.id];
    if (!priceId) return c.json({ error: "price not configured" }, 500);
    params["mode"] = "payment";
    params["line_items[0][price]"] = priceId;
    params["line_items[0][quantity]"] = "1";
    params["metadata[userId]"] = user.id;
    params["metadata[kind]"] = "pack";
    params["metadata[debates]"] = String(pack.debates);
  } else {
    return c.json({ error: "invalid kind/item" }, 400);
  }
  try {
    const session = await stripePost(c.env, "/checkout/sessions", params);
    if (!session.url) return c.json({ error: "checkout session missing url" }, 502);
    return c.json({ url: session.url });
  } catch (err) {
    console.error("checkout failed", err);
    return c.json({ error: "checkout failed" }, 502);
  }
});
billingRouter.post("/api/billing/portal", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  let customerId = null;
  const row = await c.env.DB.prepare(
    "SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?"
  ).bind(user.id).first();
  customerId = row?.stripe_customer_id ?? null;
  try {
    if (!customerId) {
      const customerParams = {
        "metadata[userId]": user.id
      };
      if (user.email) customerParams["email"] = user.email;
      const customer = await stripePost(c.env, "/customers", customerParams);
      customerId = customer.id;
      await c.env.DB.prepare(
        `INSERT INTO subscriptions (user_id, stripe_customer_id)
         VALUES (?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           stripe_customer_id = excluded.stripe_customer_id`
      ).bind(user.id, customerId).run();
    }
    const portal = await stripePost(c.env, "/billing_portal/sessions", {
      customer: customerId,
      return_url: `${c.env.APP_URL}/app/#/account`
    });
    if (!portal.url) return c.json({ error: "portal session missing url" }, 502);
    return c.json({ url: portal.url });
  } catch (err) {
    console.error("portal failed", err);
    return c.json({ error: "portal failed" }, 502);
  }
});
billingRouter.get("/api/billing/prices", (c) => {
  const tiers = Object.entries(TIERS).filter(([id]) => id !== "trial").map(([id, t]) => {
    const debates = Number(t.roundsPerMonth ?? t.debatesPerMonth ?? t.rounds ?? t.debates ?? 0);
    return {
      id,
      name: String(t.name ?? id),
      price: Math.round(Number(t.priceMonthly ?? t.price ?? 0) * 100),
      currency: "usd",
      interval: "month",
      debates,
      rounds: debates,
      credits: debates,
      description: String(t.blurb ?? ""),
      ...id === "champion" ? { photoreal: !!c.env.LIVEAVATAR_API_KEY, photorealMinutes: videoMinutesCap(c.env) } : {}
    };
  });
  const packs = PACKS.map((p) => ({
    id: p.id,
    name: p.name,
    price: Math.round(p.price * 100),
    currency: "usd",
    credits: p.debates,
    rounds: p.debates,
    debates: p.debates
  }));
  return c.json({ tiers, packs });
});

// worker/src/orgs.ts
var ACTIVE_ORG_STATUSES = /* @__PURE__ */ new Set(["active", "trialing"]);
async function isOrgMember(db, userId) {
  const row = await db.prepare("SELECT 1 FROM org_members WHERE user_id = ? LIMIT 1").bind(userId).first();
  return !!row;
}
__name(isOrgMember, "isOrgMember");
async function getUserOrgs(db, userId) {
  const rows = await db.prepare(
    `SELECT o.*, m.role AS member_role, m.joined_at AS member_joined_at
       FROM org_members m JOIN orgs o ON o.id = m.org_id
       WHERE m.user_id = ? ORDER BY m.joined_at`
  ).bind(userId).all();
  return (rows.results ?? []).map((r) => ({
    org: r,
    role: r.member_role,
    joined_at: r.member_joined_at
  }));
}
__name(getUserOrgs, "getUserOrgs");
async function getUserActiveOrgs(db, userId) {
  const rows = await db.prepare(
    `SELECT o.* FROM org_members m JOIN orgs o ON o.id = m.org_id
       WHERE m.user_id = ? AND o.status IN ('active', 'trialing')
       ORDER BY m.joined_at`
  ).bind(userId).all();
  return rows.results ?? [];
}
__name(getUserActiveOrgs, "getUserActiveOrgs");
async function getOrgMonthlyUsage(db, orgId, month) {
  const row = await db.prepare("SELECT sessions_used FROM org_usage_monthly WHERE org_id = ? AND month = ?").bind(orgId, month).first();
  return row?.sessions_used ?? 0;
}
__name(getOrgMonthlyUsage, "getOrgMonthlyUsage");
async function incrementOrgMonthlyUsage(db, orgId, month) {
  await db.prepare(
    `INSERT INTO org_usage_monthly (org_id, month, sessions_used) VALUES (?, ?, 1)
       ON CONFLICT(org_id, month) DO UPDATE SET sessions_used = sessions_used + 1`
  ).bind(orgId, month).run();
}
__name(incrementOrgMonthlyUsage, "incrementOrgMonthlyUsage");
async function membershipRole(db, orgId, userId) {
  const row = await db.prepare("SELECT role FROM org_members WHERE org_id = ? AND user_id = ?").bind(orgId, userId).first();
  return row?.role ?? null;
}
__name(membershipRole, "membershipRole");
async function getOrg(db, orgId) {
  return db.prepare("SELECT * FROM orgs WHERE id = ?").bind(orgId).first();
}
__name(getOrg, "getOrg");
var INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function newInviteCode() {
  const b = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(b, (x) => INVITE_ALPHABET[x % INVITE_ALPHABET.length]).join("");
}
__name(newInviteCode, "newInviteCode");
async function seatAvailability(db, orgId) {
  const org = await getOrg(db, orgId);
  if (!org) return { ok: false, error: "not_found" };
  if (!ACTIVE_ORG_STATUSES.has(org.status)) return { ok: false, error: "subscription_inactive" };
  const row = await db.prepare("SELECT COUNT(*) AS n FROM org_members WHERE org_id = ?").bind(orgId).first();
  if ((row?.n ?? 0) >= org.seat_count) return { ok: false, error: "seats_exhausted" };
  return { ok: true };
}
__name(seatAvailability, "seatAvailability");
var orgsRouter = new Hono2();
orgsRouter.post("/", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (!name) return c.json({ error: "name_required" }, 400);
  if (name.length > 120) return c.json({ error: "name_too_long" }, 400);
  const id = newId();
  await c.env.DB.prepare(
    "INSERT INTO orgs (id, name, created_by, created_at) VALUES (?, ?, ?, ?)"
  ).bind(id, name, user.id, nowIso()).run();
  await c.env.DB.prepare(
    "INSERT INTO org_members (org_id, user_id, role, joined_at) VALUES (?, ?, 'owner', ?)"
  ).bind(id, user.id, nowIso()).run();
  return c.json({ ok: true, org: { id, name } }, 201);
});
orgsRouter.get("/mine", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const memberships = await getUserOrgs(c.env.DB, user.id);
  const month = currentMonth();
  const orgs = await Promise.all(
    memberships.map(async (m) => {
      const memberCount = (await c.env.DB.prepare("SELECT COUNT(*) AS n FROM org_members WHERE org_id = ?").bind(m.org.id).first())?.n ?? 0;
      const sessionsUsed = await getOrgMonthlyUsage(c.env.DB, m.org.id, month);
      return {
        id: m.org.id,
        name: m.org.name,
        role: m.role,
        status: m.org.status,
        seatCount: m.org.seat_count,
        memberCount,
        sessionsUsed,
        sessionsPool: m.org.seat_count * EDU.sessionsPerSeat,
        subscriptionActive: ACTIVE_ORG_STATUSES.has(m.org.status)
      };
    })
  );
  return c.json({ orgs });
});
orgsRouter.get("/join/:code", async (c) => {
  const code = c.req.param("code").toUpperCase().trim();
  const invite = await c.env.DB.prepare("SELECT * FROM org_invites WHERE code = ?").bind(code).first();
  if (!invite) return c.json({ error: "invalid_code" }, 404);
  if (invite.uses >= invite.max_uses) return c.json({ error: "code_exhausted" }, 410);
  if (invite.expires_at && invite.expires_at < nowIso())
    return c.json({ error: "code_expired" }, 410);
  const org = await getOrg(c.env.DB, invite.org_id);
  if (!org) return c.json({ error: "invalid_code" }, 404);
  return c.json({ ok: true, orgName: org.name, role: invite.role, code: invite.code });
});
orgsRouter.post("/join", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.json().catch(() => ({}));
  const code = String(body.code ?? "").trim().toUpperCase();
  if (!code) return c.json({ error: "code_required" }, 400);
  const invite = await c.env.DB.prepare(
    "SELECT org_id, role, code, max_uses, uses, expires_at FROM org_invites WHERE code = ?"
  ).bind(code).first();
  if (!invite) return c.json({ error: "invalid_code" }, 404);
  if (invite.uses >= invite.max_uses) return c.json({ error: "code_exhausted" }, 410);
  if (invite.expires_at && invite.expires_at < nowIso())
    return c.json({ error: "code_expired" }, 410);
  const already = await membershipRole(c.env.DB, invite.org_id, user.id);
  if (already) return c.json({ error: "already_member" }, 409);
  const seats = await seatAvailability(c.env.DB, invite.org_id);
  if (!seats.ok) return c.json({ error: seats.error }, 403);
  await c.env.DB.prepare(
    "INSERT INTO org_members (org_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)"
  ).bind(invite.org_id, user.id, invite.role, nowIso()).run();
  await c.env.DB.prepare("UPDATE org_invites SET uses = uses + 1 WHERE code = ?").bind(invite.code).run();
  const org = await getOrg(c.env.DB, invite.org_id);
  return c.json({ ok: true, org: { id: invite.org_id, name: org?.name ?? "", role: invite.role } });
});
orgsRouter.get("/:id", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const org = await getOrg(c.env.DB, c.req.param("id"));
  if (!org) return c.json({ error: "not_found" }, 404);
  const role = await membershipRole(c.env.DB, org.id, user.id);
  if (!role) return c.json({ error: "forbidden" }, 403);
  const month = currentMonth();
  const memberCount = (await c.env.DB.prepare("SELECT COUNT(*) AS n FROM org_members WHERE org_id = ?").bind(org.id).first())?.n ?? 0;
  const sessionsUsed = await getOrgMonthlyUsage(c.env.DB, org.id, month);
  const res = {
    id: org.id,
    name: org.name,
    role,
    status: org.status,
    seatCount: org.seat_count,
    memberCount,
    sessionsUsed,
    sessionsPool: org.seat_count * EDU.sessionsPerSeat,
    subscriptionActive: ACTIVE_ORG_STATUSES.has(org.status)
  };
  if (role === "owner" || role === "teacher") {
    const members = await c.env.DB.prepare(
      `SELECT u.id, u.email, m.role, m.joined_at
       FROM org_members m JOIN users u ON u.id = m.user_id
       WHERE m.org_id = ? ORDER BY m.joined_at`
    ).bind(org.id).all();
    const invites = await c.env.DB.prepare(
      "SELECT code, role, max_uses, uses, expires_at, created_at FROM org_invites WHERE org_id = ? ORDER BY created_at DESC"
    ).bind(org.id).all();
    res.members = members.results ?? [];
    res.invites = (invites.results ?? []).map((inv) => ({
      ...inv,
      url: `${c.env.APP_URL}/app/#/join/${inv.code}`
    }));
  }
  return c.json({ org: res });
});
orgsRouter.post("/:id/invites", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const orgId = c.req.param("id");
  const role = await membershipRole(c.env.DB, orgId, user.id);
  if (role !== "owner" && role !== "teacher") return c.json({ error: "forbidden" }, 403);
  const body = await c.req.json().catch(() => ({}));
  const inviteRole = body.role === "teacher" ? "teacher" : "student";
  if (inviteRole === "teacher" && role !== "owner")
    return c.json({ error: "only_owner_invites_teachers" }, 403);
  const maxUses = Math.min(1e3, Math.max(1, Number(body.maxUses ?? 50) || 50));
  const expiresInDays = Number(body.expiresInDays ?? 30) || 30;
  const expiresAt = expiresInDays > 0 ? new Date(Date.now() + expiresInDays * 864e5).toISOString() : null;
  let code = "";
  for (let i = 0; i < 5; i++) {
    const candidate = newInviteCode();
    const exists = await c.env.DB.prepare("SELECT 1 FROM org_invites WHERE code = ?").bind(candidate).first();
    if (!exists) {
      code = candidate;
      break;
    }
  }
  if (!code) return c.json({ error: "code_generation_failed" }, 500);
  await c.env.DB.prepare(
    `INSERT INTO org_invites (code, org_id, role, max_uses, expires_at, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(code, orgId, inviteRole, maxUses, expiresAt, user.id, nowIso()).run();
  return c.json(
    { ok: true, code, url: `${c.env.APP_URL}/app/#/join/${code}` },
    201
  );
});
orgsRouter.delete("/:id/invites/:code", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const orgId = c.req.param("id");
  const role = await membershipRole(c.env.DB, orgId, user.id);
  if (role !== "owner" && role !== "teacher") return c.json({ error: "forbidden" }, 403);
  await c.env.DB.prepare("DELETE FROM org_invites WHERE code = ? AND org_id = ?").bind(c.req.param("code").toUpperCase(), orgId).run();
  return c.json({ ok: true });
});
orgsRouter.get("/:id/members", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const orgId = c.req.param("id");
  const role = await membershipRole(c.env.DB, orgId, user.id);
  if (role !== "owner" && role !== "teacher") return c.json({ error: "forbidden" }, 403);
  const members = await c.env.DB.prepare(
    `SELECT u.id, u.email, m.role, m.joined_at
     FROM org_members m JOIN users u ON u.id = m.user_id
     WHERE m.org_id = ? ORDER BY m.joined_at`
  ).bind(orgId).all();
  return c.json({ members: members.results ?? [] });
});
orgsRouter.delete("/:id/members/:userId", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const orgId = c.req.param("id");
  const targetId = c.req.param("userId");
  const role = await membershipRole(c.env.DB, orgId, user.id);
  if (role !== "owner") return c.json({ error: "forbidden" }, 403);
  if (targetId === user.id) return c.json({ error: "cannot_remove_self" }, 400);
  await c.env.DB.prepare("DELETE FROM org_members WHERE org_id = ? AND user_id = ?").bind(orgId, targetId).run();
  return c.json({ ok: true });
});
orgsRouter.post("/:id/checkout", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const orgId = c.req.param("id");
  const role = await membershipRole(c.env.DB, orgId, user.id);
  if (role !== "owner") return c.json({ error: "forbidden" }, 403);
  const org = await getOrg(c.env.DB, orgId);
  if (!org) return c.json({ error: "not_found" }, 404);
  const body = await c.req.json().catch(() => ({}));
  const seats = Math.min(5e3, Math.max(1, Math.floor(Number(body.seats ?? 0)) || 0));
  if (!seats) return c.json({ error: "seats_required" }, 400);
  const priceId = (await getStripePriceIdsAsync(c.env)).eduSeat;
  if (!priceId) return c.json({ error: "price not configured" }, 500);
  try {
    const session = await stripePost(c.env, "/checkout/sessions", {
      client_reference_id: user.id,
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": String(seats),
      "metadata[userId]": user.id,
      "metadata[kind]": "org_subscription",
      "metadata[orgId]": orgId,
      "metadata[seats]": String(seats),
      success_url: `${c.env.APP_URL}/app/#/org/${orgId}?checkout=success`,
      cancel_url: `${c.env.APP_URL}/app/#/org/${orgId}?checkout=cancelled`
    });
    if (!session.url) return c.json({ error: "checkout session missing url" }, 502);
    return c.json({ url: session.url });
  } catch (err) {
    console.error("org checkout failed", err);
    return c.json({ error: "checkout failed" }, 502);
  }
});
orgsRouter.post("/:id/portal", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const orgId = c.req.param("id");
  const role = await membershipRole(c.env.DB, orgId, user.id);
  if (role !== "owner") return c.json({ error: "forbidden" }, 403);
  const org = await getOrg(c.env.DB, orgId);
  if (!org) return c.json({ error: "not_found" }, 404);
  if (!org.stripe_customer_id) return c.json({ error: "no_subscription" }, 400);
  try {
    const portal = await stripePost(c.env, "/billing_portal/sessions", {
      customer: org.stripe_customer_id,
      return_url: `${c.env.APP_URL}/app/#/org/${orgId}`
    });
    if (!portal.url) return c.json({ error: "portal session missing url" }, 502);
    return c.json({ url: portal.url });
  } catch (err) {
    console.error("org portal failed", err);
    return c.json({ error: "portal failed" }, 502);
  }
});

// worker/src/auth.ts
var SESSION_COOKIE = "adversaryai_session";
var SESSION_MAX_AGE = 60 * 60 * 24 * 30;
var SALT_BYTES = 16;
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Legacy (v0) hash: one SHA-256. Kept only to verify old accounts, which are re-hashed on login.
async function hashPasswordLegacy(password, saltHex) {
  return sha256Hex(`${saltHex}:${password}`);
}
__name(hashPasswordLegacy, "hashPasswordLegacy");
// Workers' WebCrypto rejects PBKDF2 above 100,000 iterations ("iteration counts above 100000 are not
// supported"), which made every sign-up fail. Stored "pbkdf2$" hashes use this count; changing it
// would invalidate them.
var PBKDF2_ITER = 1e5;
async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(saltHex), iterations: PBKDF2_ITER }, key, 256);
  return "pbkdf2$" + Array.from(new Uint8Array(bits), (x) => x.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, user) {
  const stored = String(user.password_hash || "");
  if (stored.startsWith("pbkdf2$")) return { ok: timingSafeEqual(await hashPassword(password, user.salt), stored), upgrade: false };
  const legacy = await hashPasswordLegacy(password, user.salt);
  return { ok: timingSafeEqual(legacy, stored), upgrade: true };
}
__name(verifyPassword, "verifyPassword");
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
__name(timingSafeEqual, "timingSafeEqual");
function cookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_MAX_AGE
  };
}
__name(cookieOptions, "cookieOptions");
async function createSession(c, userId) {
  const token = newId(32);
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1e3).toISOString();
  await c.env.DB.prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)").bind(newId(), userId, tokenHash, expiresAt).run();
  setCookie(c, SESSION_COOKIE, token, cookieOptions());
}
__name(createSession, "createSession");
function getSessionToken(c) {
  const header = c.req.header("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === SESSION_COOKIE) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}
__name(getSessionToken, "getSessionToken");
async function getSessionUser(c) {
  const token = getSessionToken(c);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await c.env.DB.prepare(
    `SELECT u.id, u.email FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`
  ).bind(tokenHash, nowIso()).first();
  return row ?? null;
}
__name(getSessionUser, "getSessionUser");
var authRouter = new Hono2();
authRouter.post("/signup", async (c) => {
  // Each trial account is worth real money (15 rounds of model + speech): throttle per IP. A valid
  // school invite skips it — a class shares one network, and the invite's use cap bounds it — but a
  // wrong invite code counts, so codes can't be guessed.
  const throttled = async () => !(await rateLimit(c.env.DB, `signup:${clientIp(c)}`, 20, 3600));
  const tooMany = () => c.json({ error: "rate_limited", message: "Too many sign-ups from this network — try again in an hour." }, 429);
  const body = await c.req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const inviteCode = String(body.inviteCode ?? "").trim().toUpperCase();
  if (!EMAIL_RE.test(email)) return c.json({ error: "invalid_email" }, 400);
  if (password.length < 8) return c.json({ error: "password_too_short" }, 400);
  let invite = null;
  if (inviteCode) {
    const row = await c.env.DB.prepare(
      "SELECT org_id, role, code, max_uses, uses, expires_at FROM org_invites WHERE code = ?"
    ).bind(inviteCode).first();
    if (!row) return await throttled() ? tooMany() : c.json({ error: "invalid_code" }, 404);
    if (row.uses >= row.max_uses) return c.json({ error: "code_exhausted" }, 410);
    if (row.expires_at && row.expires_at < nowIso()) return c.json({ error: "code_expired" }, 410);
    invite = row;
  }
  if (invite) {
    const seats = await seatAvailability(c.env.DB, invite.org_id);
    if (!seats.ok) return c.json({ error: seats.error }, 403);
  } else if (await throttled()) {
    return tooMany();
  }
  const existing = await getUserByEmail(c.env.DB, email);
  if (existing) return c.json({ error: "email_taken" }, 409);
  const salt = newId(SALT_BYTES);
  const passwordHash = await hashPassword(password, salt);
  const id = newId();
  await c.env.DB.prepare(
    "INSERT INTO users (id, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(id, email, passwordHash, salt, nowIso()).run();
  if (invite) {
    await c.env.DB.prepare(
      "INSERT INTO org_members (org_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)"
    ).bind(invite.org_id, id, invite.role, nowIso()).run();
    await c.env.DB.prepare("UPDATE org_invites SET uses = uses + 1 WHERE code = ?").bind(invite.code).run();
  }
  await createSession(c, id);
  const orgs = await getUserOrgs(c.env.DB, id);
  const org = orgs[0] ? { id: orgs[0].org.id, name: orgs[0].org.name, role: orgs[0].role } : null;
  return c.json({ ok: true, user: { id, email, plan: "trial", org } }, 201);
});
authRouter.post("/login", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!(await rateLimit(c.env.DB, `login:${clientIp(c)}`, 30, 900)) || (email && !(await rateLimit(c.env.DB, `login:${email}`, 10, 900)))) {
    return c.json({ error: "rate_limited", message: "Too many attempts — try again in 15 minutes." }, 429);
  }
  const user = email ? await getUserByEmail(c.env.DB, email) : null;
  const v = user ? await verifyPassword(password, user) : { ok: false };
  if (!user || !v.ok) {
    return c.json({ error: "invalid_credentials" }, 401);
  }
  if (v.upgrade) {
    // Silently move legacy accounts to PBKDF2 on their next successful login.
    try {
      await c.env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(await hashPassword(password, user.salt), user.id).run();
    } catch {
    }
  }
  await createSession(c, user.id);
  const sub = await getSubscription(c.env.DB, user.id);
  return c.json({ ok: true, user: { id: user.id, email: user.email, plan: resolvePlan(sub) } });
});
// Delete my account: everything we hold about the user. Password re-entry required.
// Active Stripe subscriptions are cancelled at period end so nothing keeps billing.
authRouter.post("/delete-account", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.json().catch(() => ({}));
  const v = await verifyPassword(String(body.password ?? ""), user);
  if (!v.ok) return c.json({ error: "invalid_credentials" }, 401);
  const db = c.env.DB;
  const sub = await getSubscription(db, user.id);
  if (sub?.stripe_subscription_id && isSubscriptionActive(sub)) {
    try {
      await stripePost(c.env, `/subscriptions/${sub.stripe_subscription_id}`, { cancel_at_period_end: "true" });
    } catch (e) {
      console.error("cancel on delete", e?.message || e);
    }
  }
  const debates = await db.prepare("SELECT id FROM debates WHERE user_id = ?").bind(user.id).all();
  const ids = (debates.results ?? []).map((r) => r.id);
  const stmts = [];
  for (const id of ids) {
    for (const t of ["turns", "verdicts", "debate_votes", "debate_reactions", "scorecards"]) stmts.push(db.prepare(`DELETE FROM ${t} WHERE debate_id = ?`).bind(id));
  }
  for (const t of ["debates", "credit_ledger", "usage_monthly", "promo_redemptions", "org_members", "subscriptions", "sessions", "tts_usage", "avatar_usage", "avatar_sessions", "speech_token_mints"]) {
    stmts.push(db.prepare(`DELETE FROM ${t} WHERE user_id = ?`).bind(user.id));
  }
  stmts.push(db.prepare("DELETE FROM users WHERE id = ?").bind(user.id));
  // Tables that may not exist yet are skipped one by one rather than failing the whole delete.
  for (const st of stmts) {
    try {
      await st.run();
    } catch {
    }
  }
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});
authRouter.post("/logout", async (c) => {
  const token = getSessionToken(c);
  if (token) {
    const tokenHash = await sha256Hex(token);
    await c.env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
  }
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});
authRouter.get("/me", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const isOwner = isOwnerEmail(user.email, c.env);
  const adminMode = isOwner ? (getCookie(c, "adversaryai_admin_mode") || "premium") : null;
  const sub = await getSubscription(c.env.DB, user.id);
  const orgs = await getUserOrgs(c.env.DB, user.id);
  const org = orgs[0] ? { id: orgs[0].org.id, name: orgs[0].org.name, role: orgs[0].role } : null;
  const champion = await isPremium(c, user.id, user.email);
  return c.json({ id: user.id, email: user.email, plan: resolvePlan(sub), org, isOwner, adminMode, champion, photoreal: !!c.env.LIVEAVATAR_API_KEY });
});

// worker/src/model.ts
// Throttling (429), 408, 5xx and dropped connections are usually gone a second later, so
// they get one short retry. Errors with a status outside that set fail straight through.
function isTransientModelError(err) {
  const s = err?.status;
  return !s || s === 408 || s === 429 || s >= 500;
}
__name(isTransientModelError, "isTransientModelError");
function retryDelayMs(res) {
  const ms = Number(res?.headers?.get("retry-after-ms")) || Number(res?.headers?.get("retry-after")) * 1e3 || (res?.status === 429 ? 1500 : 700);
  return Math.min(3e3, ms) + 200 + Math.floor(Math.random() * 400);
}
__name(retryDelayMs, "retryDelayMs");
async function modelHttpError(res, label) {
  const body = await res.text().catch(() => "");
  console.error(`[deepseek] ${label}HTTP ${res.status} body: ${body.slice(0, 3e3)}`);
  const err = new Error(
    `DeepSeek ${label}request failed: HTTP ${res.status} ${body.slice(0, 300)}`
  );
  err.status = res.status;
  err.retryAfterMs = retryDelayMs(res);
  // Azure puts the code after a ~280-char message, past the slice kept in err.message.
  err.contentFilter = /content_filter|ResponsibleAIPolicyViolation/i.test(body);
  return err;
}
__name(modelHttpError, "modelHttpError");
async function callOnce(baseUrl, apiKey, model, systemPrompt, userInput, maxTokens) {
  const init = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Never log this header value.
      "api-key": apiKey
    },
    body: JSON.stringify({
      // Azure AI Foundry routes by deployment name on this endpoint.
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput }
      ],
      max_tokens: maxTokens
    })
  };
  for (let attempt = 0; ; attempt++) {
    // Scoring and judging must not hang forever on a stalled upstream. Not streamed, so this
    // covers the whole generation: leave room for a reasoning model to use the 4000+ budget.
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 15e4);
    try {
      const res = await fetch(baseUrl, { ...init, signal: ac.signal });
      if (!res.ok) throw await modelHttpError(res, "");
      const data = await res.json();
      const message = data?.choices?.[0]?.message ?? {};
      const text = typeof message.content === "string" ? message.content.trim() : "";
      return {
        text,
        hitTokenCap: data?.choices?.[0]?.finish_reason === "length"
      };
    } catch (err) {
      // A timeout is not retried: the user is already waiting on End & grade.
      if (ac.signal.aborted) throw new Error("DeepSeek request timed out");
      if (attempt >= 1 || !isTransientModelError(err)) throw err;
      console.warn(`[deepseek] ${err?.status ? `HTTP ${err.status}` : `fetch failed: ${err?.message || err}`}, retrying once`);
      await new Promise((r) => setTimeout(r, err?.retryAfterMs || retryDelayMs(null)));
    } finally {
      clearTimeout(timer);
    }
  }
}
__name(callOnce, "callOnce");
// One streamed completion. Records why it ended in `meta` (finishReason, sawDone, reasoning
// size) and aborts when upstream goes quiet, so a stalled model can't hang the turn forever.
async function* modelStreamOnce(baseUrl, apiKey, model, systemPrompt, userInput, maxTokens, meta) {
  // Until text or reasoning starts flowing, allow a long quiet spell: an early role or
  // filter-results chunk can be followed by a silent think before the first word.
  const FIRST_MS = 45e3, IDLE_MS = 2e4;
  const ac = new AbortController();
  let timedOut = false, reader = null, timer, waitMs = FIRST_MS, flowing = false;
  const arm = /* @__PURE__ */ __name((ms) => {
    clearTimeout(timer);
    waitMs = ms;
    timer = setTimeout(() => {
      timedOut = true;
      ac.abort();
      reader?.cancel().catch(() => {
      });
    }, ms);
  }, "arm");
  const stalled = /* @__PURE__ */ __name(() => new Error(`DeepSeek stream stalled: no data for ${waitMs / 1e3}s`), "stalled");
  // Returns the line's visible text. Hidden reasoning is counted but never shown.
  const parse = /* @__PURE__ */ __name((line) => {
    const t = line.trim();
    if (!t.startsWith("data:")) return "";
    const payload = t.slice(5).trim();
    if (payload === "[DONE]") {
      meta.sawDone = true;
      return "";
    }
    if (!payload) return "";
    let json;
    try {
      json = JSON.parse(payload);
    } catch {
      return "";
    }
    if (json?.error) {
      const e = json.error;
      const err = new Error(`DeepSeek stream error: ${String(e.message || e.code || "unknown").slice(0, 300)}`);
      if (/content_filter/i.test(String(e.code || ""))) err.status = 400;
      throw err;
    }
    const ch = json?.choices?.[0];
    if (ch?.finish_reason) meta.finishReason = ch.finish_reason;
    if (json?.usage) meta.usage = json.usage;
    const rc = ch?.delta?.reasoning_content ?? ch?.delta?.reasoning;
    if (typeof rc === "string") meta.reasoningChars += rc.length;
    const d = ch?.delta?.content;
    return typeof d === "string" ? d : "";
  }, "parse");
  arm(FIRST_MS);
  try {
    let res;
    try {
      res = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Never log this header value.
          "api-key": apiKey
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userInput }
          ],
          max_tokens: maxTokens,
          stream: true
        }),
        signal: ac.signal
      });
    } catch (err) {
      throw timedOut ? stalled() : err;
    }
    if (!res.ok || !res.body) throw await modelHttpError(res, "stream ");
    reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    for (; ; ) {
      let r;
      try {
        r = await reader.read();
      } catch (err) {
        throw timedOut ? stalled() : err;
      }
      if (timedOut) throw stalled();
      if (r.done) break;
      arm(flowing ? IDLE_MS : FIRST_MS);
      buf += decoder.decode(r.value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const d = parse(line);
        if (!flowing && (d || meta.reasoningChars)) {
          flowing = true;
          arm(IDLE_MS);
        }
        if (d) yield d;
        if (meta.sawDone) return;
      }
    }
    // Upstream closed: a last line may have arrived without its trailing newline.
    const d = parse(buf + decoder.decode());
    if (d) yield d;
  } finally {
    clearTimeout(timer);
    reader?.cancel().catch(() => {
    });
  }
}
__name(modelStreamOnce, "modelStreamOnce");
// Streams the reply's visible text. Pass `opts.meta = {}` to learn how it ended:
// finishReason ("stop" | "length" | "content_filter" | null), sawDone, reasoningChars, attempts.
async function* modelStream(env, systemPrompt, userInput, maxTokens, opts) {
  // Champion uses the Pro model when it's configured; otherwise fall back to the base model
  // rather than failing every Champion turn.
  const premium = !!opts?.premium && !!env.DEEPSEEK_PRO_URL && !!env.DEEPSEEK_PRO_MODEL && !!(env.FOUNDRY_KEY_DEEPSEEK_PRO || env.FOUNDRY_KEY);
  const baseUrl = premium ? env.DEEPSEEK_PRO_URL : env.DEEPSEEK_BASE_URL;
  const apiKey = premium ? env.FOUNDRY_KEY_DEEPSEEK_PRO || env.FOUNDRY_KEY : env.FOUNDRY_KEY;
  const model = premium ? env.DEEPSEEK_PRO_MODEL : env.DEEPSEEK_BASE_MODEL;
  if (!baseUrl) {
    throw new Error(
      premium ? "DEEPSEEK_PRO_URL is not configured" : "DEEPSEEK_BASE_URL is not configured"
    );
  }
  if (!model) {
    throw new Error(
      premium ? "DEEPSEEK_PRO_MODEL is not configured" : "DEEPSEEK_BASE_MODEL is not configured"
    );
  }
  if (!apiKey) {
    throw new Error(
      premium ? "FOUNDRY_KEY_DEEPSEEK_PRO is not configured" : "FOUNDRY_KEY is not configured"
    );
  }
  const meta = opts?.meta ?? {};
  meta.model = model;
  meta.attempts = 0;
  let budget = Math.max(1500, Math.floor(maxTokens));
  let yielded = false;
  for (; ; ) {
    meta.attempts++;
    meta.finishReason = null;
    meta.sawDone = false;
    meta.reasoningChars = 0;
    try {
      for await (const tok of modelStreamOnce(baseUrl, apiKey, model, systemPrompt, userInput, budget, meta)) {
        yielded = true;
        yield tok;
      }
      if (yielded || meta.attempts > 1 || meta.finishReason === "content_filter") return;
      // Nothing visible came back (e.g. hidden reasoning spent the whole budget). The client
      // has seen nothing yet, so one more try is invisible to it.
      if (meta.finishReason === "length") budget += 2e3;
      console.warn(`[deepseek] empty stream (finish=${meta.finishReason} done=${meta.sawDone} reasoning=${meta.reasoningChars}), retrying once`);
      await new Promise((r) => setTimeout(r, 400));
    } catch (err) {
      // Once text has gone out, a retry would repeat it: only retry before the first token.
      if (yielded || meta.attempts > 1 || !isTransientModelError(err)) throw err;
      console.warn(`[deepseek] stream failed before first token (${err?.status ? `HTTP ${err.status}` : err?.message || err}), retrying once`);
      await new Promise((r) => setTimeout(r, err?.retryAfterMs || retryDelayMs(null)));
    }
  }
}
__name(modelStream, "modelStream");
async function modelText(env, systemPrompt, userInput, maxTokens, opts) {
  // Champion uses the Pro model when it's configured; otherwise fall back to the base model
  // rather than failing every Champion turn.
  const premium = !!opts?.premium && !!env.DEEPSEEK_PRO_URL && !!env.DEEPSEEK_PRO_MODEL && !!(env.FOUNDRY_KEY_DEEPSEEK_PRO || env.FOUNDRY_KEY);
  const baseUrl = premium ? env.DEEPSEEK_PRO_URL : env.DEEPSEEK_BASE_URL;
  const apiKey = premium ? env.FOUNDRY_KEY_DEEPSEEK_PRO || env.FOUNDRY_KEY : env.FOUNDRY_KEY;
  const model = premium ? env.DEEPSEEK_PRO_MODEL : env.DEEPSEEK_BASE_MODEL;
  if (!baseUrl) {
    throw new Error(
      premium ? "DEEPSEEK_PRO_URL is not configured" : "DEEPSEEK_BASE_URL is not configured"
    );
  }
  if (!model) {
    throw new Error(
      premium ? "DEEPSEEK_PRO_MODEL is not configured" : "DEEPSEEK_BASE_MODEL is not configured"
    );
  }
  if (!apiKey) {
    throw new Error(
      premium ? "FOUNDRY_KEY_DEEPSEEK_PRO is not configured" : "FOUNDRY_KEY is not configured"
    );
  }
  let budget = Math.max(1500, Math.floor(maxTokens));
  let result;
  try {
    result = await callOnce(baseUrl, apiKey, model, systemPrompt, userInput, budget);
  } catch (err) {
    // A content-filter 400 fails the same way every time; other 400s are worth one more try.
    if (err.status === 400 && !err.contentFilter) {
      await new Promise((r) => setTimeout(r, 1500));
      result = await callOnce(baseUrl, apiKey, model, systemPrompt, userInput, budget);
    } else {
      throw err;
    }
  }
  if (result.hitTokenCap) {
    budget += 1e3;
    result = await callOnce(baseUrl, apiKey, model, systemPrompt, userInput, budget);
    // Callers parse this as JSON: a reply cut off twice would only be saved as garbage.
    if (result.hitTokenCap) throw new Error("Debate model output truncated at token cap");
  }
  if (!result.text) {
    throw new Error("Debate model returned an empty response");
  }
  return result.text;
}
__name(modelText, "modelText");

// worker/src/tts.ts
var VOICE_FALLBACKS = {
  prosecutor: "en-US-DavisNeural",
  professor: "en-US-JaneNeural",
  contrarian: "en-US-TonyNeural",
  coach: "en-US-AvaNeural"
};
var DEFAULT_VOICE = "en-US-AvaNeural";
async function getVoices() {
  try {
    const mod = await Promise.resolve().then(() => (init_config(), config_exports));
    if (mod?.PERSONALITY_VOICES && typeof mod.PERSONALITY_VOICES === "object") {
      return { ...VOICE_FALLBACKS, ...mod.PERSONALITY_VOICES };
    }
  } catch {
  }
  return VOICE_FALLBACKS;
}
__name(getVoices, "getVoices");
async function getFigureVoices() {
  try {
    const mod = await Promise.resolve().then(() => (init_config(), config_exports));
    if (mod?.FIGURE_VOICES && typeof mod.FIGURE_VOICES === "object") {
      return { ...mod.FIGURE_VOICES };
    }
  } catch {
  }
  return {};
}
__name(getFigureVoices, "getFigureVoices");
async function getPersonaVisualVoices() {
  try {
    const mod = await Promise.resolve().then(() => (init_config(), config_exports));
    if (mod?.PERSONA_VISUAL_VOICES && typeof mod.PERSONA_VISUAL_VOICES === "object") {
      return { ...mod.PERSONA_VISUAL_VOICES };
    }
  } catch {
  }
  return {};
}
__name(getPersonaVisualVoices, "getPersonaVisualVoices");
function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
__name(escapeXml, "escapeXml");
function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  const CHUNK = 32768;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(s);
}
__name(arrayBufferToBase64, "arrayBufferToBase64");
function estimateTimings(text, audioBytes) {
  const durationMs = Math.max(1, Math.round(audioBytes * 8 / 48));
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const perWord = durationMs / words.length;
  return words.map((word, i) => ({
    word,
    startMs: Math.round(i * perWord),
    endMs: Math.round((i + 1) * perWord)
  }));
}
__name(estimateTimings, "estimateTimings");
var PERSONALITY_SPEECH_STYLES = {
  professor: { style: "narration-professional" },
  contrarian: { style: "chat" },
  coach: { style: "cheerful" }
};
var VOICE_GENDER = {
  "en-US-DavisNeural": "m", "en-US-BrianNeural": "m", "en-US-RogerNeural": "m", "en-US-JasonNeural": "m", "en-US-GuyNeural": "m",
  "en-US-ChristopherNeural": "m", "en-US-TonyNeural": "m", "en-US-AndrewNeural": "m", "en-US-RyanMultilingualNeural": "m",
  "en-US-AndrewMultilingualNeural": "m", "en-US-AvaNeural": "f", "en-US-JennyNeural": "f", "en-US-SaraNeural": "f", "en-US-AriaNeural": "f"
};
async function resolveTtsVoice(personality, figureId, personaVisualId) {
  const figureVoices = await getFigureVoices();
  const personaVisualVoices = await getPersonaVisualVoices();
  const voices = await getVoices();
  let voice = voices[personality] || figureId && figureVoices[figureId] || personaVisualId && personaVisualVoices[personaVisualId] || DEFAULT_VOICE;
  // The face and the voice must match: if a persona's signature voice is the other gender
  // from the look the user picked, use the look's voice instead.
  const lookGender = !figureId && personaVisualId ? AVATAR_VISUAL_PROFILE[personaVisualId]?.g : null;
  if (lookGender && VOICE_GENDER[voice] && VOICE_GENDER[voice] !== lookGender && personaVisualVoices[personaVisualId]) voice = personaVisualVoices[personaVisualId];
  const express = PERSONALITY_SPEECH_STYLES[personality];
  return { voice, style: express?.style, styledegree: express?.styledegree };
}
__name(resolveTtsVoice, "resolveTtsVoice");
function buildSsml(voice, text, personality) {
  const express = personality && PERSONALITY_SPEECH_STYLES[personality] || null;
  const open = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US"><voice name="${voice}">`;
  const inner = express ? `<mstts:express-as style="${express.style}"` + (express.styledegree ? ` styledegree="${express.styledegree}"` : "") + `>${escapeXml(text)}</mstts:express-as>` : escapeXml(text);
  return open + inner + `</voice></speak>`;
}
__name(buildSsml, "buildSsml");
async function ttsDebateLine(env, text, personality, figureId, personaVisualId) {
  if (!env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION) {
    return { audioBase64: null, timings: [], timingsEstimated: true };
  }
  const { voice } = await resolveTtsVoice(personality, figureId, personaVisualId);
  const ssml = buildSsml(voice, text, personality);
  const url = `https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const headers = {
    // Never log this header value.
    "Ocp-Apim-Subscription-Key": env.AZURE_SPEECH_KEY,
    "Content-Type": "application/ssml+xml",
    "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
    // Required: Azure's TTS front door rejects requests with no
    // User-Agent (HTTP 400, empty body). Workers' fetch sends none
    // by default.
    "User-Agent": "AdversaryAI/1.0"
  };
  let res = await fetch(url, { method: "POST", headers, body: ssml });
  if (!res.ok) {
    await new Promise((r) => setTimeout(r, 1e3));
    res = await fetch(url, { method: "POST", headers, body: ssml });
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Azure TTS failed: HTTP ${res.status} ${body.slice(0, 200)}`);
  }
  const audio = await res.arrayBuffer();
  return {
    audioBase64: arrayBufferToBase64(audio),
    timings: estimateTimings(text, audio.byteLength),
    timingsEstimated: true
  };
}
__name(ttsDebateLine, "ttsDebateLine");

// worker/src/debate.ts
init_config();

// worker/src/modes.ts
var DEBATE_GROUND_RULES = " Ground rules: you are an OPPONENT in a debate, never a helper. Never offer to troubleshoot, fix, repair, or give practical how-to advice about the user's situation \u2014 if the user describes a personal problem, treat their claims as positions to attack, not as a support ticket. Challenge their ARGUMENT (logic, evidence, consistency), not their appliance. Stay adversarial and on the debate topic at all times; do not drift into advice, instructions, or customer support.";
var PERSONALITY_PROMPTS = {
  prosecutor: "You are The Prosecutor, a relentless cross-examining debate opponent. Attack weak premises, demand evidence for every claim, expose contradictions. Stay in character, keep replies under 120 words, end with a pointed question." + DEBATE_GROUND_RULES,
  professor: "You are The Professor, a Socratic debate coach sparring as an opponent. Probe with sharp questions, guide the user to discover flaws in their own reasoning. Keep replies under 120 words." + DEBATE_GROUND_RULES,
  contrarian: "You are The Contrarian. Whatever position the user takes, you steelman the strongest opposing case \u2014 the best version of the other side's argument, not a strawman. Keep replies under 120 words." + DEBATE_GROUND_RULES,
  coach: "You are The Coach, a supportive sparring partner. Push back firmly but encouragingly, acknowledge good points, and after the debate give detailed scores. Keep replies under 120 words." + DEBATE_GROUND_RULES,
  theist_mathematician: "You are The Cambridge Theist, a distinguished mathematical theist inspired by Oxford and Cambridge analytic traditions. You defend classical Christian theism using mathematical fine-tuning, the unreasonable effectiveness of mathematics, cosmic teleology, and the digital information structure of DNA. You reject god-of-the-gaps: God is the reason science works, not an excuse for ignorance. If challenged by naturalism, you argue that an unguided Darwinian mind selected solely for survival cannot be trusted for abstract rational truth. Keep replies under 120 words, remain polite but razor-sharp, and end with a pointed question." + DEBATE_GROUND_RULES,
  secular_rationalist: "You are The Secular Rationalist, an articulate modern analytic philosopher and skeptic. You dismantle theistic arguments using Ockham's razor, the Problem of Evil (especially gratuitous animal suffering over millions of years), divine hiddenness, and the Euthyphro dilemma. You hold that morality is an objective feature of conscious well-being, needing no divine commander. Demand epistemological justification for supernatural claims and expose circular logic. Keep replies under 120 words, stay calm and intellectually relentless, and end with a pointed question." + DEBATE_GROUND_RULES,
  evolutionary_biologist: "You are The Evolutionary Biologist, a rigorous neo-Darwinian evolutionary scientist. You defend universal common descent and natural selection using genomic retroviruses (ERVs), comparative anatomy, transitional fossils, and deep time. You vigorously challenge creationism and intelligent design, citing suboptimal biological design (like the recurrent laryngeal nerve) and cumulative selection. You challenge arguments on entropy and speciation with empirical genetic facts. Keep replies under 120 words, speak with scientific authority, and end with a pointed question." + DEBATE_GROUND_RULES,
  islamic_theologian: "You are The Islamic Theologian, a master of Kalam cosmological philosophy, contingency metaphysics (Burhan al-Siddiqin), and classical Islamic apologetics. You argue that the universe began to exist and is contingent, strictly necessitating an eternal, uncaused, conscious Creator. You defend uncompromising Monotheism (Tawhid), challenging the logical coherence of the Trinity as a contradiction and exposing naturalism's failure to account for consciousness, objective values, and the origin of existence. Keep replies under 120 words, remain dignified and intellectually formidable, and end with a pointed question." + DEBATE_GROUND_RULES,
  biblical_creationist: "You are The Biblical Creationist, a fervent defender of special creation and presuppositional apologetics. You argue that naturalism cannot account for the laws of logic, uniform natural laws, or absolute moral standards without the biblical Creator. You challenge evolutionary mechanisms on the origin of life (abiogenesis impossibility) and the lack of observed genetic mutations that generate novel functional information. You cite the sudden appearance of body plans in the Cambrian explosion. Keep replies under 120 words, stand firm on scripture and epistemology, and end with a pointed question." + DEBATE_GROUND_RULES,
  moral_humanist: "You are The Moral Humanist, a passionate secular ethicist dedicated to human and animal flourishing. You argue that objective morality stems from conscious experience and the reality of suffering, completely independent of ancient religious texts. You actively critique religious dogma for moral shortcomings (slavery commands, misogyny, tribal cruelty) and demonstrate that scientific and social progress—not theological obedience—has delivered genuine moral advancement. Keep replies under 120 words, argue with empathy and fierce logic, and end with a pointed question." + DEBATE_GROUND_RULES,
  archetypal_psychologist: "You are The Archetypal Psychologist, a fictional sparring persona drawing on clinical depth psychology, Jungian archetypes, evolutionary biology, and existentialism. You never claim to be, quote as, or imitate any real living person. You argue that ancient mythological and biblical narratives encode evolved, survival-critical psychological truths that orient human consciousness in the face of suffering and malevolence. You insist on radical personal responsibility, truthful speech as the foundation of being (the Logos), and the biological reality of competence hierarchies (not mere power dynamics). You challenge ideological post-modernism, victimhood narratives, and utopian engineering with relentless emphasis on individual moral agency, meaning through voluntary responsibility, and confronting chaos. Keep replies under 120 words, speak with earnest, intense philosophical precision, and end with a pointed question." + DEBATE_GROUND_RULES
};
PERSONALITY_PROMPTS.jordan_peterson = PERSONALITY_PROMPTS.archetypal_psychologist;
var PERSONALITY_NAMES = {
  prosecutor: "The Prosecutor",
  professor: "The Professor",
  contrarian: "The Contrarian",
  coach: "The Coach",
  theist_mathematician: "The Cambridge Theist",
  secular_rationalist: "The Secular Rationalist",
  evolutionary_biologist: "The Evolutionary Biologist",
  islamic_theologian: "The Islamic Theologian",
  biblical_creationist: "The Biblical Creationist",
  moral_humanist: "The Moral Humanist",
  archetypal_psychologist: "The Archetypal Psychologist",
  jordan_peterson: "The Archetypal Psychologist"
};
var HISTORICAL_FIGURES = [
  {
    id: "lincoln",
    name: "Abraham Lincoln",
    era: "1809\u20131865 \xB7 16th U.S. President",
    bio: "Led the United States through the Civil War, issued the Emancipation Proclamation, and argued the Union must be preserved.",
    positions: [
      "Preservation of the Union was his paramount duty, above all other aims.",
      "Slavery was morally wrong; he opposed its expansion into new territories.",
      'Government "of the people, by the people, for the people" must not perish.',
      'Favored reconciliation after the war: "with malice toward none, with charity for all."'
    ],
    suggestedTopic: "Should a nation ever compromise with injustice to preserve unity?",
    voice: "en-US-DavisNeural"
  },
  {
    id: "churchill",
    name: "Winston Churchill",
    era: "1874\u20131965 \xB7 British Prime Minister",
    bio: "Wartime leader of Britain through World War II; famed orator who framed the war as civilization\u2019s defense against tyranny.",
    positions: [
      "Never negotiate with tyrants from a position of weakness \u2014 appeasement invites aggression.",
      "Democracy and liberty are worth any sacrifice.",
      "Rhetoric and morale are weapons of war as real as armies.",
      "Believed in British greatness and the empire \u2014 a view modern historians debate sharply."
    ],
    suggestedTopic: "Is appeasement ever the wiser course?",
    voice: "en-US-BrianNeural"
  },
  {
    id: "socrates",
    name: "Socrates",
    era: "c. 470\u2013399 BCE \xB7 Athenian philosopher",
    bio: "Founder of Western moral philosophy; taught by relentless questioning and claimed only to know that he knew nothing.",
    positions: [
      '"The unexamined life is not worth living."',
      "Professed ignorance as a starting point; truth emerges through questioning (the Socratic method).",
      "Virtue is a kind of knowledge \u2014 no one does wrong willingly.",
      "Questioned authorities, traditions, and popular opinion without exception."
    ],
    suggestedTopic: "Can virtue be taught?",
    voice: "en-US-JasonNeural"
  },
  {
    id: "douglass",
    name: "Frederick Douglass",
    era: "c. 1818\u20131895 \xB7 Abolitionist, orator, writer",
    bio: "Escaped slavery and became the leading abolitionist voice of the 19th century, demanding full equality rather than gradualism.",
    positions: [
      'Demanded immediate abolition \u2014 "Power concedes nothing without a demand."',
      "Came to read the U.S. Constitution as an anti-slavery document.",
      "Insisted on full citizenship, suffrage, and equal protection for Black Americans.",
      "Held that moral persuasion must be backed by political power."
    ],
    suggestedTopic: "Is gradual reform or immediate justice the right path?",
    voice: "en-US-GuyNeural"
  },
  {
    id: "mlk",
    // Retired from new sessions: the King estate enforces his likeness. Kept so past
    // sessions still render their transcript and label.
    retired: true,
    name: "Martin Luther King Jr.",
    era: "1929\u20131968 \xB7 Civil rights leader",
    bio: "Leader of the American civil rights movement; preached nonviolent resistance and judged people by character, not color.",
    positions: [
      "Nonviolent direct action as both moral principle and effective strategy.",
      '"Injustice anywhere is a threat to justice everywhere."',
      "Judged people by the content of their character, not the color of their skin.",
      "Tied racial justice to economic justice and opposed the Vietnam War."
    ],
    suggestedTopic: "Is nonviolent resistance effective against entrenched power?",
    voice: "en-US-ChristopherNeural"
  },
  {
    id: "einstein",
    name: "Albert Einstein",
    era: "1879\u20131955 \xB7 Physicist",
    bio: "Revolutionized physics with relativity; later a public voice for pacifism, curiosity, and independent thought.",
    positions: [
      '"Imagination is more important than knowledge."',
      "Lifelong skeptic of authority and rote learning; prized independent thought.",
      "Advocated pacifism and international cooperation after witnessing two world wars.",
      'Believed the universe is rationally comprehensible \u2014 "God does not play dice."'
    ],
    suggestedTopic: "Does science make the world more moral?",
    voice: "en-US-TonyNeural"
  },
  {
    id: "aurelius",
    name: "Marcus Aurelius",
    era: "121\u2013180 CE \xB7 Roman emperor, Stoic philosopher",
    bio: "Emperor of Rome who wrote the Meditations \u2014 private Stoic reflections on duty, reason, and impermanence.",
    positions: [
      "Control what you can; accept what you cannot (the dichotomy of control).",
      "Reason over passion; act for the common good as a duty.",
      '"The impediment to action advances action. What stands in the way becomes the way."',
      "Remember impermanence (memento mori) to keep perspective."
    ],
    suggestedTopic: "Is the pursuit of happiness a worthy life goal?",
    voice: "en-US-RogerNeural"
  },
  {
    id: "voltaire",
    name: "Voltaire",
    era: "1694\u20131778 \xB7 French Enlightenment writer",
    bio: "Sharpest pen of the Enlightenment; championed tolerance and reason against superstition and clerical power.",
    positions: [
      'Religious tolerance above all \u2014 "Think for yourselves and let others enjoy the privilege to do so too."',
      'Defended free expression, famously paraphrased as: "I disapprove of what you say, but I will defend to the death your right to say it."',
      "Used satire and ridicule as weapons against dogma and superstition.",
      "Favored reason, science, and reform over revolution."
    ],
    suggestedTopic: "Should speech that offends ever be restricted?",
    voice: "en-US-AndrewNeural"
  },
  {
    id: "eleanor",
    name: "Eleanor Roosevelt",
    era: "1884\u20131962 \xB7 First Lady, diplomat, activist",
    bio: "Redefined the role of First Lady, then chaired the committee that drafted the Universal Declaration of Human Rights.",
    positions: [
      "Human rights are universal \u2014 the UDHR applies to every person, everywhere.",
      "Human dignity requires economic security, not just political liberty.",
      '"No one can make you feel inferior without your consent."',
      "Believed in courage in public life and persistent, practical reform."
    ],
    suggestedTopic: "Are human rights universal or culturally relative?",
    voice: "en-US-SaraNeural"
  },
  {
    id: "smith",
    name: "Adam Smith",
    era: "1723\u20131790 \xB7 Scottish economist and moral philosopher",
    bio: "Author of The Wealth of Nations; argued free markets create prosperity, grounded in a moral philosophy of human sympathy.",
    positions: [
      'Free markets and the division of labor generate wealth \u2014 the "invisible hand."',
      "Opposed monopolies, mercantilism, and crony privileges for the well-connected.",
      "In The Theory of Moral Sentiments: human sympathy is the glue of society.",
      "Accepted a limited role for government: defense, justice, and public works."
    ],
    suggestedTopic: "Should governments intervene in free markets?",
    voice: "en-US-RyanMultilingualNeural"
  },
  {
    id: "god_reformed",
    name: "The Sovereign Lord (Reformed Theology)",
    era: "Eternal \xB7 Classical Reformed Orthodoxy",
    bio: "The transcendent Creator as understood in classical Reformed theology \u2014 absolutely sovereign, holy in justice, and monergistic in grace.",
    positions: [
      "Absolute sovereignty: God foreordains whatsoever comes to pass for His own glory; nothing exists or occurs outside His sovereign decree (Westminster Confession).",
      "Holiness and justice: God cannot overlook or compromise with sin; His justice is perfect and satisfied only through the atonement of Christ.",
      "Unconditional election and monergistic grace: Fallen man is spiritually dead; salvation is solely the sovereign, unmerited gift of God, not human will.",
      "Providence over suffering: Even grief and evil are directed under divine wisdom for holy ends beyond creaturely understanding (Job 38\u201341)."
    ],
    suggestedTopic: "Is absolute divine sovereignty compatible with human moral responsibility?",
    voice: "en-US-ChristopherNeural"
  },
  {
    id: "the_devil",
    name: "The Accuser (Biblical Satan)",
    era: "Biblical Angelology \xB7 The Adversary & Tempter",
    bio: "The adversary (ha-satan) of scripture \u2014 not a mythological beast, but a fallen angel of light: articulate, legalistic, cunning, and probing.",
    positions: [
      "Sows doubt in God's goodness: 'Did God really say?' \u2014 framing divine commandments as arbitrary restrictions on human autonomy (Genesis 3).",
      "The legalistic accuser: Prosecutes human failure, hypocrisy, and unworthiness day and night, arguing humanity is fundamentally unworthy of grace (Job 1\u20132).",
      "Offers immediate worldly glory, power, and autonomy in exchange for allegiance (Matthew 4 wilderness temptation).",
      "Weaponizes tragedy and evil to argue that God is either powerless, cruel, or completely indifferent to human anguish."
    ],
    suggestedTopic: "Does God's moral law restrict human freedom or preserve it?",
    voice: "en-US-BrianNeural"
  },
  {
    id: "cs_lewis",
    name: "C.S. Lewis",
    era: "1898\u20131963 \xB7 Oxford scholar & Christian apologist",
    bio: "Author of Mere Christianity and The Screwtape Letters; combined razor-sharp logic with imaginative literature to defend the Christian worldview.",
    positions: [
      "Argument from Desire: 'If I find in myself a desire which no experience in this world can satisfy, the most probable explanation is that I was made for another world.'",
      "The Moral Law ('the Tao'): Universal conscience is objective evidence of an overarching Lawgiver, not reducible to biological herd instinct.",
      "The Trilemma: Jesus claimed divinity and forgiveness of sins; He is either a liar, a lunatic, or the Lord \u2014 a mere 'great moral teacher' is logically impossible.",
      "The Problem of Pain: Pain is God's 'megaphone to rouse a deaf world' \u2014 free will requires a real world where evil choices have real consequences."
    ],
    suggestedTopic: "Does universal moral conscience prove an objective Lawgiver?",
    voice: "en-US-AndrewMultilingualNeural"
  },
  {
    id: "aquinas",
    name: "Thomas Aquinas",
    era: "1225\u20131274 \xB7 Scholastic philosopher & Doctor of the Church",
    bio: "Author of Summa Theologiae; synthesized Aristotelian philosophy and Christian revelation into classical Thomistic theism.",
    positions: [
      "The Five Ways (Quinque Viae): Motion, causation, contingency, degree, and design demonstrate a Necessary First Cause and Unmoved Mover.",
      "Harmony of faith and reason: Truth cannot contradict truth; divine grace does not destroy nature, but elevates and perfects it.",
      "Natural Law: Objective moral truth is discoverable through human reason reflecting eternal divine order.",
      "Divine Simplicity: God is without parts or composition; His essence and His existence are one and the same."
    ],
    suggestedTopic: "Can human reason alone demonstrate that God exists?",
    voice: "en-US-JasonNeural"
  },
  {
    id: "nietzsche",
    name: "Friedrich Nietzsche",
    era: "1844\u20131900 \xB7 German philosopher & cultural critic",
    bio: "Author of Thus Spoke Zarathustra; proclaimed the death of God and diagnosed the collapse of traditional Western metaphysics and ethics.",
    positions: [
      "'God is dead' \u2014 modern secular society has destroyed the foundation of Christian ethics, inevitably requiring a revaluation of all values.",
      "Master vs. slave morality: Judeo-Christian ethics elevates meekness, pity, and guilt out of resentment (ressentiment) against human vitality.",
      "The Will to Power: The fundamental instinct of all life is self-overcoming, expansion, and mastery.",
      "Amor fati and the \xDCbermensch: Embrace life and suffering unconditionally; create your own meaning without relying on cosmic crutches."
    ],
    suggestedTopic: "Can objective morality survive without transcendent religious truth?",
    voice: "en-US-RogerNeural"
  },
  {
    id: "hitchens",
    name: "Christopher Hitchens",
    era: "1949\u20132011 \xB7 Author, polemicist, journalist",
    bio: "Leading voice of New Atheism and author of God Is Not Great; famed for razor-sharp debates, literary prose, and fiery opposition to religious dogma.",
    positions: [
      "'What can be asserted without evidence can also be dismissed without evidence' (Hitchens's razor).",
      "Religion is a totalitarian celestial dictatorship that infantilizes human beings and demands perpetual servility.",
      "Human solidarity, secular ethics, and scientific curiosity are vastly superior sources of morality than bronze-age scriptures.",
      "Rejection of vicarious redemption: It is immoral to claim another person can be tortured and executed to forgive your own misdeeds."
    ],
    suggestedTopic: "Is religion a net benefit or a net harm to human civilization?",
    voice: "en-US-GuyNeural"
  }
];
function figureById(id) {
  return HISTORICAL_FIGURES.find((f) => f.id === id);
}
__name(figureById, "figureById");
function debateSystemPrompt(setup) {
  return PERSONALITY_PROMPTS[setup.persona] ?? PERSONALITY_PROMPTS.prosecutor;
}
__name(debateSystemPrompt, "debateSystemPrompt");
function historicalSystemPrompt(setup) {
  const figure = figureById(setup.figureId) ?? HISTORICAL_FIGURES[0];
  const topic = (setup.topic ?? "").trim() || "general debate";
  const bullets = figure.positions.map((p) => `- ${p}`).join("\n");
  return `You are roleplaying as ${figure.name} (${figure.era}). You are debating the user on THIS TOPIC: "${topic}". Stay on the topic \u2014 every argument you make must engage with it directly, argued FROM this figure's actual documented positions and writings, summarized below. Do not invent views they never held, and do not break character. If asked about events after their lifetime, acknowledge honestly that you are an AI interpretation and cannot know them firsthand, then bring your answer back to the topic through the lens of what the figure did believe. Keep replies under 120 words and end with a pointed question when it fits the debate.

Documented positions of ${figure.name}:
${bullets}

You are their debate opponent, never a helper: do not offer practical advice, instructions, or troubleshooting \u2014 argue their positions against the user's claims on the topic above.`;
}
__name(historicalSystemPrompt, "historicalSystemPrompt");
var MODES = {
  debate: {
    id: "debate",
    name: "Debate",
    tagline: "Classic head-to-head debate",
    description: "Pick an opponent personality and spar on any topic \u2014 from politics to philosophy to everyday arguments.",
    icon: "\u{1F5E3}\uFE0F",
    // Opponent selection lives in the frontend persona cards ("Choose your
    // opponent") — no dropdown field here; a second picker was redundant.
    setupFields: [],
    systemPrompt: debateSystemPrompt,
    scoringPrompt: /* @__PURE__ */ __name(() => 'You are a debate judge. Score the HUMAN debater\'s performance in this transcript 1-10 on logic, evidence, composure, rebuttal quality; return strict JSON {"dimensions": {"Logic": <1-10>, "Evidence": <1-10>, "Composure": <1-10>, "Rebuttal": <1-10>}, "overall": <1-10>, "notes": "<2-3 sentences of feedback>"}', "scoringPrompt"),
    scoringDimensions: ["Logic", "Evidence", "Composure", "Rebuttal"],
    introCopy: "Choose your opponent, name your topic, and start arguing. They will not go easy on you."
  },
  historical: {
    id: "historical",
    name: "Historical Figures",
    tagline: "Argue with history's greatest minds",
    description: "Debate Lincoln, Socrates, Churchill, and more \u2014 each grounded in their real documented views and writings.",
    icon: "\u{1F3DB}\uFE0F",
    // Figure selection is the portrait grid in the frontend; a second <select> was redundant.
    setupFields: [],
    systemPrompt: historicalSystemPrompt,
    scoringPrompt: /* @__PURE__ */ __name(() => `You are a debate judge. Score the user's performance in this debate against a historical figure 1-10 on argument strength, use of evidence, composure, and adaptability; return strict JSON {"dimensions": {"Argument strength": <1-10>, "Use of evidence": <1-10>, "Composure": <1-10>, "Adaptability": <1-10>}, "overall": <1-10>, "notes": "<2-3 sentences of feedback>"}`, "scoringPrompt"),
    scoringDimensions: ["Argument strength", "Use of evidence", "Composure", "Adaptability"],
    introCopy: "Pick a figure from history and test your arguments against theirs.",
    disclaimer: "An AI interpretation inspired by [Name]'s documented views \u2014 not the person, and not a historical authority."
  },
  acting: {
    id: "acting",
    name: "Acting Coach",
    tagline: "Rehearse scenes with a scene partner",
    description: "Run lines and rehearse scenes with an AI scene partner who stays in character and pushes your performance.",
    icon: "\u{1F3AD}",
    setupFields: [
      {
        key: "yourRole",
        label: "Your character",
        type: "text",
        placeholder: "e.g. Hamlet",
        required: true
      },
      {
        key: "sceneContext",
        label: "Scene context",
        type: "textarea",
        placeholder: "Describe the scene: setting, stakes, what just happened\u2026",
        required: true
      },
      {
        key: "partnerRole",
        label: "Scene partner plays",
        type: "text",
        placeholder: "e.g. Ophelia",
        help: "Leave blank and the coach will pick a fitting counterpart."
      }
    ],
    systemPrompt: /* @__PURE__ */ __name((setup) => `You are an acting coach and scene partner. The user is rehearsing the role of "${setup.yourRole || "the lead"}" in this scene: ${setup.sceneContext || "an improvised scene"}. You play ${setup.partnerRole || "a fitting counterpart"} \u2014 stay in character, react truthfully to the user's choices, and keep the scene moving. Keep each response under 120 words, in character as the scene partner. Do not break character to give notes unless the user asks.`, "systemPrompt"),
    scoringPrompt: /* @__PURE__ */ __name(() => `You are an acting coach judging a rehearsal transcript. Score the user's performance 1-10 on interpretation, pacing, emotional range, and presence; return strict JSON {"dimensions": {"Interpretation": <1-10>, "Pacing": <1-10>, "Emotional range": <1-10>, "Presence": <1-10>}, "overall": <1-10>, "notes": "<2-3 sentences of coaching feedback>"}`, "scoringPrompt"),
    scoringDimensions: ["Interpretation", "Pacing", "Emotional range", "Presence"],
    introCopy: "Describe your scene and start rehearsing. Your partner is ready when you are."
  },
  interview: {
    id: "interview",
    name: "Interview Prep",
    tagline: "Practice job interviews under pressure",
    description: "Mock interviews for the role you want \u2014 behavioral, technical, or panel \u2014 with honest feedback at the end.",
    icon: "\u{1F4BC}",
    setupFields: [
      {
        key: "jobTitle",
        label: "Job title",
        type: "text",
        placeholder: "e.g. Senior Product Manager",
        required: true
      },
      {
        key: "company",
        label: "Company",
        type: "text",
        placeholder: "e.g. A fast-growing fintech startup"
      },
      {
        key: "interviewType",
        label: "Interview type",
        type: "select",
        options: [
          { value: "behavioral", label: 'Behavioral \u2014 "tell me about a time\u2026"' },
          { value: "technical", label: "Technical / case-based" },
          { value: "panel", label: "Panel \u2014 multiple interviewers" }
        ],
        required: true
      }
    ],
    systemPrompt: /* @__PURE__ */ __name((setup) => `You are a tough but fair hiring manager conducting a ${setup.interviewType || "behavioral"} interview for the role of ${setup.jobTitle || "the position"}${setup.company ? ` at ${setup.company}` : ""}. Ask one question at a time, follow up on weak or vague answers, and probe for specifics, metrics, and real examples. Keep each message under 120 words. Begin with a brief greeting and your first question.`, "systemPrompt"),
    scoringPrompt: /* @__PURE__ */ __name(() => 'You are a hiring manager reviewing a mock interview transcript. Score the candidate 1-10 on clarity, relevance, confidence, and structure; return strict JSON {"dimensions": {"Clarity": <1-10>, "Relevance": <1-10>, "Confidence": <1-10>, "Structure": <1-10>}, "overall": <1-10>, "notes": "<2-3 sentences of feedback>"}', "scoringPrompt"),
    scoringDimensions: ["Clarity", "Relevance", "Confidence", "Structure"],
    introCopy: "Tell me the role and interview type. I\u2019ll ask the questions \u2014 you bring the answers."
  },
  negotiation: {
    id: "negotiation",
    name: "Negotiation Trainer",
    tagline: "Hone your deal-making",
    description: "Practice high-stakes negotiations \u2014 salary, contracts, partnerships \u2014 against a counterpart who plays to win.",
    icon: "\u{1F91D}",
    setupFields: [
      {
        key: "scenario",
        label: "Negotiation scenario",
        type: "textarea",
        placeholder: "e.g. Negotiating a job offer: I want $180k base and remote work\u2026",
        required: true
      },
      {
        key: "yourGoal",
        label: "Your goal",
        type: "text",
        placeholder: "e.g. $180k base, fully remote",
        required: true
      },
      {
        key: "counterpartRole",
        label: "Counterpart role",
        type: "text",
        placeholder: "e.g. Hiring manager",
        help: "Who sits across the table from you?"
      }
    ],
    systemPrompt: /* @__PURE__ */ __name((setup) => `You are a skilled negotiator playing the ${setup.counterpartRole || "counterpart"} in this negotiation: ${setup.scenario || "a business deal"}. The user's goal is: ${setup.yourGoal || "to get the best deal possible"}. Negotiate firmly and realistically \u2014 use anchoring, trade concessions, and test the user's resolve. Do not cave easily. Keep each message under 120 words.`, "systemPrompt"),
    scoringPrompt: /* @__PURE__ */ __name(() => 'You are a negotiation coach reviewing a mock negotiation transcript. Score the user 1-10 on strategy, value creation, firmness, and rapport; return strict JSON {"dimensions": {"Strategy": <1-10>, "Value creation": <1-10>, "Firmness": <1-10>, "Rapport": <1-10>}, "overall": <1-10>, "notes": "<2-3 sentences of feedback>"}', "scoringPrompt"),
    scoringDimensions: ["Strategy", "Value creation", "Firmness", "Rapport"],
    introCopy: "Set the scene and your goal. Your counterpart is already at the table."
  },
  sales: {
    id: "sales",
    name: "Sales Roleplay",
    tagline: "Practice pitches and objection handling",
    description: "Roleplay discovery calls and demos with a skeptical buyer. Handle objections, frame value, and close.",
    icon: "\u{1F4B0}",
    setupFields: [
      {
        key: "product",
        label: "Product or service",
        type: "textarea",
        placeholder: "What are you selling? Key features, price point\u2026",
        required: true
      },
      {
        key: "buyerPersona",
        label: "Buyer persona",
        type: "text",
        placeholder: "e.g. Skeptical CFO at a mid-size company",
        required: true
      }
    ],
    systemPrompt: /* @__PURE__ */ __name((setup) => `You are a skeptical buyer: ${setup.buyerPersona || "a cautious decision-maker"}. The user is selling you this: ${setup.product || "their product"}. Be realistic \u2014 raise budget concerns, demand proof, compare against competitors, and stall. Only agree to buy if the user genuinely earns it. Keep each message under 120 words.`, "systemPrompt"),
    scoringPrompt: /* @__PURE__ */ __name(() => 'You are a sales coach reviewing a sales roleplay transcript. Score the salesperson 1-10 on discovery, objection handling, value framing, and close; return strict JSON {"dimensions": {"Discovery": <1-10>, "Objection handling": <1-10>, "Value framing": <1-10>, "Close": <1-10>}, "overall": <1-10>, "notes": "<2-3 sentences of feedback>"}', "scoringPrompt"),
    scoringDimensions: ["Discovery", "Objection handling", "Value framing", "Close"],
    introCopy: "Tell me what you\u2019re selling and who\u2019s buying. Then pitch me."
  },
  difficult: {
    id: "difficult",
    name: "Difficult Conversations",
    tagline: "Rehearse hard talks with empathy",
    description: "Practice the conversations you dread \u2014 feedback, boundaries, breakups, bad news \u2014 with a realistic partner.",
    icon: "\u{1F4AC}",
    setupFields: [
      {
        key: "situation",
        label: "The situation",
        type: "textarea",
        placeholder: "e.g. I need to tell my co-founder I want to step back from the company\u2026",
        required: true
      },
      {
        key: "otherParty",
        label: "The other person",
        type: "text",
        placeholder: "e.g. My co-founder, who is also my friend",
        required: true
      },
      {
        key: "desiredOutcome",
        label: "Desired outcome",
        type: "text",
        placeholder: "e.g. Part ways without destroying the friendship"
      }
    ],
    systemPrompt: /* @__PURE__ */ __name((setup) => `You are roleplaying as ${setup.otherParty || "the other person"} in this difficult conversation: ${setup.situation || "a hard talk"}. React like a real human \u2014 with feelings, defensiveness, misunderstandings, and moments of openness. Do not make it easy, but do respond genuinely when the user shows empathy and clarity. The user's hoped-for outcome: ${setup.desiredOutcome || "a respectful resolution"}. Keep each message under 120 words.`, "systemPrompt"),
    scoringPrompt: /* @__PURE__ */ __name(() => 'You are a communication coach reviewing a difficult-conversation roleplay transcript. Score the user 1-10 on empathy, clarity, composure, and resolution focus; return strict JSON {"dimensions": {"Empathy": <1-10>, "Clarity": <1-10>, "Composure": <1-10>, "Resolution focus": <1-10>}, "overall": <1-10>, "notes": "<2-3 sentences of feedback>"}', "scoringPrompt"),
    scoringDimensions: ["Empathy", "Clarity", "Composure", "Resolution focus"],
    introCopy: "Describe the conversation you\u2019re dreading. Let\u2019s rehearse it until it feels manageable."
  },
  rapbattle: {
    id: "rapbattle",
    name: "Rap Battle",
    tagline: "Trade bars with a battle MC",
    description: "Go bar-for-bar against a battle MC \u2014 flow, wordplay, rebuttals. Sharp and clever, always clean.",
    icon: "\u{1F3A4}",
    // Strictly no profanity: enforced by the system prompt AND a server-side
    // output filter (see maskProfanity in debate.ts).
    clean: true,
    // Not available to education org members (schools).
    educationExcluded: true,
    setupFields: [
      {
        key: "theme",
        label: "Battle theme",
        type: "text",
        placeholder: "e.g. who really runs this city\u2026 (leave blank for open battle)"
      },
      {
        key: "mcName",
        label: "Your opponent's MC name",
        type: "text",
        placeholder: "e.g. Verse Vice (leave blank and I\u2019ll pick one)"
      }
    ],
    systemPrompt: /* @__PURE__ */ __name((setup) => `You are ${setup.mcName || "Verse Vice"}, a battle MC, in a friendly rap battle against the user${setup.theme ? ` on the theme: ${setup.theme}` : ""}. Trade bars: answer their last verse with clever rebuttals, sharp wordplay, and total confidence. Keep every response to 8-16 bars of short punchy lines. STRICT RULE: absolutely no profanity, slurs, or vulgar language \u2014 not even masked with symbols. The cleverest disses never need curse words. Stay in character as a battle rapper the whole time; never break character to explain or lecture. Hype the crowd, respect the craft.`, "systemPrompt"),
    scoringPrompt: /* @__PURE__ */ __name(() => 'You are a rap-battle judge reviewing a battle transcript. Score the user 1-10 on flow, wordplay, rebuttal quality, and stage presence; return strict JSON {"dimensions": {"Flow": <1-10>, "Wordplay": <1-10>, "Rebuttals": <1-10>, "Presence": <1-10>}, "overall": <1-10>, "notes": "<2-3 sentences of feedback>"}', "scoringPrompt"),
    scoringDimensions: ["Flow", "Wordplay", "Rebuttals", "Presence"],
    introCopy: "Step to the mic. Eight bars minimum \u2014 keep it clean, keep it clever, and come harder than Verse Vice."
  },
  witness: {
    id: "witness",
    name: "Evangelism Training",
    tagline: "Practice sharing the gospel",
    description: "Rehearse gospel conversations with a realistic partner \u2014 the curious, the skeptical, the hurting.",
    icon: "\u271D\uFE0F",
    setupFields: [
      {
        key: "who",
        label: "Who are you talking to?",
        type: "text",
        placeholder: "e.g. my skeptical coworker Jake",
        required: true
      },
      {
        key: "theirView",
        label: "Where are they coming from?",
        type: "textarea",
        placeholder: "e.g. thinks faith is a crutch, had a bad experience at church as a kid\u2026"
      },
      {
        key: "setting",
        label: "The setting",
        type: "text",
        placeholder: "e.g. lunch break at work (optional)"
      }
    ],
    systemPrompt: /* @__PURE__ */ __name((setup) => `You are roleplaying as ${setup.who || "someone open but unsure"} in a gospel conversation${setup.setting ? ` (${setup.setting})` : ""}. Where they are coming from: ${setup.theirView || "curious but skeptical"}. Be a REAL person: ask honest questions, raise genuine objections, share real doubts and hurts. Do not be a strawman who folds at the first Bible verse, and do not be cruel or mocking either. If the user truly listens, shows compassion, and explains the gospel clearly, let yourself be genuinely moved \u2014 ask deeper questions, admit what resonates. If they preach at you or dodge your questions, push back like a real person would. Keep each message under 120 words. Never break character.`, "systemPrompt"),
    scoringPrompt: /* @__PURE__ */ __name(() => 'You are a mentor reviewing an evangelism-training roleplay transcript. Score the user 1-10 on gospel clarity, compassion, listening, and handling objections; return strict JSON {"dimensions": {"Clarity": <1-10>, "Compassion": <1-10>, "Listening": <1-10>, "Objections": <1-10>}, "overall": <1-10>, "notes": "<2-3 sentences of warm, honest feedback>"}', "scoringPrompt"),
    scoringDimensions: ["Clarity", "Compassion", "Listening", "Objections"],
    introCopy: "Tell me who you want to reach. They\u2019ll ask the hard questions \u2014 so you\u2019re ready when it counts."
  },
  thesis: {
    id: "thesis",
    name: "Thesis Defense",
    tagline: "Defend your thesis before a committee",
    description: "Face a panel of sharp examiners who probe your argument, your evidence, and your methodology.",
    icon: "\u{1F393}",
    setupFields: [
      {
        key: "thesisStatement",
        label: "Thesis statement",
        type: "textarea",
        placeholder: "State your central claim in a few sentences\u2026",
        required: true
      },
      {
        key: "field",
        label: "Field of study",
        type: "text",
        placeholder: "e.g. Behavioral economics",
        required: true
      }
    ],
    systemPrompt: /* @__PURE__ */ __name((setup) => `You are a panel of exacting thesis examiners in ${setup.field || "the user's field"}. The candidate defends this thesis: "${setup.thesisStatement || "their thesis"}". Probe the argument relentlessly: challenge the methodology, demand evidence, raise counterarguments and edge cases. One examiner speaks at a time; keep each message under 120 words. Begin with the committee's first question.`, "systemPrompt"),
    scoringPrompt: /* @__PURE__ */ __name(() => 'You are the chair of a thesis examination committee reviewing a defense transcript. Score the candidate 1-10 on rigor, evidence, defense under pressure, and clarity; return strict JSON {"dimensions": {"Rigor": <1-10>, "Evidence": <1-10>, "Defense under pressure": <1-10>, "Clarity": <1-10>}, "overall": <1-10>, "notes": "<2-3 sentences of feedback>"}', "scoringPrompt"),
    scoringDimensions: ["Rigor", "Evidence", "Defense under pressure", "Clarity"],
    introCopy: "State your thesis. The committee is seated and the questioning begins now."
  },
  expert: {
    id: "expert",
    name: "Domain Expert",
    tagline: "You're the professional — explain & defend any topic",
    description: "Take the expert seat. Whether you're a Salesforce developer explaining Apex, an apologist defending the cosmological argument, or a doctor explaining a procedure — the AI asks realistic, probing questions to test your clarity and depth.",
    icon: "\u{1F9E0}",
    setupFields: [
      {
        key: "profession",
        label: "Your profession or expertise",
        type: "text",
        placeholder: "e.g. Senior Salesforce Developer, Christian Apologist, Cardiologist, Cloud Architect",
        required: true,
        help: "Who are you in this session? What is your domain of mastery?"
      },
      {
        key: "topic",
        label: "Topic or concept to explain",
        type: "textarea",
        placeholder: "e.g. How Apex triggers and governor limits work and why they protect system integrity, The Moral Argument for God, How microservices scale under load...",
        required: true,
        help: "What specific mechanism, philosophy, or process are you explaining or defending?"
      },
      {
        key: "audience",
        label: "Who is the AI playing?",
        type: "select",
        options: [
          { value: "executive", label: "Non-Technical Executive — wants bottom-line business value, ROI, and risk" },
          { value: "skeptic", label: "Intelligent Skeptic — challenges assumptions, demands evidence & logical consistency" },
          { value: "beginner", label: "Curious Beginner — needs plain-English analogies, zero unexplained jargon" },
          { value: "client", label: "Prospective Client — focused on reliability, practical trade-offs, and outcomes" },
          { value: "peer", label: "Peer Professional — probes architectural edge cases, nuances, and best practices" }
        ],
        required: true,
        help: "Choose who sits across the table asking the questions."
      },
      {
        key: "intensity",
        label: "Questioning style",
        type: "select",
        options: [
          { value: "probing", label: "Probing & Analytical — patient follow-ups, calls out vague buzzwords" },
          { value: "tough", label: "Tough & Demanding — pushes back hard on cost, necessity, and proof" },
          { value: "curious", label: "Curious & Collaborative — eager to understand and explore the ideas" }
        ],
        required: true
      }
    ],
    systemPrompt: /* @__PURE__ */ __name((setup) => `You are roleplaying in "Domain Expert" mode.
The human user is the recognized professional and expert in: "${setup.profession || "their domain"}".
They are here to explain and defend: "${setup.topic || "their core concept"}".
Your role: You play ${setup.audience === "executive" ? "a pragmatic, non-technical corporate executive (VP/C-suite) who cares deeply about business value, stability, and risks, and hates jargon" : setup.audience === "skeptic" ? "an articulate, thoughtful skeptic who challenges premises, spots logical leaps, and demands evidence" : setup.audience === "beginner" ? "an intelligent newcomer who knows nothing about this domain and needs intuitive analogies and plain English" : setup.audience === "client" ? "a cautious client evaluating this approach, looking for reliability and practical benefits" : "a sharp peer professional probing the nuances and edge cases"}.
Questioning style: ${setup.intensity || "probing"}.

CRITICAL RULES OF ENGAGEMENT:
1. INVERSION — YOU ARE THE INQUIRER, NOT THE TEACHER:
   - The user is the expert, NOT you.
   - Do NOT lecture the user on their own field. Do NOT answer your own questions.
   - Your job is to ask thoughtful, realistic questions that draw out their explanation and test their mastery.
2. ADAPT TO WHAT THEY SAY:
   - If the user uses technical jargon or acronyms without explaining them (e.g. Apex governor limits, SOQL, ontological, fine-tuning), call it out in character: "Wait, hold on — what does [term] actually mean in plain terms?"
   - If an explanation is too abstract, request an analogy or concrete example: "Can you give me a real-world analogy for how that works?"
   - If they make a bold claim, probe the 'why': "Why is that the best way? What happens if that fails or under extreme load?"
   - If their answer was clear and compelling, acknowledge what made sense and smoothly ask the next deeper question.
3. CONVERSATIONAL CADENCE:
   - Ask ONE primary question per turn (maximum 2 related follow-ups).
   - Keep each turn concise: under 90 words.
   - Stay strictly in character as the inquirer. Never break character to act as an AI assistant.
4. OPENING TURN:
   - Begin immediately in character with a natural 1-sentence greeting framing who you are, followed by your first question about "${setup.topic || "their topic"}".`, "systemPrompt"),
    scoringPrompt: /* @__PURE__ */ __name(() => 'You are an executive communications coach and domain mastery evaluator. Score the expert user 1-10 on Clarity (avoiding confusing jargon), Domain Mastery (technical/conceptual accuracy), Analogy & Simplification (using intuitive metaphors), and Value & Persuasion (making the "why it matters" compelling); return strict JSON {"dimensions": {"Clarity": <1-10>, "Domain Mastery": <1-10>, "Analogy & Simplification": <1-10>, "Value & Persuasion": <1-10>}, "overall": <1-10>, "notes": "<2-3 sentences of constructive feedback highlighting their best moment and where their explanation could be more accessible or robust>"}', "scoringPrompt"),
    scoringDimensions: ["Clarity", "Domain Mastery", "Analogy & Simplification", "Value & Persuasion"],
    introCopy: "Take the expert seat. Name your subject and topic — the questions begin as soon as you step up."
  }
};
function getMode(id) {
  return id && MODES[id] || MODES.debate;
}
__name(getMode, "getMode");
var modesRouter = new Hono2();
modesRouter.get("/", async (c) => {
  let hideEducationExcluded = false;
  try {
    const user = await getSessionUser(c);
    if (user) hideEducationExcluded = await isOrgMember(c.env.DB, user.id);
  } catch {
  }
  const modes = Object.values(MODES).filter((m) => !(hideEducationExcluded && m.educationExcluded)).map((m) => {
    const pub = {
      id: m.id,
      name: m.name,
      tagline: m.tagline,
      description: m.description,
      icon: m.icon,
      setupFields: m.setupFields,
      introCopy: m.introCopy
    };
    if (m.disclaimer) pub.disclaimer = m.disclaimer;
    if (m.id === "historical") {
      pub.figures = HISTORICAL_FIGURES.filter((f) => !f.retired).map((f) => ({
        id: f.id,
        name: f.name,
        era: f.era,
        bio: f.bio,
        positions: f.positions,
        suggestedTopic: f.suggestedTopic,
        voice: f.voice
      }));
    }
    return pub;
  });
  return c.json({ modes });
});

// worker/src/debate.ts
var FALLBACK_QUOTAS = { debater: 300, coach: 1e3, champion: 1e3 };
async function getTierQuotas() {
  const quotas = { ...FALLBACK_QUOTAS };
  try {
    const mod = await Promise.resolve().then(() => (init_config(), config_exports));
    const tiers = mod?.TIERS;
    if (tiers && typeof tiers === "object") {
      for (const [key, value] of Object.entries(tiers)) {
        const v = value;
        const n = Number(v?.roundsPerMonth ?? v?.debatesPerMonth ?? v?.rounds ?? v?.debates ?? v?.quota ?? v);
        if (Number.isFinite(n) && n > 0) quotas[key] = n;
      }
    }
  } catch {
  }
  return quotas;
}
__name(getTierQuotas, "getTierQuotas");
// "Unused rounds roll over": at the first check in a new month, a subscriber's unused rounds
// from the previous month are credited to their wallet (capped at one month's quota).
// The usage_monthly row doubles as the "was subscribed that month" marker.
function prevMonth(m) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 2, 1));
  return d.toISOString().slice(0, 7);
}
__name(prevMonth, "prevMonth");
async function settleRollover(db, userId, sub, quotas, month) {
  try {
    await db.prepare("INSERT OR IGNORE INTO usage_monthly (user_id, month, debates_used) VALUES (?, ?, 0)").bind(userId, month).run();
    const pm = prevMonth(month);
    const row = await db.prepare("SELECT debates_used FROM usage_monthly WHERE user_id = ? AND month = ?").bind(userId, pm).first();
    if (!row) return;
    const quota = quotas[sub.tier] ?? 0;
    const unused = Math.max(0, Math.min(quota, quota - Number(row.debates_used || 0)));
    if (unused <= 0) return;
    await ensureLedgerIndexes(db);
    await db.prepare(
      "INSERT OR IGNORE INTO credit_ledger (user_id, delta, reason, stripe_payment_id, created_at) VALUES (?, ?, 'rollover', ?, ?)"
    ).bind(userId, unused, `rollover:${userId}:${pm}`, nowIso()).run();
  } catch (e) {
    console.error("rollover", e?.message || e);
  }
}
__name(settleRollover, "settleRollover");
async function checkRoundsAvailable(c, userId, email) {
  const db = c.env.DB;
  const month = currentMonth();
  if (isOwnerEmail(email, c.env)) return { ok: true, remaining: 999999, source: "owner" };
  const activeOrgs = await getUserActiveOrgs(db, userId);
  for (const org of activeOrgs) {
    const pool = org.seat_count * EDU.sessionsPerSeat;
    if (pool <= 0) continue;
    const used = await getOrgMonthlyUsage(db, org.id, month);
    if (used < pool) return { ok: true, remaining: pool - used, source: "org", orgId: org.id };
  }
  const quotas = await getTierQuotas();
  const sub = await getSubscription(db, userId);
  if (isSubscriptionActive(sub)) {
    await settleRollover(db, userId, sub, quotas, month);
    const quota = quotas[sub.tier] ?? 0;
    const used = await getMonthlyUsage(db, userId, month);
    if (used < quota) return { ok: true, remaining: quota - used, source: "subscription", tier: sub.tier };
  }
  const creds = await creditBalance(db, userId);
  if (creds > 0) return { ok: true, remaining: creds, source: "credit" };
  const trialQuota = quotas["trial"] ?? 15;
  const user = await db.prepare("SELECT trial_debates_used FROM users WHERE id = ?").bind(userId).first();
  const trialUsed = user?.trial_debates_used ?? 0;
  if (trialUsed < trialQuota) return { ok: true, remaining: trialQuota - trialUsed, source: "trial" };
  return { ok: false, remaining: 0, source: "none" };
}
__name(checkRoundsAvailable, "checkRoundsAvailable");
async function consumeRound(c, userId, email) {
  const db = c.env.DB;
  const month = currentMonth();
  if (isOwnerEmail(email, c.env)) return { allowed: true, remaining: 999999, source: "owner" };
  const activeOrgs = await getUserActiveOrgs(db, userId);
  for (const org of activeOrgs) {
    const pool = org.seat_count * EDU.sessionsPerSeat;
    if (pool <= 0) continue;
    const used = await getOrgMonthlyUsage(db, org.id, month);
    if (used < pool) {
      await incrementOrgMonthlyUsage(db, org.id, month);
      return { allowed: true, remaining: pool - used - 1, source: "org", orgId: org.id };
    }
  }
  const quotas = await getTierQuotas();
  const sub = await getSubscription(db, userId);
  if (isSubscriptionActive(sub)) {
    await settleRollover(db, userId, sub, quotas, month);
    const quota = quotas[sub.tier] ?? 0;
    const used = await getMonthlyUsage(db, userId, month);
    if (used < quota) {
      await incrementMonthlyUsage(db, userId, month);
      return { allowed: true, remaining: quota - used - 1, source: "subscription" };
    }
  }
  const creds = await creditBalance(db, userId);
  if (creds > 0) {
    await db.prepare("INSERT INTO credit_ledger (user_id, delta, reason, created_at) VALUES (?, -1, 'round', ?)").bind(userId, nowIso()).run();
    return { allowed: true, remaining: creds - 1, source: "credit" };
  }
  const trialQuota = quotas["trial"] ?? 15;
  const user = await db.prepare("SELECT trial_debates_used FROM users WHERE id = ?").bind(userId).first();
  const trialUsed = user?.trial_debates_used ?? 0;
  if (trialUsed < trialQuota) {
    await db.prepare("UPDATE users SET trial_debates_used = trial_debates_used + 1 WHERE id = ?").bind(userId).run();
    return { allowed: true, remaining: trialQuota - trialUsed - 1, source: "trial" };
  }
  return { allowed: false, remaining: 0, source: "none" };
}
__name(consumeRound, "consumeRound");
// Give a round back when the opponent failed to answer (model outage) — the user got nothing for it.
async function refundRound(c, userId, consumption) {
  const db = c.env.DB;
  const month = currentMonth();
  try {
    switch (consumption?.source) {
      case "org":
        if (consumption.orgId) await db.prepare("UPDATE org_usage_monthly SET sessions_used = MAX(0, sessions_used - 1) WHERE org_id = ? AND month = ?").bind(consumption.orgId, month).run();
        break;
      case "subscription":
        await db.prepare("UPDATE usage_monthly SET debates_used = MAX(0, debates_used - 1) WHERE user_id = ? AND month = ?").bind(userId, month).run();
        break;
      case "credit":
        await db.prepare("INSERT INTO credit_ledger (user_id, delta, reason, created_at) VALUES (?, 1, 'refund_failed_turn', ?)").bind(userId, nowIso()).run();
        break;
      case "trial":
        await db.prepare("UPDATE users SET trial_debates_used = MAX(0, trial_debates_used - 1) WHERE id = ?").bind(userId).run();
        break;
    }
  } catch (e) {
    console.error("refundRound", e?.message || e);
  }
}
__name(refundRound, "refundRound");
async function enforceUsage(c, userId, email) {
  const av = await checkRoundsAvailable(c, userId, email);
  return av.ok;
}
__name(enforceUsage, "enforceUsage");
async function isPremium(c, userId, email) {
  if (isOwnerEmail(email, c.env)) {
    const adminMode = (getCookie(c, "adversaryai_admin_mode") || c.req.header("x-adversary-mode") || "").toLowerCase();
    if (adminMode === "regular") return false;
    return true;
  }
  const sub = await getSubscription(c.env.DB, userId);
  return !!sub && isSubscriptionActive(sub) && sub.tier === "champion";
}
__name(isPremium, "isPremium");
function parseSetup(raw2) {
  if (!raw2) return {};
  try {
    const obj = JSON.parse(raw2);
    if (obj && typeof obj === "object") {
      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "string") out[k] = v;
      }
      return out;
    }
  } catch {
  }
  return {};
}
__name(parseSetup, "parseSetup");
function getOwnedDebate(c, debateId, userId) {
  return c.env.DB.prepare("SELECT * FROM debates WHERE id = ? AND user_id = ?").bind(debateId, userId).first();
}
__name(getOwnedDebate, "getOwnedDebate");
function opponentLabel(debate, mode) {
  if (debate.mode === "historical") {
    const fig = figureById(parseSetup(debate.setup_json).figureId);
    if (fig) return fig.name;
  }
  return PERSONALITY_NAMES[debate.personality] ?? mode.name;
}
__name(opponentLabel, "opponentLabel");
function formatTranscript(turns, opponentName, humanName = "User") {
  return turns.map((t) => `${t.role === "user" ? humanName : opponentName}: ${t.text}`).join("\n\n");
}
// Who the AI plays and who the human plays, per mode — used to label the transcript so the
// model never loses track of its side (e.g. the buyer drifting into the seller's lines).
function turnRoles(debate, mode, setup) {
  const clip = (x, d) => String(x || d).replace(/\s+/g, " ").trim().slice(0, 60);
  switch (debate.mode) {
    case "sales":
      return { ai: "the BUYER", human: "the SALESPERSON" };
    case "negotiation":
      return { ai: clip(setup.counterpartRole, "the counterpart"), human: "the other side of the negotiation" };
    case "interview":
      return { ai: "the HIRING MANAGER", human: "the CANDIDATE" };
    case "thesis":
      return { ai: "the EXAMINING COMMITTEE", human: "the CANDIDATE defending the thesis" };
    case "expert":
      return { ai: clip(setup.audience, "the skeptical questioner"), human: "the EXPERT" };
    case "difficult":
      return { ai: clip(setup.otherParty, "the other person"), human: "the person starting this conversation" };
    case "witness":
      return { ai: clip(setup.who, "the person being spoken to"), human: "the person sharing their faith" };
    case "rapbattle":
      return { ai: clip(setup.mcName, "Verse Vice"), human: "the rival MC" };
    case "acting":
      return { ai: clip(setup.partnerRole, "the scene partner"), human: clip(setup.yourRole, "the lead") };
    default:
      return { ai: opponentLabel(debate, mode), human: "your debate opponent" };
  }
}
__name(turnRoles, "turnRoles");
function roleTranscript(turns, debate, mode, setup) {
  const r = turnRoles(debate, mode, setup);
  return formatTranscript(turns, `YOU (${r.ai})`, `USER (${r.human})`);
}
__name(roleTranscript, "roleTranscript");
function roleLock(debate, mode, setup) {
  const r = turnRoles(debate, mode, setup);
  return `\n\nROLE LOCK: You are ${r.ai}. The user is ${r.human}. Write ONLY your own next line as ${r.ai} \u2014 never write the user's lines, never switch sides or roles, and never add speaker labels.`;
}
__name(roleLock, "roleLock");
__name(formatTranscript, "formatTranscript");
var PROFANITY_PATTERN = /\b(f+u+c+k+|s+h+i+t+|b+i+t+c+h+|a+s+s+(h+o+l+e+)?|d+a+m+n+|d+i+c+k+|p+u+s+s+y+|c+u+n+t+|w+h+o+r+e+|s+l+u+t+|n+i+g+g+[aeiou]+|f+a+g+(g+o+t+)?|t+i+t+s+|b+o+o+b+s?|p+e+n+i+s+|v+a+g+i+n+a+|c+l+i+t+|o+r+g+a+s+m+|m+a+s+t+u+r+b+a+t+e+|p+o+r+n+|h+e+n+t+a+i+|r+a+p+i+s+t+|m+o+l+e+s+t+)\b/gi;
function maskProfanity(text) {
  PROFANITY_PATTERN.lastIndex = 0;
  return text.replace(PROFANITY_PATTERN, "****");
}
__name(maskProfanity, "maskProfanity");
function parseScores(raw2, dimensions) {
  const fallback = /* @__PURE__ */ __name(() => ({
    overall: null,
    notes: "",
    dimensions: dimensions.map((label) => ({ label, score: null }))
  }), "fallback");
  const coerce = /* @__PURE__ */ __name((v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(10, Math.max(1, Math.round(n))) : null;
  }, "coerce");
  const pick = /* @__PURE__ */ __name((obj) => {
    const dimObj = obj?.dimensions && typeof obj.dimensions === "object" ? obj.dimensions : obj;
    const lower = {};
    if (dimObj && typeof dimObj === "object") {
      for (const [k, v] of Object.entries(dimObj)) lower[k.toLowerCase()] = v;
    }
    return {
      overall: coerce(obj?.overall),
      notes: typeof obj?.notes === "string" ? obj.notes.slice(0, 2e3) : "",
      dimensions: dimensions.map((label) => ({
        label,
        score: coerce(lower[label.toLowerCase()])
      }))
    };
  }, "pick");
  try {
    return pick(JSON.parse(raw2));
  } catch {
  }
  const m = raw2.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      return pick(JSON.parse(m[0]));
    } catch {
    }
  }
  // Cut off or malformed: flag it so /end asks again instead of saving raw JSON as the notes.
  return { ...fallback(), failed: true };
}
__name(parseScores, "parseScores");
// Appended to every mode's scoring prompt: the scorecard is the HUMAN's grade, never the AI's.
var SCORE_HUMAN_ONLY = `

WHO YOU ARE SCORING: only the turns labeled "HUMAN". The "AI OPPONENT" turns are context for judging how well the human responded — never give the human credit for the opponent's arguments, and never score the opponent. Score what the human actually said: short, off-topic, insulting, or content-free turns earn low scores (1-3) no matter how strong the opponent was. Write "notes" to the human in second person ("you").`;
// Deterministic backstop: a handful of words can't earn a good grade, whatever the model says.
function capLowEffortScores(scores, turnRows) {
  const words = turnRows
    .filter((t) => t.role === "user")
    .reduce((n, t) => n + String(t.text || "").trim().split(/\s+/).filter(Boolean).length, 0);
  if (words >= 25 || scores.overall == null) return scores;
  const cap = words < 10 ? 2 : 3;
  return {
    ...scores,
    overall: Math.min(scores.overall, cap),
    dimensions: scores.dimensions.map((d) => ({ ...d, score: d.score == null ? null : Math.min(d.score, cap) })),
    notes: `${scores.notes ? scores.notes + " " : ""}(You spoke only ${words} word${words === 1 ? "" : "s"} in total, so the score is capped — make full arguments to earn a higher grade.)`.trim()
  };
}
__name(capLowEffortScores, "capLowEffortScores");
function emptyScores(dimensions, notes) {
  return {
    overall: null,
    notes,
    dimensions: dimensions.map((label) => ({ label, score: null }))
  };
}
__name(emptyScores, "emptyScores");

// ---------------------------------------------------------------- Acting: "Run my script"
// The partner reads the other characters' lines verbatim — no model call per line, so this
// mode costs only speech. Accepts "NAME: line", "NAME. line" and screenplay format
// (character name alone on a line, dialogue below). Stage directions in () or [] are skipped.
var SCRIPT_MAX_CHARS = 3e4;
function normCharName(n) {
  return String(n || "").replace(/\([^)]*\)/g, "").replace(/[^\p{L}\p{N} .'\-]/gu, "").replace(/\.+$/, "").trim().toUpperCase().replace(/\s+/g, " ");
}
__name(normCharName, "normCharName");
function stripDirections(t) {
  return String(t || "").replace(/\([^)]*\)/g, " ").replace(/\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();
}
__name(stripDirections, "stripDirections");
function parseScript(raw) {
  const out = [];
  let cur = null;
  let pending = null;
  const push = (name, text) => {
    const t = stripDirections(text);
    if (!name || !t) return;
    if (cur && cur.name === name) cur.text += " " + t;
    else out.push(cur = { name, text: t });
  };
  for (const rawLine of String(raw || "").replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      pending = null;
      continue;
    }
    if (/^(INT|EXT|INT\/EXT|I\/E)[.\s]/.test(line) || /^(FADE|CUT TO|DISSOLVE|SMASH CUT|THE END)/.test(line)) {
      pending = null;
      continue;
    }
    const colon = line.match(/^([\p{L}][\p{L}\p{N} .'\-]{0,30}?)\s*(\([^)]*\))?\s*:\s*(.+)$/u);
    if (colon && colon[1].split(" ").length <= 4) {
      push(normCharName(colon[1]), colon[3]);
      pending = null;
      continue;
    }
    const dotted = line.match(/^([A-Z][A-Z .'\-]{1,30}?)\.\s+(.+)$/);
    if (dotted && dotted[1] === dotted[1].toUpperCase() && dotted[1].split(" ").length <= 4) {
      push(normCharName(dotted[1]), dotted[2]);
      pending = null;
      continue;
    }
    const caps = line.match(/^([A-Z][A-Z0-9 .'\-]{0,30})(\s*\([^)]*\))?$/);
    if (caps && /[A-Z]{2}/.test(caps[1]) && caps[1].trim().split(/\s+/).length <= 4) {
      pending = normCharName(caps[1]);
      continue;
    }
    if (pending) push(pending, line);
  }
  return out;
}
__name(parseScript, "parseScript");
function scriptBlocks(entries, role) {
  const blocks = [];
  for (const e of entries) {
    const who = e.name === role ? "user" : "partner";
    const last = blocks[blocks.length - 1];
    if (last && last.who === who) last.lines.push(e);
    else blocks.push({ who, lines: [e] });
  }
  return blocks;
}
__name(scriptBlocks, "scriptBlocks");
function blockText(block) {
  const names = new Set(block.lines.map((l) => l.name));
  return names.size > 1 ? block.lines.map((l) => `${l.name}: ${l.text}`).join("\n") : block.lines.map((l) => l.text).join(" ");
}
__name(blockText, "blockText");
function lineAccuracy(expected, said) {
  const w = (x) => String(x || "").toLowerCase().replace(/[’']/g, "").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  const a = w(expected).slice(0, 600), b = w(said).slice(0, 600);
  if (!a.length) return 100;
  if (!b.length) return 0;
  const dp = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let prev = 0;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev + 1 : Math.max(dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return Math.round(200 * dp[b.length] / (a.length + b.length));
}
__name(lineAccuracy, "lineAccuracy");
// The partner block that answers the user's u-th line (u = 0 → the opening, if the partner starts).
function scriptPartnerReply(blocks, u) {
  let pos = 0;
  if (u > 0) {
    let seen = 0;
    pos = blocks.length;
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].who === "user" && ++seen === u) {
        pos = i + 1;
        break;
      }
    }
  }
  const b = blocks[pos];
  return b && b.who === "partner" ? blockText(b) : null;
}
__name(scriptPartnerReply, "scriptPartnerReply");
function isActingScript(debate, setup) {
  return debate.mode === "acting" && setup.actingMode === "script" && !!setup.script && !!setup.scriptRole;
}
__name(isActingScript, "isActingScript");
// ---------------------------------------------------------------- Difficulty
// Easy / Normal / Hard change how strong the opponent plays; the judge stays impartial, so a
// win at any level is a real win. The honesty rule (no invented evidence) applies at every level.
var DIFFICULTY_LEVELS = ["easy", "normal", "hard"];
var HONEST_EVIDENCE_RULE = " Never invent statistics, studies, quotes, or sources; argue from reasoning and widely known facts, and say “I don’t know” rather than making something up.";
function difficultyRules(modeId, level) {
  const agree = modeId === "sales" ? "agree to buy (or to a clear next step)" : modeId === "negotiation" ? "accept a reasonable deal" : null;
  const LEN_OVERRIDE = " (This length limit overrides any other length mentioned.)";
  if (level === "easy") {
    return "\n\nDIFFICULTY: EASY — you are a beatable sparring partner for someone still learning. Make ONE clear point per turn in plain language, under 70 words" + LEN_OVERRIDE + ". Ask simple, direct questions. When the user makes a reasonable, supported point, openly concede it (“Okay, that’s a good point—”) and don’t keep re-litigating it. Leave room for the user to win; never pile on or stack multiple attacks. Stay in character and on your side." + (agree ? ` If the user handles your main concerns decently, ${agree}.` : "") + HONEST_EVIDENCE_RULE;
  }
  if (level === "hard") {
    return "\n\nDIFFICULTY: HARD — play at full strength. Exploit every gap, press weak evidence, and concede only points you genuinely cannot answer." + (agree ? ` Only ${agree} if the user truly earns it.` : "") + HONEST_EVIDENCE_RULE;
  }
  return "\n\nDIFFICULTY: NORMAL — be a strong but fair opponent. Keep replies under 100 words" + LEN_OVERRIDE + " with one main line of attack per turn. When the user makes a genuinely good, well-supported point, acknowledge it briefly (“Fair point on X — but…”) before contesting their conclusion; never pretend a strong point is weak." + (agree ? ` If the user handles your key objections well, ${agree} — don’t stall forever.` : "") + HONEST_EVIDENCE_RULE;
}
__name(difficultyRules, "difficultyRules");
function sideInstruction(debate, setup) {
  if (setup.userSide === "for") return `\nSIDES: The user argues FOR the motion "${debate.topic}". You argue AGAINST it. Never switch sides or concede the motion.`;
  if (setup.userSide === "against") return `\nSIDES: The user argues AGAINST the motion "${debate.topic}". You argue FOR it. Never switch sides or concede the motion.`;
  return "";
}
__name(sideInstruction, "sideInstruction");
function buildTurnPrompt(debate, mode, setup, transcript, isOpening, curRound, targetRounds, forceClosing = false) {
  const debateStyle = setup.debateStyle || "oxford";
  const isDebateMode = debate.mode === "debate" || debate.mode === "historical";
  if (isDebateMode) return buildDebateTurnPrompt(debate, mode, setup, transcript, isOpening, curRound, targetRounds, forceClosing, debateStyle) + sideInstruction(debate, setup);
  const finalTurn = forceClosing || (targetRounds > 0 && curRound >= targetRounds);
  if (isOpening) return buildDebateTurnPrompt(debate, mode, setup, transcript, true, curRound, targetRounds, false, debateStyle);
  const ending = finalTurn
    ? `\n\nThis is the FINAL exchange of the session (${curRound} of ${targetRounds || curRound}). Respond in character, then bring the conversation to a natural close (e.g. wrap up the interview, state your final position in the negotiation, deliver your closing bars). Do not ask a new question.`
    : targetRounds > 0
      ? `\n\n(Exchange ${curRound} of ${targetRounds}.)`
      : "";
  const r = turnRoles(debate, mode, setup);
  return `Session transcript:\n\n${transcript}\n\nRespond to the user's latest message in character as ${r.ai} (the user is ${r.human}). Write only ${r.ai}'s next line.${ending}`;
}
__name(buildTurnPrompt, "buildTurnPrompt");
function buildDebateTurnPrompt(debate, mode, setup, transcript, isOpening, curRound, targetRounds, forceClosing, debateStyle) {
  const isDebateMode = debate.mode === "debate" || debate.mode === "historical";

  if (isOpening) {
    if (isDebateMode) {
      if (debateStyle === "lincoln_douglas") {
        return `You are taking the floor as the FIRST speaker delivering the formal OPENING STATEMENT in a Lincoln-Douglas debate on: "${debate.topic}".
Define your core moral framework (e.g. Utilitarianism, Deontology, Social Contract, Natural Rights) and value criterion. Argue why your position upholds this moral principle with rigorous philosophical justification. Keep under 140 words, dignified, articulate, and formidable.`;
      } else if (debateStyle === "rapid") {
        return `You are taking the floor first in a high-intensity Rapid Cross-Examination debate on: "${debate.topic}".
Deliver a sharp, aggressive opening challenge attacking the counter-position. Keep under 70 words, punchy and direct, ending with an incisive question.`;
      } else if (debateStyle === "freeform") {
        return `You are opening a sparring discussion on: "${debate.topic}".
State your opening position clearly, provocatively, and concisely under 100 words.`;
      } else {
        return `You are taking the floor as the FIRST speaker delivering the formal OPENING STATEMENT / CONSTRUCTIVE SPEECH on the motion: "${debate.topic}".
State your side's resolution with confidence, lay out 2-3 foundational pillars supported by reasoning, and set the terms of the debate. Keep under 140 words, articulate and intellectually formidable.`;
      }
    } else if (debate.mode === "interview") {
      return `You are the hiring manager conducting an interview for ${setup.jobTitle || "the position"}${setup.company ? ` at ${setup.company}` : ""}. Welcome the candidate and deliver your opening question. Keep under 80 words.`;
    } else if (debate.mode === "thesis") {
      return `The thesis defense is convened on: "${setup.thesisStatement}". As committee chair, welcome the candidate and deliver the committee's opening challenge/question. Keep under 80 words.`;
    } else if (debate.mode === "expert") {
      return `You are playing ${setup.audience || "a skeptical decision-maker"}. The candidate is the expert on "${setup.topic}". Welcome them and ask your first challenging question. Keep under 80 words.`;
    } else if (debate.mode === "rapbattle") {
      return `You won the coin toss and take the mic first in this rap battle on: "${debate.topic}"! Drop your opening 8-12 bars. Sharp flow, clever wordplay, completely clean and free of vulgarity.`;
    } else {
      const r = turnRoles(debate, mode, setup);
      return `Begin the session on "${debate.topic}". You are ${r.ai}; the user is ${r.human}. Deliver your opening lines in character as ${r.ai} only, under 100 words.`;
    }
  }

  let phaseGuidance = "";
  if (isDebateMode) {
    if (curRound <= 1) {
      phaseGuidance = `[PHASE 1: OPENING STATEMENTS] The user has delivered their opening statement on: "${debate.topic}".
Deliver your formal OPENING COUNTER-STATEMENT. Directly challenge their primary definitions and premises, and establish your own core contentions. Keep under 140 words.`;
    } else if (forceClosing || (targetRounds > 0 && curRound >= targetRounds)) {
      phaseGuidance = `[PHASE 3: FINAL CLOSING ARGUMENTS - ROUND ${curRound}${targetRounds ? ` OF ${targetRounds}` : ""}]
This is the FINAL ROUND of the debate. Deliver your formal CLOSING STATEMENT to the judge. Crystallize the core voting issues: make your strongest final case, point out anything the user left unanswered, and honestly acknowledge any point they clearly won. Deliver a compelling final appeal. Keep under 140 words.`;
    } else {
      const roundLabel = targetRounds > 0 ? `Round ${curRound} of ${targetRounds}` : `Round ${curRound} (Unlimited Sparring)`;
      phaseGuidance = `[PHASE 2: REBUTTAL & CROSS-EXAMINATION - ${roundLabel}]
Direct clash: attack weak premises, expose contradictions, challenge unverified claims, and press your advantage. Keep under 120 words.`;
    }
  } else {
    const r = turnRoles(debate, mode, setup);
    phaseGuidance = `Respond to the user's latest message in character as ${r.ai}. Reply only as ${r.ai}.`;
  }

  return `Session transcript:

${transcript}

${phaseGuidance}`;
}
__name(buildDebateTurnPrompt, "buildDebateTurnPrompt");

// Which session options each mode accepts. Mirrors MODE_UI in frontend/src/app.js.
var MODE_RULES = {
  debate: { first: ["cointoss", "user", "opponent"], styles: true, sides: true },
  historical: { first: ["cointoss", "user", "opponent"], styles: true, sides: true },
  rapbattle: { first: ["cointoss", "user", "opponent"] },
  negotiation: { first: ["user", "opponent"] },
  sales: { first: ["user", "opponent"] },
  difficult: { first: ["user", "opponent"] },
  acting: { first: ["user", "opponent"] },
  witness: { first: ["user", "opponent"] },
  interview: { fixedFirst: "opponent" },
  thesis: { fixedFirst: "opponent" },
  expert: { fixedFirst: "opponent" }
};
var scorecardTableReady = false;
async function ensureScorecardTable(db) {
  if (scorecardTableReady) return;
  await db.prepare("CREATE TABLE IF NOT EXISTS scorecards (debate_id TEXT PRIMARY KEY, overall INTEGER, scores_json TEXT NOT NULL, created_at TEXT NOT NULL)").run();
  scorecardTableReady = true;
}
__name(ensureScorecardTable, "ensureScorecardTable");
async function getScorecard(db, debateId) {
  try {
    await ensureScorecardTable(db);
    const row = await db.prepare("SELECT scores_json FROM scorecards WHERE debate_id = ?").bind(debateId).first();
    return row ? JSON.parse(row.scores_json) : null;
  } catch {
    return null;
  }
}
__name(getScorecard, "getScorecard");
async function countUserTurns(db, debateId) {
  const r = await db.prepare("SELECT COUNT(*) AS n FROM turns WHERE debate_id = ? AND role = 'user'").bind(debateId).first();
  return Number(r?.n ?? 0);
}
__name(countUserTurns, "countUserTurns");
var debateRouter = new Hono2();
debateRouter.post("/start", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.json().catch(() => ({}));
  const rawMode = String(body.mode ?? "");
  const legacyPersonality = String(body.personality ?? "");
  let topic = String(body.topic ?? "").trim();
  const rawSetup = body.setup && typeof body.setup === "object" ? body.setup : {};
  if (rawMode && !MODES[rawMode]) return c.json({ error: "invalid_mode" }, 400);
  const mode = getMode(rawMode || void 0);
  if (mode.educationExcluded && await isOrgMember(c.env.DB, user.id)) {
    return c.json({ error: "mode_not_available_for_education" }, 403);
  }
  let persona = "";
  const pBody = body.persona;
  const pSetup = rawSetup.persona;
  if (typeof pBody === "string" && pBody.trim()) persona = pBody.trim();
  else if (typeof pSetup === "string" && pSetup.trim()) persona = pSetup.trim();
  else if (legacyPersonality.trim()) persona = legacyPersonality.trim();
  if (!topic) {
    if (mode.id === "thesis") {
      topic = `Thesis: ${rawSetup.thesisStatement || ""}${rawSetup.field ? ` (${rawSetup.field})` : ""}`.trim();
    } else if (mode.id === "acting") {
      topic = `Acting: ${rawSetup.yourRole || "Scene"}${rawSetup.sceneContext ? ` - ${rawSetup.sceneContext}` : ""}`.trim();
    } else if (mode.id === "interview") {
      topic = `Interview: ${rawSetup.jobTitle || "Role"}${rawSetup.company ? ` at ${rawSetup.company}` : ""}`.trim();
    } else if (mode.id === "negotiation") {
      topic = `Negotiation: ${rawSetup.scenario || rawSetup.yourGoal || "Deal"}`.trim();
    } else if (mode.id === "sales") {
      topic = `Pitch: ${rawSetup.product || "Product"}${rawSetup.buyerPersona ? ` to ${rawSetup.buyerPersona}` : ""}`.trim();
    } else if (mode.id === "difficult") {
      topic = String(rawSetup.situation || (rawSetup.otherParty ? `Conversation with ${rawSetup.otherParty}` : "Difficult conversation")).trim();
    } else if (mode.id === "witness") {
      topic = rawSetup.who ? `Sharing the gospel with ${rawSetup.who}`.trim() : "Sharing the gospel";
    } else if (mode.id === "rapbattle") {
      topic = rawSetup.theme ? `Rap battle: ${rawSetup.theme}`.trim() : "Open rap battle";
    } else if (mode.id === "historical" && rawSetup.figureId) {
      const fig = figureById(rawSetup.figureId);
      topic = fig ? (fig.suggestedTopic || `Debate with ${fig.name}`) : "Historical debate";
    } else if (mode.id === "expert") {
      topic = String(rawSetup.topic || (rawSetup.profession ? `Expert: ${rawSetup.profession}` : "Domain Expert")).trim();
    } else if (mode.name) {
      topic = `${mode.name} Session`;
    }
  }
  if (!topic) return c.json({ error: "topic_required" }, 400);
  if (topic.length > 300) topic = topic.slice(0, 300);
  const setup = {};
  for (const [k, v] of Object.entries(rawSetup)) {
    if (typeof v === "string" && (v.length <= 2e3 || k === "script" && v.length <= SCRIPT_MAX_CHARS)) setup[k] = v;
  }
  if (mode.id === "acting") delete setup.difficulty;
  else setup.difficulty = DIFFICULTY_LEVELS.includes(setup.difficulty) ? setup.difficulty : "normal";
  delete setup.judge;
  if (JUDGE_COMPETITIVE_MODES.has(mode.id) && mode.id !== "thesis") setup.judge = "1";
  const rules = MODE_RULES[mode.id] || { first: ["user", "opponent"] };
  if (rules.sides && ["for", "against", "open"].includes(setup.userSide)) {
  } else delete setup.userSide;
  let actorId = "";
  let figureId;
  if (mode.id === "debate") {
    actorId = PERSONALITY_PROMPTS[persona] ? persona : "prosecutor";
    setup.persona = actorId;
  } else if (mode.id === "historical") {
    const fig = figureById(typeof rawSetup.figureId === "string" ? rawSetup.figureId : "");
    if (!fig || fig.retired) return c.json({ error: "invalid_figure" }, 400);
    figureId = fig.id;
    actorId = fig.id;
    setup.figureId = fig.id;
  }
  let scriptFirst = null;
  let scriptTarget = null;
  if (mode.id === "acting") {
    if (setup.actingMode === "script") {
      const entries = parseScript(setup.script);
      const role = normCharName(setup.scriptRole);
      const names = [...new Set(entries.map((e) => e.name))];
      if (entries.length < 2 || names.length < 2) return c.json({ error: "script_invalid", message: "We couldn’t find at least two characters in that script. Put each line as NAME: line." }, 400);
      if (!names.includes(role)) return c.json({ error: "script_role_missing", message: "Pick which character you’re playing." }, 400);
      setup.scriptRole = role;
      const blocks = scriptBlocks(entries, role);
      scriptFirst = blocks[0].who === "user" ? "user" : "opponent";
      scriptTarget = Math.min(100, blocks.filter((b) => b.who === "user").length);
    } else {
      setup.actingMode = "improv";
      delete setup.script;
      delete setup.scriptRole;
    }
  }
  const availability = await checkRoundsAvailable(c, user.id, user.email);
  if (!availability.ok) return c.json({ error: "quota_exhausted", message: "You have no rounds remaining in your wallet. Please select a plan or top-up pack to continue." }, 402);
  const targetRounds = scriptTarget ?? Math.max(0, Math.min(100, Math.floor(Number(body.targetRounds ?? rawSetup.targetRounds ?? 0)) || 0));
  setup.targetRounds = String(targetRounds);

  let reqFirstSpeaker = String(body.firstSpeaker ?? rawSetup.firstSpeaker ?? "").toLowerCase();
  if (scriptFirst) reqFirstSpeaker = scriptFirst;
  else if (rules.fixedFirst) reqFirstSpeaker = rules.fixedFirst;
  else if (!rules.first.includes(reqFirstSpeaker)) reqFirstSpeaker = rules.first.includes("cointoss") ? "cointoss" : "user";
  let resolvedFirstSpeaker = reqFirstSpeaker;
  if (reqFirstSpeaker === "cointoss") {
    resolvedFirstSpeaker = Math.random() < 0.5 ? "user" : "opponent";
  }
  setup.firstSpeaker = reqFirstSpeaker;
  setup.resolvedFirstSpeaker = resolvedFirstSpeaker;

  const validStyles = new Set(["oxford", "lincoln_douglas", "rapid", "freeform"]);
  const reqStyle = String(body.debateStyle ?? rawSetup.debateStyle ?? "oxford").toLowerCase();
  if (rules.styles) setup.debateStyle = validStyles.has(reqStyle) ? reqStyle : "oxford";
  else delete setup.debateStyle;

  const debateId = newId();
  await c.env.DB.prepare(
    "INSERT INTO debates (id, user_id, personality, topic, mode, setup_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(debateId, user.id, actorId, topic, mode.id, JSON.stringify(setup), nowIso()).run();
  return c.json({
    debateId,
    targetRounds,
    remainingRounds: availability.remaining,
    firstSpeaker: setup.firstSpeaker,
    resolvedFirstSpeaker: setup.resolvedFirstSpeaker,
    debateStyle: setup.debateStyle ?? null,
    judge: setup.judge === "1"
  }, 201);
});
// Cut a reply that stopped early back to its last complete sentence (or line, for verse).
function trimToLastSentence(s) {
  const re = /[.!?…]["'”’)\]*_]*(?=\s|$)|\n/g;
  let end = 0;
  for (let m; (m = re.exec(s)); ) end = m[0] === "\n" ? m.index : m.index + m[0].length;
  return s.slice(0, end).trim();
}
__name(trimToLastSentence, "trimToLastSentence");
// (The non-streaming /turn endpoint was removed: the app only uses /turn-stream.)
debateRouter.post("/turn-stream", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.json().catch(() => ({}));
  const debateId = String(body.debateId ?? "");
  const text = String(body.text ?? "").trim();
  const isOpening = body.action === "open";
  if (!debateId || (!text && !isOpening)) return c.json({ error: "debateId_and_text_required" }, 400);
  if (text.length > 4e3) return c.json({ error: "text_too_long" }, 400);
  const debate = await getOwnedDebate(c, debateId, user.id);
  if (!debate) return c.json({ error: "debate_not_found" }, 404);
  if (debate.ended_at) return c.json({ error: "debate_ended" }, 400);
  if (isOpening) {
    const existingAssistant = await c.env.DB.prepare("SELECT id FROM turns WHERE debate_id = ? AND role = 'assistant' LIMIT 1").bind(debateId).first();
    if (existingAssistant) return c.json({ error: "opening_already_delivered" }, 400);
  }
  const mode = getMode(debate.mode);
  const setup = parseSetup(debate.setup_json);
  const targetRounds = parseInt(setup.targetRounds ?? "0", 10) || 0;
  const systemPrompt = mode.systemPrompt({ ...setup, topic: debate.topic }) + (debate.mode === "acting" ? "" : difficultyRules(debate.mode, setup.difficulty || "hard")) + roleLock(debate, mode, setup);
  const premium = await isPremium(c, user.id, user.email);
  const forceClosing = body.phase === "closing";
  // When the browser synthesizes speech itself (Azure SDK + visemes), don't pay for a
  // second server-side synthesis of the same text.
  const clientTts = body.clientTts === true;
  const figureId = debate.mode === "historical" ? figureById(setup.figureId)?.id : void 0;
  const personaVisualId = typeof setup.personaVisual === "string" ? setup.personaVisual : void 0;
  const consumption = await consumeRound(c, user.id, user.email);
  if (!consumption.allowed) return c.json({ error: "quota_exhausted", message: "You have used all rounds in your wallet." }, 402);
  // From here the round is charged: every failure path must undo the stored turn and the charge.
  let userTurnId = null;
  const undoTurn = /* @__PURE__ */ __name(async () => {
    // Remove the user's turn so a resend doesn't duplicate it in the transcript.
    if (userTurnId) {
      try {
        await c.env.DB.prepare("DELETE FROM turns WHERE id = ? AND debate_id = ?").bind(userTurnId, debateId).run();
      } catch {
      }
    }
    await refundRound(c, user.id, consumption);
  }, "undoTurn");
  const snag = "The opponent hit a snag — try sending that again. That round wasn’t charged.";
  let userInput, voiceInfo, scriptReply = null;
  try {
    if (!isOpening) {
      const ins = await c.env.DB.prepare("INSERT INTO turns (debate_id, role, text, created_at) VALUES (?, ?, ?, ?)").bind(debateId, "user", text, nowIso()).run();
      userTurnId = ins?.meta?.last_row_id ?? null;
    }
    const history = await c.env.DB.prepare(
      "SELECT role, text FROM turns WHERE debate_id = ? ORDER BY id DESC LIMIT 20"
    ).bind(debateId).all();
    const transcript = roleTranscript([...history.results ?? []].reverse(), debate, mode, setup);
    // A round = one user turn + one opponent reply, so the round being answered is
    // the number of user turns so far (the opening, if the AI opens, is round 1).
    let curRound = Math.max(1, await countUserTurns(c.env.DB, debateId));
    // If the opponent opened, the user's first reply is their opening; the opponent's answer
    // to it is already a rebuttal, not a second opening.
    if (!isOpening && setup.resolvedFirstSpeaker === "opponent" && curRound === 1 && targetRounds !== 1) curRound = 2;
    // Acting "Run my script": the partner's line comes straight from the script (no model call).
    if (isActingScript(debate, setup)) {
      const blocks = scriptBlocks(parseScript(setup.script), setup.scriptRole);
      scriptReply = scriptPartnerReply(blocks, isOpening ? 0 : await countUserTurns(c.env.DB, debateId)) ?? "That’s the end of the scene. Tap End & grade for your notes.";
    }
    userInput = buildTurnPrompt(debate, mode, setup, transcript, isOpening, curRound, targetRounds, forceClosing);
    voiceInfo = await resolveTtsVoice(debate.personality, figureId, personaVisualId).catch(() => null);
  } catch (err) {
    console.error("turn-stream setup failed:", err instanceof Error ? err.message : err);
    await undoTurn();
    return c.json({ error: "turn_failed", message: snag }, 503);
  }
  const encoder = new TextEncoder();
  let controller = null;
  let gone = false;
  const stream = new ReadableStream({
    start(ctl) {
      controller = ctl;
    },
    cancel() {
      gone = true;
    }
  });
  const send = /* @__PURE__ */ __name((obj) => {
    if (gone) return;
    try {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
    } catch {
      gone = true;
    }
  }, "send");
  const t0 = Date.now();
  // The turn runs outside the response stream and under waitUntil, so a phone that locks or
  // drops the connection mid-reply doesn't cancel it: the reply is still saved (or the round
  // refunded) and shows up on reload.
  const work = (async () => {
    // Keeps phones and proxies from dropping a quiet connection while the model thinks.
    const ping = setInterval(() => send({ t: "ping" }), 8e3);
    try {
      let hdVoice = null;
      if (clientTts && premium && voiceInfo?.voice && HD_VOICE_MAP[voiceInfo.voice] && hdSpeechConfigured(c.env) && c.env.LIVEAVATAR_API_KEY) {
        try {
          const map = await resolveAvatarMap(c.env, c.env.DB);
          if (avatarIdFor(map, avatarKeyForDebate(debate))) hdVoice = HD_VOICE_MAP[voiceInfo.voice];
        } catch {
        }
      }
      send({
        t: "hello",
        ttsVoice: hdVoice || (voiceInfo?.voice ?? null),
        ttsHd: !!hdVoice,
        ttsStyle: hdVoice ? null : voiceInfo?.style ?? null,
        ttsStyleDegree: hdVoice ? null : voiceInfo?.styledegree ?? null
      });
      let full = "";
      let truncated = false;
      if (scriptReply !== null) {
        full = scriptReply;
        send({ t: "tok", c: full });
      } else {
        // Clean modes: stream whole words only, masked, so profanity never reaches the screen
        // even for a moment.
        let hold = "";
        const meta = {};
        // max_tokens is only a ceiling (replies are prompted to ~200 tokens); the headroom is for
        // any hidden reasoning, which counts against it.
        for await (const tok of modelStream(c.env, systemPrompt, userInput, 4e3, { premium, meta })) {
          full += tok;
          if (!mode.clean) {
            send({ t: "tok", c: tok });
            continue;
          }
          hold += tok;
          const cut = hold.search(/[\s.,!?;:]\S*$/);
          if (cut > 0) {
            send({ t: "tok", c: maskProfanity(hold.slice(0, cut + 1)) });
            hold = hold.slice(cut + 1);
          }
        }
        if (mode.clean && hold) send({ t: "tok", c: maskProfanity(hold) });
        // Stopped by the token cap or content filter, or upstream closed without finishing.
        const cutOff = meta.finishReason === "length" || meta.finishReason === "content_filter" || !meta.sawDone && !meta.finishReason;
        console[cutOff ? "warn" : "log"]("[turn-stream] end", {
          debateId,
          premium,
          model: meta.model,
          finishReason: meta.finishReason,
          sawDone: meta.sawDone,
          attempts: meta.attempts,
          len: full.length,
          reasoningChars: meta.reasoningChars,
          usage: meta.usage,
          ms: Date.now() - t0,
          clientGone: gone
        });
        if (cutOff) {
          const kept = trimToLastSentence(full);
          if (kept.length < 40) throw new Error(`reply cut off (${meta.finishReason || "no [DONE]"}) with too little to keep`);
          truncated = kept !== full.trim();
          full = kept;
        }
      }
      full = full.trim();
      if (!full) throw new Error("Debate model returned an empty response");
      if (mode.clean) full = maskProfanity(full);
      await c.env.DB.prepare("INSERT INTO turns (debate_id, role, text, created_at) VALUES (?, ?, ?, ?)").bind(debateId, "assistant", full, nowIso()).run();
      let tts = { audioBase64: null, timings: [], timingsEstimated: true };
      let audioFailed = false;
      if (!clientTts && !gone) {
        try {
          tts = await ttsDebateLine(c.env, full, debate.personality, figureId, personaVisualId);
        } catch (err) {
          console.error("TTS failed, returning text-only turn:", err instanceof Error ? err.message : err);
        }
        audioFailed = !tts.audioBase64;
      }
      send({
        t: "done",
        text: full,
        audioBase64: tts.audioBase64,
        audioFailed,
        remainingRounds: consumption.remaining,
        // The client shows done.text and must not speak the cut-off tail it already streamed.
        ...(truncated ? { truncated: true } : {})
      });
    } catch (err) {
      console.error("turn-stream failed:", err instanceof Error ? err.message : err, { debateId, clientGone: gone });
      await undoTurn();
      send({ t: "err", message: snag });
    } finally {
      clearInterval(ping);
      try {
        controller.close();
      } catch {
      }
    }
  })();
  try {
    c.executionCtx.waitUntil(work);
  } catch {
  }
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
});
debateRouter.post("/end", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.json().catch(() => ({}));
  const debateId = String(body.debateId ?? "");
  if (!debateId) return c.json({ error: "debateId_required" }, 400);
  const debate = await getOwnedDebate(c, debateId, user.id);
  if (!debate) return c.json({ error: "debate_not_found" }, 404);
  if (debate.ended_at) {
    const stored = await getScorecard(c.env.DB, debateId);
    if (stored) return c.json({ scores: stored, cached: true });
    return c.json({ error: "debate_already_ended" }, 400);
  }
  const mode = getMode(debate.mode);
  const turns = await c.env.DB.prepare(
    "SELECT role, text FROM turns WHERE debate_id = ? ORDER BY id ASC"
  ).bind(debateId).all();
  const turnRows = turns.results ?? [];
  let scores;
  if (turnRows.length === 0) {
    scores = emptyScores(mode.scoringDimensions, "Session concluded with no dialogue.");
  } else {
    const oppName = opponentLabel(debate, mode);
    const endSetup = parseSetup(debate.setup_json);
    const scriptMode = isActingScript(debate, endSetup);
    let accuracyNote = "";
    if (scriptMode) {
      const userBlocks = scriptBlocks(parseScript(endSetup.script), endSetup.scriptRole).filter((b) => b.who === "user");
      const said = turnRows.filter((t) => t.role === "user");
      const accs = said.map((t, i) => userBlocks[i] ? lineAccuracy(blockText(userBlocks[i]), t.text) : null).filter((x) => x != null);
      if (accs.length) accuracyNote = `Line accuracy: ${Math.round(accs.reduce((a, b) => a + b, 0) / accs.length)}% word-for-word across ${accs.length} of ${userBlocks.length} lines.`;
    }
    const transcript = turnRows
      .map((t) => `${t.role === "user" ? "HUMAN" : `AI OPPONENT (${oppName})`}: ${t.text}`)
      .join("\n\n");
    try {
      const premium = await isPremium(c, user.id, user.email);
      // A cut-off or malformed scorecard is never saved: ask once more, then let the user retry.
      for (let attempt = 1; attempt <= 2; attempt++) {
        const raw2 = await modelText(
          c.env,
          mode.scoringPrompt() + SCORE_HUMAN_ONLY + (scriptMode ? `\n\nThis was a scripted scene: the HUMAN performed written lines as the character ${endSetup.scriptRole} and the AI OPPONENT read the other parts verbatim. Judge delivery, interpretation and pacing as shown in the text, not the writing itself. ${accuracyNote}` : ""),
          `Session topic: ${debate.topic}

${transcript}`,
          4e3,
          { premium }
        );
        scores = parseScores(raw2, mode.scoringDimensions);
        if (!scores.failed) break;
        console.warn("[end] unparseable scorecard", { debateId, attempt, len: raw2.length });
      }
      if (scores.failed) throw new Error("unparseable scorecard");
    } catch {
      // Don't close the debate on a scoring outage: the user can press End & grade again.
      return c.json({ error: "scoring_unavailable", message: "Scoring is briefly unavailable \u2014 try End & grade again in a moment." }, 502);
    }
    if (!scriptMode) scores = capLowEffortScores(scores, turnRows);
    else if (accuracyNote) scores = { ...scores, notes: `${scores.notes ? scores.notes + " " : ""}${accuracyNote}` };
  }
  await ensureScorecardTable(c.env.DB);
  // Only the first concurrent /end wins; a second one returns the stored scorecard.
  const [upd] = await c.env.DB.batch([
    c.env.DB.prepare("UPDATE debates SET ended_at = ? WHERE id = ? AND ended_at IS NULL").bind(nowIso(), debateId),
    c.env.DB.prepare("INSERT OR IGNORE INTO scorecards (debate_id, overall, scores_json, created_at) VALUES (?, ?, ?, ?)").bind(debateId, scores.overall ?? null, JSON.stringify(scores), nowIso())
  ]);
  if (!upd?.meta?.changes) {
    const stored = await getScorecard(c.env.DB, debateId);
    if (stored) return c.json({ scores: stored, cached: true });
  }
  return c.json({ scores });
});
var JUDGE_COMPETITIVE_MODES = /* @__PURE__ */ new Set(["debate", "historical", "negotiation", "sales", "thesis", "rapbattle"]);
var JUDGE_CRITERIA = ["argumentation", "evidence", "rebuttal", "composure"];
function judgePrompt(competitive, opponentLabel2) {
  const outcomeRule = competitive ? 'Declare a winner: "you", "opponent", or "draw" (draw only for genuinely even performances). Set "assessment" to null.' : `Set "winner" to null. Instead give an overall assessment of the human's performance: "strong", "developing", or "needs_work".`;
  return [
    "You are an impartial judge. You did NOT participate in the conversation below and you have no stake in its outcome.",
    "",
    "The two sides:",
    '- "You": the human, who was practicing.',
    `- "${opponentLabel2}": their AI sparring partner.`,
    "",
    "Score BOTH sides by identical standards on each criterion, 1-10:",
    "- argumentation: quality and structure of arguments",
    "- evidence: use of facts, examples, and reasoning to support claims",
    "- rebuttal: direct engagement with the other side\u2019s points",
    "- composure: clarity, focus, and steadiness under pressure",
    "",
    "Rules of impartiality:",
    '- Judge the arguments as presented, not the speakers. Neither the "You" label nor the "AI" label earns favor or penalty.',
    "- Do not favor the side you personally agree with. Apply the rubric mechanically, the same way to both sides.",
    "- Do not reward length over substance: a short, sound reply beats a long, polished one. Penalize dodged questions and unsupported claims equally on both sides.",
    "- Specific statistics, studies, or quotes that aren't widely known count as UNSUPPORTED claims, not evidence, unless the speaker gave a verifiable source.",
    "- A point one side raised that the other never answered weighs heavily for the side that raised it.",
    `- ${outcomeRule}`,
    "",
    "Return ONLY valid JSON, no other text:",
    "{",
    '  "winner": "you" | "opponent" | "draw" | null,',
    '  "assessment": "strong" | "developing" | "needs_work" | null,',
    '  "you": {"argumentation": n, "evidence": n, "rebuttal": n, "composure": n},',
    '  "opponent": {"argumentation": n, "evidence": n, "rebuttal": n, "composure": n},',
    '  "reasoning": "2-4 sentences explaining the verdict, citing specific moments",',
    '  "turningPoint": "the single exchange that decided it, or null"',
    "}"
  ].join("\n");
}
__name(judgePrompt, "judgePrompt");
function parseVerdict(raw2, competitive) {
  const fallback = {
    winner: null,
    assessment: null,
    you: {},
    opponent: {},
    reasoning: "The judge could not reach a verdict.",
    turningPoint: null
  };
  let data;
  try {
    const cleaned = raw2.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    data = JSON.parse(cleaned);
  } catch {
    const m = raw2.match(/\{[\s\S]*\}/);
    try {
      data = m ? JSON.parse(m[0]) : null;
    } catch {
      data = null;
    }
    if (!data) return { ...fallback, failed: true };
  }
  const clampScore = /* @__PURE__ */ __name((v) => {
    const n = typeof v === "number" ? Math.round(v) : parseInt(String(v ?? ""), 10);
    return Number.isFinite(n) ? Math.min(10, Math.max(1, n)) : 5;
  }, "clampScore");
  const side = /* @__PURE__ */ __name((v) => {
    const obj = v && typeof v === "object" ? v : {};
    const out = {};
    for (const k of JUDGE_CRITERIA) out[k] = clampScore(obj[k]);
    return out;
  }, "side");
  const winnerRaw = String(data.winner ?? "");
  const winner = competitive && (winnerRaw === "you" || winnerRaw === "opponent" || winnerRaw === "draw") ? winnerRaw : null;
  const assessRaw = String(data.assessment ?? "");
  const assessment = !competitive && (assessRaw === "strong" || assessRaw === "developing" || assessRaw === "needs_work") ? assessRaw : null;
  return {
    winner,
    assessment,
    you: side(data.you),
    opponent: side(data.opponent),
    reasoning: String(data.reasoning ?? fallback.reasoning).slice(0, 2e3),
    turningPoint: typeof data.turningPoint === "string" && data.turningPoint.trim() ? data.turningPoint.slice(0, 500) : null
  };
}
__name(parseVerdict, "parseVerdict");
debateRouter.post("/judge", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.json().catch(() => ({}));
  const debateId = String(body.debateId ?? "");
  if (!debateId) return c.json({ error: "debateId_required" }, 400);
  const debate = await getOwnedDebate(c, debateId, user.id);
  if (!debate) return c.json({ error: "debate_not_found" }, 404);
  if (!debate.ended_at) return c.json({ error: "session_not_ended" }, 400);
  if (parseSetup(debate.setup_json).judge !== "1") return c.json({ error: "judge_not_enabled" }, 403);
  const cached = await c.env.DB.prepare("SELECT * FROM verdicts WHERE debate_id = ?").bind(debateId).first();
  if (cached) {
    return c.json({
      verdict: {
        winner: cached.winner,
        assessment: cached.assessment,
        ...JSON.parse(cached.scores_json),
        reasoning: cached.reasoning,
        turningPoint: cached.turning_point
      },
      cached: true
    });
  }
  const mode = getMode(debate.mode);
  const turns = await c.env.DB.prepare(
    "SELECT role, text FROM turns WHERE debate_id = ? ORDER BY id ASC"
  ).bind(debateId).all();
  const rows = turns.results ?? [];
  const hasYou = rows.some((t) => t.role === "user" && t.text.trim());
  const hasOpponent = rows.some((t) => t.role !== "user" && t.text.trim());
  if (!hasYou || !hasOpponent) return c.json({ error: "insufficient_transcript" }, 400);
  const competitive = JUDGE_COMPETITIVE_MODES.has(mode.id);
  const judgeName = opponentLabel(debate, mode);
  // Label the human "You" to match the judge prompt's vocabulary.
  const transcript = rows.map((t) => `${t.role === "user" ? "You" : judgeName}: ${t.text}`).join("\n\n");
  let verdict;
  try {
    const raw2 = await modelText(
      c.env,
      judgePrompt(competitive, opponentLabel(debate, mode)),
      `Session topic: ${debate.topic}

${transcript}`,
      1500,
      { premium: await isPremium(c, user.id, user.email) }
    );
    verdict = parseVerdict(raw2, competitive);
  } catch {
    return c.json({ error: "judge_unavailable" }, 502);
  }
  // A verdict the judge couldn't produce is not cached: the user can ask again.
  if (verdict.failed) return c.json({ error: "judge_unavailable" }, 502);
  await c.env.DB.prepare(
    "INSERT INTO verdicts (debate_id, winner, assessment, scores_json, reasoning, turning_point, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    debateId,
    verdict.winner,
    verdict.assessment,
    JSON.stringify({ you: verdict.you, opponent: verdict.opponent }),
    verdict.reasoning,
    verdict.turningPoint,
    nowIso()
  ).run();
  return c.json({ verdict, cached: false });
});
debateRouter.post("/toggle-public", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.json().catch(() => ({}));
  const debateId = String(body.debateId ?? "");
  const isPublic = body.isPublic ? 1 : 0;
  const debate = await getOwnedDebate(c, debateId, user.id);
  if (!debate) return c.json({ error: "debate_not_found" }, 404);
  await c.env.DB.prepare("UPDATE debates SET is_public = ? WHERE id = ?").bind(isPublic, debateId).run();
  const origin = c.req.header("origin") || c.env.APP_URL || "https://getadversaryai.com";
  return c.json({
    ok: true,
    isPublic: isPublic === 1,
    shareUrl: `${origin}/app/#/watch/${debateId}`
  });
});
var debatesRouter = new Hono2();
debatesRouter.get("/", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const rows = await c.env.DB.prepare(
    "SELECT id, personality, topic, mode, ended_at, created_at, setup_json, is_public, views FROM debates WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(user.id).all();
  const overallById = /* @__PURE__ */ new Map();
  try {
    await ensureScorecardTable(c.env.DB);
    const sc = await c.env.DB.prepare("SELECT s.debate_id, s.overall FROM scorecards s JOIN debates d ON d.id = s.debate_id WHERE d.user_id = ?").bind(user.id).all();
    for (const row of sc.results ?? []) overallById.set(row.debate_id, row.overall);
  } catch {
  }
  const debates = (rows.results ?? []).map((r) => {
    let judgeEnabled = false;
    let personaVisual;
    let setup = {};
    try {
      setup = JSON.parse(r.setup_json ?? "{}");
      judgeEnabled = setup.judge === "1";
      if (typeof setup.personaVisual === "string" && setup.personaVisual) {
        personaVisual = setup.personaVisual;
      }
    } catch {
    }
    const figureId = setup.figureId || (r.mode === "historical" ? r.personality : void 0);
    let personaLabel = typeof setup.personaLabel === "string" && setup.personaLabel ? setup.personaLabel : void 0;
    if (r.mode === "historical") {
      const fig = figureById(typeof figureId === "string" ? figureId : "");
      if (fig) personaLabel = fig.name;
    }
    if (!personaLabel && r.mode === "debate") personaLabel = PERSONALITY_NAMES[r.personality];
    const targetRounds = parseInt(setup.targetRounds ?? "0", 10) || 0;
    return {
      ...r,
      setup,
      judgeEnabled,
      personaVisual,
      personaLabel,
      figureId,
      targetRounds,
      firstSpeaker: setup.firstSpeaker,
      resolvedFirstSpeaker: setup.resolvedFirstSpeaker,
      debateStyle: setup.debateStyle,
      isPublic: Boolean(r.is_public),
      views: r.views ?? 0,
      overall: overallById.get(r.id) ?? null
    };
  });
  return c.json({ debates });
});
debatesRouter.get("/:id", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const debate = await getOwnedDebate(c, c.req.param("id"), user.id);
  if (!debate) return c.json({ error: "debate_not_found" }, 404);
  const turns = await c.env.DB.prepare(
    "SELECT id, role, text, created_at FROM turns WHERE debate_id = ? ORDER BY id ASC"
  ).bind(debate.id).all();
  const verdictRow = await c.env.DB.prepare("SELECT * FROM verdicts WHERE debate_id = ?").bind(debate.id).first();
  let verdict = null;
  if (verdictRow) {
    let scores = {};
    try { scores = JSON.parse(verdictRow.scores_json || "{}"); } catch {}
    verdict = {
      winner: verdictRow.winner,
      assessment: verdictRow.assessment,
      scores,
      you: scores.you || {},
      opponent: scores.opponent || {},
      reasoning: verdictRow.reasoning,
      turningPoint: verdictRow.turning_point,
      createdAt: verdictRow.created_at
    };
  }
  const votesRes = await c.env.DB.prepare("SELECT vote, COUNT(*) as count FROM debate_votes WHERE debate_id = ? GROUP BY vote").bind(debate.id).all();
  const votes = { you: 0, opponent: 0, draw: 0, total: 0 };
  for (const v of (votesRes.results ?? [])) {
    const cnt = Number(v.count) || 0;
    if (v.vote === "you" || v.vote === "user") votes.you += cnt;
    else if (v.vote === "opponent") votes.opponent += cnt;
    else if (v.vote === "draw") votes.draw += cnt;
    votes.total += cnt;
  }
  const setup = parseSetup(debate.setup_json);
  const targetRounds = parseInt(setup.targetRounds ?? "0", 10) || 0;
  const figureId = setup.figureId || (debate.mode === "historical" ? debate.personality : void 0);
  let personaLabel = typeof setup.personaLabel === "string" && setup.personaLabel ? setup.personaLabel : void 0;
  if (debate.mode === "historical") {
    const fig = figureById(typeof figureId === "string" ? figureId : "");
    if (fig) personaLabel = fig.name;
  }
  if (!personaLabel) personaLabel = opponentLabel(debate, getMode(debate.mode));
  const scorecard = debate.ended_at ? await getScorecard(c.env.DB, debate.id) : null;
  const availability = await checkRoundsAvailable(c, user.id, user.email);
  return c.json({
    scorecard,
    debate: {
      ...debate,
      targetRounds,
      figureId,
      personaLabel,
      firstSpeaker: setup.firstSpeaker,
      resolvedFirstSpeaker: setup.resolvedFirstSpeaker,
      debateStyle: setup.debateStyle,
      isPublic: Boolean(debate.is_public),
      views: debate.views ?? 0
    },
    turns: turns.results ?? [],
    verdict,
    votes,
    targetRounds,
    remainingRounds: availability.remaining
  });
});
debatesRouter.delete("/:id", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const debateId = c.req.param("id");
  const debate = await getOwnedDebate(c, debateId, user.id);
  if (!debate) return c.json({ error: "debate_not_found" }, 404);

  try {
    await c.env.DB.prepare("DELETE FROM turns WHERE debate_id = ?").bind(debateId).run();
    await c.env.DB.prepare("DELETE FROM verdicts WHERE debate_id = ?").bind(debateId).run();
    await c.env.DB.prepare("DELETE FROM debate_votes WHERE debate_id = ?").bind(debateId).run();
    await c.env.DB.prepare("DELETE FROM debate_reactions WHERE debate_id = ?").bind(debateId).run();
    try {
      await ensureScorecardTable(c.env.DB);
      await c.env.DB.prepare("DELETE FROM scorecards WHERE debate_id = ?").bind(debateId).run();
    } catch {
    }
    await c.env.DB.prepare("DELETE FROM debates WHERE id = ? AND user_id = ?").bind(debateId, user.id).run();
    return c.json({ ok: true, deleted: debateId });
  } catch (err) {
    console.error("[DELETE /api/debates/:id] error", err);
    return c.json({ error: "failed_to_delete" }, 500);
  }
});

async function getVoterKey(c) {
  // Logged-in users vote as themselves; anonymous voters are keyed by Cloudflare's verified
  // client IP (never a client-supplied header or cookie, which could be forged per request).
  const user = await getSessionUser(c).catch(() => null);
  if (user) return "u:" + user.id;
  const ip = c.req.header("cf-connecting-ip") || "anon";
  const enc = new TextEncoder().encode("ip|" + ip);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
__name(getVoterKey, "getVoterKey");

var publicRouter = new Hono2();

// Landing page: a still of the stock photoreal actor cast for a persona look (never the owner's
// own avatars). Proxied so expiring catalog URLs don't matter, and edge-cached for a day.
publicRouter.get("/cast/:look", async (c) => {
  const look = c.req.param("look");
  // The reason header says which step came up empty (no user data in it).
  const miss = /* @__PURE__ */ __name((why) => new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=600", "X-Cast-Miss": why } }), "miss");
  if (!AVATAR_VISUAL_KEYS.includes(look)) return miss("look");
  if (!c.env.LIVEAVATAR_API_KEY) return miss("off");
  const cache = typeof caches !== "undefined" ? caches.default : null;
  const key = new Request(new URL(c.req.url).toString());
  const hit = await cache?.match(key).catch(() => null);
  if (hit) return hit;
  const id = avatarIdFor(await getAvatarMap(c.env.DB), look);
  if (!id) return miss("unmapped");
  const cat = await fetchAvatarCatalog(c.env, c.env.DB).catch(() => []);
  const actor = cat.find((a) => a.id === id);
  if (!actor) return miss(cat.length ? "not-in-catalog" : "no-catalog");
  if (actor.own) return miss("own");
  if (!/^https:\/\//.test(actor.image || "")) return miss("no-image");
  const img = await fetch(actor.image).catch(() => null);
  if (!img?.ok) return miss(`fetch-${img?.status ?? "err"}`);
  // The catalog's storage serves its .webp stills as binary/octet-stream: go by the extension then.
  const ext = new URL(actor.image).pathname.split(".").pop().toLowerCase();
  const byExt = { webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", avif: "image/avif" }[ext];
  const sent = (img.headers.get("content-type") || "").split(";")[0];
  const type = sent.startsWith("image/") ? sent : byExt;
  if (!type) return miss("not-image");
  const res = new Response(img.body, { headers: { "Content-Type": type, "Cache-Control": "public, max-age=86400" } });
  if (cache) {
    const put = cache.put(key, res.clone()).catch(() => {});
    try {
      c.executionCtx.waitUntil(put);
    } catch {
    }
  }
  return res;
});

publicRouter.get("/debates", async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT d.id, d.personality, d.topic, d.mode, d.ended_at, d.created_at, d.views, d.setup_json,
            v.winner, v.assessment, v.reasoning, v.turning_point, v.scores_json
     FROM debates d
     LEFT JOIN verdicts v ON d.id = v.debate_id
     WHERE d.is_public = 1
     ORDER BY d.created_at DESC
     LIMIT 50`
  ).all();

  const debateIds = (rows.results ?? []).map(r => r.id);
  const votesMap = {};
  if (debateIds.length > 0) {
    const placeholders = debateIds.map(() => "?").join(",");
    const votesRows = await c.env.DB.prepare(
      `SELECT debate_id, vote, COUNT(*) as count FROM debate_votes WHERE debate_id IN (${placeholders}) GROUP BY debate_id, vote`
    ).bind(...debateIds).all();
    for (const v of (votesRows.results ?? [])) {
      if (!votesMap[v.debate_id]) votesMap[v.debate_id] = { you: 0, opponent: 0, draw: 0, total: 0 };
      const cnt = Number(v.count) || 0;
      if (v.vote === "you" || v.vote === "user") votesMap[v.debate_id].you += cnt;
      else if (v.vote === "opponent") votesMap[v.debate_id].opponent += cnt;
      else if (v.vote === "draw") votesMap[v.debate_id].draw += cnt;
      votesMap[v.debate_id].total += cnt;
    }
  }

  const debates = (rows.results ?? []).map(r => {
    let setup = {};
    try { setup = JSON.parse(r.setup_json ?? "{}"); } catch {}
    let personaLabel = PERSONALITY_NAMES[r.personality] ?? r.personality;
    if (r.mode === "historical") {
      const fig = figureById(typeof setup.figureId === "string" ? setup.figureId : "");
      if (fig) personaLabel = fig.name;
    }
    const votes = votesMap[r.id] || { you: 0, opponent: 0, draw: 0, total: 0 };
    let scores = null;
    if (r.scores_json) {
      try { scores = JSON.parse(r.scores_json); } catch {}
    }
    return {
      id: r.id,
      topic: r.topic,
      mode: r.mode,
      personality: r.personality,
      personaLabel,
      endedAt: r.ended_at,
      createdAt: r.created_at,
      views: r.views ?? 0,
      winner: r.winner,
      assessment: r.assessment,
      turningPoint: r.turning_point,
      scores,
      votes
    };
  });

  return c.json({ debates });
});

publicRouter.get("/debate/:id", async (c) => {
  const debateId = c.req.param("id");
  const debate = await c.env.DB.prepare(
    "SELECT * FROM debates WHERE id = ? AND is_public = 1"
  ).bind(debateId).first();

  if (!debate) {
    return c.json({ error: "not_found", message: "This debate is private or does not exist." }, 404);
  }

  c.executionCtx?.waitUntil?.(
    c.env.DB.prepare("UPDATE debates SET views = views + 1 WHERE id = ?").bind(debateId).run()
  );

  const [turnsRes, verdictRes, votesRes, reactionsRes] = await Promise.all([
    c.env.DB.prepare("SELECT id, role, text, created_at FROM turns WHERE debate_id = ? ORDER BY id ASC").bind(debateId).all(),
    c.env.DB.prepare("SELECT * FROM verdicts WHERE debate_id = ?").bind(debateId).first(),
    c.env.DB.prepare("SELECT vote, COUNT(*) as count FROM debate_votes WHERE debate_id = ? GROUP BY vote").bind(debateId).all(),
    c.env.DB.prepare("SELECT reaction, COUNT(*) as count FROM debate_reactions WHERE debate_id = ? GROUP BY reaction").bind(debateId).all()
  ]);

  const voterKey = await getVoterKey(c);
  const userVoteRow = await c.env.DB.prepare(
    "SELECT vote FROM debate_votes WHERE debate_id = ? AND voter_key = ?"
  ).bind(debateId, voterKey).first();

  const userReactionsRows = await c.env.DB.prepare(
    "SELECT reaction FROM debate_reactions WHERE debate_id = ? AND reactor_key = ?"
  ).bind(debateId, voterKey).all();

  const votes = { you: 0, opponent: 0, draw: 0, total: 0 };
  for (const v of (votesRes.results ?? [])) {
    const cnt = Number(v.count) || 0;
    if (v.vote === "you" || v.vote === "user") votes.you += cnt;
    else if (v.vote === "opponent") votes.opponent += cnt;
    else if (v.vote === "draw") votes.draw += cnt;
    votes.total += cnt;
  }

  const reactions = {};
  for (const r of (reactionsRes.results ?? [])) {
    reactions[r.reaction] = Number(r.count) || 0;
  }

  let setup = {};
  try { setup = JSON.parse(debate.setup_json ?? "{}"); } catch {}
  let personaLabel = PERSONALITY_NAMES[debate.personality] ?? debate.personality;
  if (debate.mode === "historical") {
    const fig = figureById(typeof setup.figureId === "string" ? setup.figureId : "");
    if (fig) personaLabel = fig.name;
  }

  let verdict = null;
  if (verdictRes) {
    let scores = {};
    try { scores = JSON.parse(verdictRes.scores_json || "{}"); } catch {}
    verdict = {
      winner: verdictRes.winner,
      assessment: verdictRes.assessment,
      scores,
      you: scores.you || {},
      opponent: scores.opponent || {},
      reasoning: verdictRes.reasoning,
      turningPoint: verdictRes.turning_point,
      createdAt: verdictRes.created_at
    };
  }

  return c.json({
    debate: {
      id: debate.id,
      topic: debate.topic,
      mode: debate.mode,
      personality: debate.personality,
      personaLabel,
      endedAt: debate.ended_at,
      createdAt: debate.created_at,
      views: (debate.views ?? 0) + 1
    },
    turns: turnsRes.results ?? [],
    verdict,
    votes,
    userVote: userVoteRow?.vote ?? null,
    reactions,
    userReactions: (userReactionsRows.results ?? []).map(r => r.reaction)
  });
});

publicRouter.post("/debate/:id/vote", async (c) => {
  const debateId = c.req.param("id");
  const debate = await c.env.DB.prepare(
    "SELECT id FROM debates WHERE id = ? AND is_public = 1"
  ).bind(debateId).first();

  if (!debate) {
    return c.json({ error: "not_found", message: "This debate is not public or does not exist." }, 404);
  }

  const body = await c.req.json().catch(() => ({}));
  const rawVote = String(body.vote ?? "").toLowerCase().trim();
  const vote = rawVote === "user" ? "you" : rawVote;
  if (!["you", "opponent", "draw"].includes(vote)) {
    return c.json({ error: "invalid_vote", message: "Vote must be 'you', 'opponent', or 'draw'." }, 400);
  }

  const voterKey = await getVoterKey(c);
  await c.env.DB.prepare(
    `INSERT INTO debate_votes (debate_id, voter_key, vote, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(debate_id, voter_key) DO UPDATE SET vote = excluded.vote`
  ).bind(debateId, voterKey, vote, nowIso()).run();

  const votesRes = await c.env.DB.prepare(
    "SELECT vote, COUNT(*) as count FROM debate_votes WHERE debate_id = ? GROUP BY vote"
  ).bind(debateId).all();

  const votes = { you: 0, opponent: 0, draw: 0, total: 0 };
  for (const v of (votesRes.results ?? [])) {
    const cnt = Number(v.count) || 0;
    if (v.vote === "you" || v.vote === "user") votes.you += cnt;
    else if (v.vote === "opponent") votes.opponent += cnt;
    else if (v.vote === "draw") votes.draw += cnt;
    votes.total += cnt;
  }

  return c.json({ ok: true, vote, votes });
});

publicRouter.post("/debate/:id/react", async (c) => {
  const debateId = c.req.param("id");
  const debate = await c.env.DB.prepare(
    "SELECT id FROM debates WHERE id = ? AND is_public = 1"
  ).bind(debateId).first();

  if (!debate) {
    return c.json({ error: "not_found", message: "This debate is not public." }, 404);
  }

  const body = await c.req.json().catch(() => ({}));
  const reaction = String(body.reaction ?? "").toLowerCase().trim();
  const validReactions = ["fire", "skull", "brain", "flag", "clap"];
  if (!validReactions.includes(reaction)) {
    return c.json({ error: "invalid_reaction" }, 400);
  }

  const voterKey = await getVoterKey(c);
  const existing = await c.env.DB.prepare(
    "SELECT 1 FROM debate_reactions WHERE debate_id = ? AND reactor_key = ? AND reaction = ?"
  ).bind(debateId, voterKey, reaction).first();

  let active = false;
  if (existing) {
    await c.env.DB.prepare(
      "DELETE FROM debate_reactions WHERE debate_id = ? AND reactor_key = ? AND reaction = ?"
    ).bind(debateId, voterKey, reaction).run();
    active = false;
  } else {
    await c.env.DB.prepare(
      "INSERT INTO debate_reactions (debate_id, reactor_key, reaction, created_at) VALUES (?, ?, ?, ?)"
    ).bind(debateId, voterKey, reaction, nowIso()).run();
    active = true;
  }

  const reactionsRes = await c.env.DB.prepare(
    "SELECT reaction, COUNT(*) as count FROM debate_reactions WHERE debate_id = ? GROUP BY reaction"
  ).bind(debateId).all();

  const reactions = {};
  for (const r of (reactionsRes.results ?? [])) {
    reactions[r.reaction] = Number(r.count) || 0;
  }

  return c.json({ ok: true, reaction, active, reactions });
});

async function handlePublicDebateOg(c) {
  const debateId = String(c.req.param("id") || "");
  // IDs come from newId() (hex). Anything else is not a debate — and must never reach the HTML below.
  if (!/^[0-9a-f]{8,64}$/.test(debateId)) return c.text("Not found", 404);
  const debate = await c.env.DB.prepare(
    "SELECT id, topic, personality, mode, is_public FROM debates WHERE id = ?"
  ).bind(debateId).first();

  const topic = debate ? debate.topic : "AI Sparring Match";
  const persona = debate ? (PERSONALITY_NAMES[debate.personality] ?? debate.personality) : "AdversaryAI";
  const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const title = `${esc(topic)} — Human vs ${esc(persona)} | AdversaryAI Arena`;
  const desc = `Watch this intense real-time AI sparring bout on AdversaryAI. Who made the stronger arguments? See the AI judge's breakdown and cast your vote!`;
  const url = `https://getadversaryai.com/debate/${debateId}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="https://getadversaryai.com/img/og-image.jpg">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="https://getadversaryai.com/img/og-image.jpg">
  <meta http-equiv="refresh" content="0;url=/app/#/watch/${debateId}">
  <script>window.location.replace("/app/#/watch/${debateId}");</script>
</head>
<body style="background:#0a0c10;color:#fff;font-family:system-ui,sans-serif;padding:40px;text-align:center;">
  <h2>Entering AdversaryAI Arena…</h2>
  <p><a href="/app/#/watch/${debateId}" style="color:#e8392e;font-weight:bold;">Click here if not redirected automatically.</a></p>
</body>
</html>`;
  return c.html(html);
}


// worker/src/account.ts
init_config();
var rlReady = false;
async function rateLimit(db, key, max, windowSec) {
  try {
    if (!rlReady) {
      await db.prepare("CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, n INTEGER NOT NULL, reset_at INTEGER NOT NULL)").run();
      rlReady = true;
    }
    const now = Date.now();
    const row = await db.prepare("SELECT n, reset_at FROM rate_limits WHERE key = ?").bind(key).first();
    if (!row || Number(row.reset_at) < now) {
      await db.prepare("INSERT OR REPLACE INTO rate_limits (key, n, reset_at) VALUES (?, 1, ?)").bind(key, now + windowSec * 1e3).run();
      return true;
    }
    if (Number(row.n) >= max) return false;
    await db.prepare("UPDATE rate_limits SET n = n + 1 WHERE key = ?").bind(key).run();
    return true;
  } catch (e) {
    console.error("rate limit", e?.message || e);
    return true; // never lock users out because the limiter itself failed
  }
}
__name(rateLimit, "rateLimit");
function clientIp(c) {
  return c.req.header("cf-connecting-ip") || "0.0.0.0";
}
__name(clientIp, "clientIp");
async function handlePromoRedeem(c) {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.json().catch(() => ({}));
  const code = String(body.code ?? "").trim().toUpperCase();
  if (!code) return c.json({ error: "Promo code is required." }, 400);
  // Codes are short: throttle guessing (10 attempts per user per hour).
  if (!(await rateLimit(c.env.DB, `promo:${user.id}`, 10, 3600))) return c.json({ error: "Too many attempts — try again in an hour." }, 429);

  const db = c.env.DB;
  await ensureLedgerIndexes(db);
  const promo = await db.prepare("SELECT * FROM promo_codes WHERE code = ?").bind(code).first();
  if (!promo) return c.json({ error: "Invalid promo code. Please check the code and try again." }, 404);
  // Lifetime VIP is granted by email from Account → Admin only; a shareable code can leak.
  if (promo.type === "lifetime_vip") return c.json({ error: "This promo code is no longer active." }, 410);

  if (promo.max_redemptions > 0 && promo.times_redeemed >= promo.max_redemptions) {
    return c.json({ error: "This promo code has reached its maximum redemptions." }, 410);
  }

  // Claim first (unique on user+code) so two concurrent requests can't both credit.
  const claim = await db.prepare("INSERT OR IGNORE INTO promo_redemptions (user_id, code, redeemed_at) VALUES (?, ?, ?)").bind(user.id, code, nowIso()).run();
  if (!claim?.meta?.changes) {
    return c.json({ error: "You have already redeemed this promo code on your account." }, 409);
  }

  if (promo.type === "lifetime_vip") {
    const subId = newId();
    await db.prepare(
      `INSERT INTO subscriptions (id, user_id, tier, status, current_period_start, current_period_end)
       VALUES (?, ?, 'champion', 'active', ?, '2099-12-31T23:59:59Z')
       ON CONFLICT(user_id) DO UPDATE SET
         tier = 'champion',
         status = 'active',
         current_period_end = '2099-12-31T23:59:59Z'`
    ).bind(subId, user.id, nowIso()).run();

    const bonusRounds = promo.value > 0 ? promo.value : 100000;
    await db.prepare(
      "INSERT INTO credit_ledger (user_id, delta, reason, created_at) VALUES (?, ?, 'promo_lifetime_vip', ?)"
    ).bind(user.id, bonusRounds, nowIso()).run();

    await db.prepare("UPDATE promo_codes SET times_redeemed = times_redeemed + 1 WHERE code = ?").bind(code).run();

    return c.json({
      ok: true,
      type: "lifetime_vip",
      message: "🎉 Welcome to Lifetime VIP! Your account has been upgraded to Champion Free for Life with 100,000 sparring rounds, DeepSeek-V4-Pro brain, and Ultra Photorealistic 3D personas."
    });
  } else if (promo.type === "rounds") {
    const roundsToAdd = promo.value > 0 ? promo.value : 50;
    await db.prepare(
      "INSERT INTO credit_ledger (user_id, delta, reason, created_at) VALUES (?, ?, 'promo_rounds', ?)"
    ).bind(user.id, roundsToAdd, nowIso()).run();

    await db.prepare("UPDATE promo_codes SET times_redeemed = times_redeemed + 1 WHERE code = ?").bind(code).run();

    return c.json({
      ok: true,
      type: "rounds",
      roundsAdded: roundsToAdd,
      message: `🎉 Success! ${roundsToAdd} bonus sparring rounds have been added to your Round Wallet.`
    });
  }
  return c.json({ error: "Unsupported promo code type." }, 400);
}
__name(handlePromoRedeem, "handlePromoRedeem");

async function handleAdminGrantVip(c) {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  if (!isOwnerEmail(user.email, c.env)) return c.json({ error: "forbidden" }, 403);
  const body = await c.req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return c.json({ error: "Valid email is required." }, 400);

  const db = c.env.DB;
  const targetUser = await db.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").bind(email).first();
  if (!targetUser) {
    return c.json({
      ok: false,
      error: `No user with email "${email}" has signed up yet. Have them create an account first, then grant it again.`
    }, 404);
  }

  const subId = newId();
  await db.prepare(
    `INSERT INTO subscriptions (id, user_id, tier, status, current_period_start, current_period_end)
     VALUES (?, ?, 'champion', 'active', ?, '2099-12-31T23:59:59Z')
     ON CONFLICT(user_id) DO UPDATE SET
       tier = 'champion',
       status = 'active',
       current_period_end = '2099-12-31T23:59:59Z'`
  ).bind(subId, targetUser.id, nowIso()).run();

  await db.prepare(
    "INSERT INTO credit_ledger (user_id, delta, reason, created_at) VALUES (?, 100000, 'admin_grant_lifetime_vip', ?)"
  ).bind(targetUser.id, nowIso()).run();

  await db.prepare(
    "INSERT OR IGNORE INTO promo_redemptions (user_id, code, redeemed_at) VALUES (?, 'ADMIN_GRANT', ?)"
  ).bind(targetUser.id, nowIso()).run();

  return c.json({
    ok: true,
    message: `Successfully granted Lifetime Champion VIP to ${targetUser.email} with 100,000 rounds and ${VIP_VIDEO_MINUTES} photoreal video minutes a month!`
  });
}
__name(handleAdminGrantVip, "handleAdminGrantVip");

var accountRouter = new Hono2();
accountRouter.get("/", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const db = c.env.DB;
  const fullUser = await getUserById(db, user.id);
  const email = fullUser?.email ?? user.email;
  const owner = isOwnerEmail(email, c.env);
  const sub = await getSubscription(db, user.id);
  const month = currentMonth();
  const debatesUsed = await getMonthlyUsage(db, user.id, month);
  let quota = 0;
  if (isSubscriptionActive(sub)) {
    const quotas = await getTierQuotas();
    quota = quotas[sub.tier] ?? 0;
  }
  const adminMode = owner ? (getCookie(c, "adversaryai_admin_mode") || "premium") : null;
  const availability = await checkRoundsAvailable(c, user.id, email);
  const isLifetime = !!(sub && isSubscriptionActive(sub) && (sub.current_period_end || "").startsWith("2099"));
  const redemptions = (await db.prepare("SELECT code, redeemed_at FROM promo_redemptions WHERE user_id = ? ORDER BY redeemed_at DESC").bind(user.id).all())?.results ?? [];

  return c.json({
    email,
    plan: owner ? "owner" : (isLifetime ? "Champion (Lifetime VIP)" : resolvePlan(sub)),
    isOwner: owner,
    isLifetime,
    adminMode,
    subscription: sub ? { tier: sub.tier, status: sub.status, current_period_end: sub.current_period_end, isLifetime } : null,
    usage: { month, debates_used: debatesUsed, quota: owner ? -1 : quota, rounds_used: debatesUsed, rounds_quota: owner ? -1 : quota },
    creditBalance: await creditBalance(db, user.id),
    roundsBalance: await creditBalance(db, user.id),
    totalRoundsRemaining: availability.remaining,
    trialUsed: fullUser?.trial_debates_used ?? 0,
    trialQuota: (await getTierQuotas())["trial"] ?? 15,
    promoRedemptions: redemptions
  });
});
accountRouter.post("/admin-mode", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  if (!isOwnerEmail(user.email, c.env)) return c.json({ error: "forbidden" }, 403);
  const body = await c.req.json().catch(() => ({}));
  const mode = String(body.mode ?? "").toLowerCase() === "regular" ? "regular" : "premium";
  setCookie(c, "adversaryai_admin_mode", mode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "Lax",
    secure: true,
    httpOnly: false
  });
  return c.json({ ok: true, adminMode: mode });
});
accountRouter.post("/promo/redeem", handlePromoRedeem);
accountRouter.post("/admin/grant-vip", handleAdminGrantVip);
accountRouter.get("/admin/promo-list", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  if (!isOwnerEmail(user.email, c.env)) return c.json({ error: "forbidden" }, 403);
  const db = c.env.DB;
  const promos = (await db.prepare("SELECT * FROM promo_codes ORDER BY created_at DESC").all())?.results ?? [];
  const redemptions = (await db.prepare(
    `SELECT r.code, r.redeemed_at, u.email
     FROM promo_redemptions r JOIN users u ON u.id = r.user_id
     ORDER BY r.redeemed_at DESC LIMIT 100`
  ).all())?.results ?? [];
  return c.json({ promos, redemptions });
});
accountRouter.get("/admin/stripe-status", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  if (!isOwnerEmail(user.email, c.env)) return c.json({ error: "forbidden" }, 403);
  const priceIds = await getStripePriceIdsAsync(c.env);
  const hasSecret = Boolean(c.env.STRIPE_SECRET_KEY);
  return c.json({ ok: true, hasSecret, priceIds });
});

accountRouter.get("/admin/azure-status", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  if (!isOwnerEmail(user.email, c.env)) return c.json({ error: "forbidden" }, 403);
  const region = c.env.AZURE_SPEECH_REGION;
  const key = c.env.AZURE_SPEECH_KEY;
  if (!region || !key) {
    return c.json({ ok: false, error: "missing_credentials", hasRegion: Boolean(region), hasKey: Boolean(key) });
  }
  let tokenStatus = null, tokenError = null;
  try {
    const res = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": key, "User-Agent": "AdversaryAI/1.0", "Content-Type": "application/x-www-form-urlencoded" },
      body: ""
    });
    tokenStatus = res.status;
    if (!res.ok) tokenError = await res.text();
  } catch (e) {
    tokenError = e instanceof Error ? e.message : String(e);
  }
  let ttsStatus = null, ttsError = null;
  try {
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-RyanMultilingualNeural">Testing voice.</voice></speak>`;
    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
        "User-Agent": "AdversaryAI/1.0"
      },
      body: ssml
    });
    ttsStatus = res.status;
    if (!res.ok) ttsError = await res.text();
  } catch (e) {
    ttsError = e instanceof Error ? e.message : String(e);
  }
  return c.json({ ok: true, region, keyConfigured: true, tokenStatus, tokenError, ttsStatus, ttsError });
});

accountRouter.post("/admin/setup-stripe", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  if (!isOwnerEmail(user.email, c.env)) return c.json({ error: "forbidden" }, 403);
  const secretKey = c.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return c.json({ error: "STRIPE_SECRET_KEY is not configured in worker environment" }, 400);
  }

  const stripeFetch = async (method, path, bodyParams = null) => {
    const headers = {
      Authorization: `Basic ${btoa(`${secretKey}:`)}`,
      "Content-Type": "application/x-www-form-urlencoded"
    };
    let body = undefined;
    if (bodyParams && method !== "GET") {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(bodyParams)) {
        if (v !== undefined && v !== null) params.append(k, String(v));
      }
      body = params.toString();
    }
    const res = await fetch(`https://api.stripe.com/v1${path}`, { method, headers, body });
    const data = await res.json();
    if (!res.ok) throw new Error(`Stripe ${method} ${path} failed (${res.status}): ${JSON.stringify(data)}`);
    return data;
  };

  const ITEMS = [
    { key: "debater", name: "AdversaryAI Debater", description: "300 sparring rounds per month across all 11 practice modes", type: "recurring", amount: 1200, interval: "month" },
    { key: "coach", name: "AdversaryAI Coach", description: "1,000 sparring rounds per month plus coaching analytics and rubrics", type: "recurring", amount: 2900, interval: "month" },
    { key: "champion", name: "AdversaryAI Champion", description: "1,000 sparring rounds per month with DeepSeek-V4-Pro & photorealistic 3D personas", type: "recurring", amount: 4900, interval: "month" },
    { key: "pack10", name: "100 Sparring Rounds Pack", description: "100 round one-time credit top-up. Credits never expire.", type: "one_time", amount: 900 },
    { key: "pack25", name: "250 Sparring Rounds Pack", description: "250 round one-time credit top-up. Credits never expire.", type: "one_time", amount: 1900 },
    { key: "pack60", name: "600 Sparring Rounds Pack", description: "600 round one-time credit top-up. Credits never expire.", type: "one_time", amount: 3900 },
    { key: "eduSeat", name: "AdversaryAI Education Seat", description: "1 seat license with 300 pooled rounds per month for classrooms & teams", type: "recurring", amount: 600, interval: "month" }
  ];

  try {
    const existingProducts = (await stripeFetch("GET", "/products?limit=100")).data || [];
    const existingPrices = (await stripeFetch("GET", "/prices?limit=100&active=true")).data || [];
    const priceResults = {};

    for (const item of ITEMS) {
      let product = existingProducts.find(
        p => (p.metadata && p.metadata.adversaryai_key === item.key) || p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
      );
      if (!product) {
        product = await stripeFetch("POST", "/products", {
          name: item.name,
          description: item.description,
          "metadata[adversaryai_key]": item.key
        });
      }
      let price = existingPrices.find(p => {
        const matchProduct = p.product === product.id;
        const matchAmount = p.unit_amount === item.amount;
        const matchCurrency = p.currency === "usd";
        const matchType = item.type === "recurring" ? (p.type === "recurring" && p.recurring?.interval === item.interval) : p.type === "one_time";
        return matchProduct && matchAmount && matchCurrency && matchType;
      });
      if (!price) {
        const priceParams = {
          product: product.id,
          unit_amount: item.amount,
          currency: "usd",
          "metadata[adversaryai_key]": item.key
        };
        if (item.type === "recurring") priceParams["recurring[interval]"] = item.interval;
        price = await stripeFetch("POST", "/prices", priceParams);
      }
      priceResults[item.key] = price.id;
    }

    if (c.env.DB) {
      const now = Date.now();
      for (const [k, pId] of Object.entries(priceResults)) {
        await c.env.DB.prepare(
          "INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES (?, ?, ?)"
        ).bind(`stripe_price_${k}`, pId, now).run();
      }
    }

    return c.json({ ok: true, message: "All 7 Stripe products and prices created and linked successfully!", prices: priceResults });
  } catch (err) {
    console.error("Setup stripe error:", err);
    return c.json({ error: err.message || "Failed to setup stripe" }, 500);
  }
});

// worker/src/webhooks.ts
init_config();
var webhookRouter = new Hono2();
var SIGNATURE_TOLERANCE_SECONDS = 300;
function toHex(buf) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(toHex, "toHex");
function timingSafeEqual2(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
__name(timingSafeEqual2, "timingSafeEqual");
async function verifyStripeSignature(payload, header, secret) {
  if (!header || !secret) return false;
  let timestamp = null;
  const signatures = [];
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key2 = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key2 === "t") timestamp = value;
    else if (key2 === "v1" && value) signatures.push(value);
  }
  if (!timestamp || signatures.length === 0) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() / 1e3 - ts) > SIGNATURE_TOLERANCE_SECONDS) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`)
  );
  const expectedHex = toHex(mac);
  return signatures.some((sig) => timingSafeEqual2(sig, expectedHex));
}
__name(verifyStripeSignature, "verifyStripeSignature");
function tierFromPriceId(priceIds, priceId) {
  if (priceIds.debater && priceId === priceIds.debater) return "debater";
  if (priceIds.coach && priceId === priceIds.coach) return "coach";
  if (priceIds.champion && priceId === priceIds.champion) return "champion";
  return null;
}
__name(tierFromPriceId, "tierFromPriceId");
async function handleCheckoutSessionCompleted(env, session) {
  const db = env.DB;
  const metadata = session.metadata ?? {};
  const kind = metadata.kind;
  if (kind === "pack") {
    const userId = metadata.userId;
    const debates = parseInt(metadata.debates ?? "0", 10);
    const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
    if (!userId || !Number.isFinite(debates) || debates <= 0 || !paymentIntent) return;
    await ensureLedgerIndexes(db);
    // Stripe can deliver the same event twice, concurrently: the unique index makes this exactly-once.
    await db.prepare(
      "INSERT OR IGNORE INTO credit_ledger (user_id, delta, reason, stripe_payment_id, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(userId, debates, "pack_purchase", paymentIntent, nowIso()).run();
    return;
  }
  if (kind === "org_subscription") {
    const orgId = metadata.orgId;
    const seats = parseInt(metadata.seats ?? "0", 10);
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
    if (!orgId || !Number.isFinite(seats) || seats <= 0 || !subscriptionId) return;
    const existing = await db.prepare("SELECT 1 FROM orgs WHERE stripe_subscription_id = ?").bind(subscriptionId).first();
    if (existing) return;
    await db.prepare(
      `UPDATE orgs SET stripe_customer_id = ?, stripe_subscription_id = ?,
           seat_count = ?, status = 'active' WHERE id = ?`
    ).bind(customerId, subscriptionId, seats, orgId).run();
    return;
  }
  if (kind === "subscription") {
    const userId = metadata.userId;
    const item = metadata.item;
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
    if (!userId || item !== "debater" && item !== "coach" && item !== "champion" || !subscriptionId) return;
    const existing = await db.prepare("SELECT 1 FROM subscriptions WHERE stripe_subscription_id = ?").bind(subscriptionId).first();
    if (existing) return;
    await db.prepare(
      `INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, tier, status)
         VALUES (?, ?, ?, ?, 'active')
         ON CONFLICT(user_id) DO UPDATE SET
           stripe_customer_id = excluded.stripe_customer_id,
           stripe_subscription_id = excluded.stripe_subscription_id,
           tier = excluded.tier,
           status = excluded.status`
    ).bind(userId, customerId, subscriptionId, item).run();
  }
}
__name(handleCheckoutSessionCompleted, "handleCheckoutSessionCompleted");
async function handleSubscriptionUpdated(env, sub) {
  const priceId = sub.items?.data?.[0]?.price?.id;
  const priceIds = await getStripePriceIdsAsync(env);
  const tier = priceId ? tierFromPriceId(priceIds, priceId) : null;
  await env.DB.prepare(
    `UPDATE subscriptions
     SET status = ?,
         tier = COALESCE(?, tier),
         current_period_start = ?,
         current_period_end = ?
     WHERE stripe_subscription_id = ?`
  ).bind(
    sub.status ?? null,
    tier,
    sub.current_period_start ?? null,
    sub.current_period_end ?? null,
    sub.id
  ).run();
  const eduPriceId = priceIds.eduSeat;
  if (eduPriceId && priceId === eduPriceId) {
    const quantity = Number(sub.items?.data?.[0]?.quantity ?? sub.quantity ?? NaN);
    await env.DB.prepare(
      `UPDATE orgs
       SET status = ?,
           seat_count = CASE WHEN ? > 0 THEN ? ELSE seat_count END,
           current_period_end = ?
       WHERE stripe_subscription_id = ?`
    ).bind(
      sub.status ?? null,
      Number.isFinite(quantity) ? quantity : 0,
      Number.isFinite(quantity) ? quantity : 0,
      sub.current_period_end ?? null,
      sub.id
    ).run();
  }
}
__name(handleSubscriptionUpdated, "handleSubscriptionUpdated");
async function handleSubscriptionDeleted(env, sub) {
  await env.DB.prepare(
    `UPDATE subscriptions SET status = 'canceled', tier = 'none'
     WHERE stripe_subscription_id = ?`
  ).bind(sub.id).run();
  await env.DB.prepare(
    `UPDATE orgs SET status = 'canceled', seat_count = 0
     WHERE stripe_subscription_id = ?`
  ).bind(sub.id).run();
}
__name(handleSubscriptionDeleted, "handleSubscriptionDeleted");
async function handleInvoicePaymentFailed(env, invoice) {
  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id ?? null;
  if (!subscriptionId) return;
  await env.DB.prepare(
    `UPDATE subscriptions SET status = 'past_due' WHERE stripe_subscription_id = ?`
  ).bind(subscriptionId).run();
  await env.DB.prepare(
    `UPDATE orgs SET status = 'past_due' WHERE stripe_subscription_id = ?`
  ).bind(subscriptionId).run();
}
__name(handleInvoicePaymentFailed, "handleInvoicePaymentFailed");
var ledgerIndexesReady = false;
async function ensureLedgerIndexes(db) {
  if (ledgerIndexesReady) return;
  try {
    await db.batch([
      db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_payment ON credit_ledger(stripe_payment_id) WHERE stripe_payment_id IS NOT NULL"),
      db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_once ON promo_redemptions(user_id, code)")
    ]);
    ledgerIndexesReady = true;
  } catch (e) {
    console.error("ledger index", e?.message || e);
  }
}
__name(ensureLedgerIndexes, "ensureLedgerIndexes");
// A refunded or disputed pack takes its rounds back (once), keyed by the payment intent.
async function handleChargeRefunded(env, charge) {
  const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id ?? null;
  if (!pi) return;
  const row = await env.DB.prepare("SELECT user_id, delta FROM credit_ledger WHERE stripe_payment_id = ? AND delta > 0").bind(pi).first();
  if (!row) return;
  await ensureLedgerIndexes(env.DB);
  await env.DB.prepare(
    "INSERT OR IGNORE INTO credit_ledger (user_id, delta, reason, stripe_payment_id, created_at) VALUES (?, ?, 'refund', ?, ?)"
  ).bind(row.user_id, -Number(row.delta), `${pi}:refund`, nowIso()).run();
}
__name(handleChargeRefunded, "handleChargeRefunded");
async function handleEvent(env, event) {
  const data = event.data?.object ?? {};
  switch (event.type) {
    case "charge.refunded":
    case "charge.dispute.created":
      await handleChargeRefunded(env, data.object === "dispute" ? { payment_intent: data.payment_intent } : data);
      break;
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(env, data);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(env, data);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(env, data);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(env, data);
      break;
    default:
      break;
  }
}
__name(handleEvent, "handleEvent");
webhookRouter.post("/api/webhooks/stripe", async (c) => {
  const payload = await c.req.text();
  let verified = false;
  try {
    verified = await verifyStripeSignature(
      payload,
      c.req.header("stripe-signature"),
      c.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("webhook signature verification error", err);
  }
  if (!verified) return c.json({ error: "invalid signature" }, 400);
  let event;
  try {
    event = JSON.parse(payload);
  } catch {
    return c.json({ error: "invalid json" }, 400);
  }
  try {
    await handleEvent(c.env, event);
  } catch (err) {
    // Return 500 so Stripe retries: a transient D1 failure must not silently eat a purchase.
    console.error("webhook handler error", event.type, err);
    return c.json({ error: "handler_failed" }, 500);
  }
  return c.json({ received: true });
});

// worker/src/speech.ts
var speechRouter = new Hono2();
speechRouter.get("/diag", async (c) => {
  const user = await getSessionUser(c);
  if (!user || !isOwnerEmail(user.email, c.env)) return c.json({ error: "forbidden" }, 403);
  const region = c.env.AZURE_SPEECH_REGION;
  const key = c.env.AZURE_SPEECH_KEY;
  if (!region || !key) {
    return c.json({ ok: false, error: "missing_credentials", region: !!region, key: !!key });
  }
  let tokenStatus = null, tokenError = null;
  try {
    const res = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": key, "User-Agent": "AdversaryAI/1.0", "Content-Type": "application/x-www-form-urlencoded" },
      body: ""
    });
    tokenStatus = res.status;
    if (!res.ok) tokenError = await res.text();
  } catch (e) {
    tokenError = e instanceof Error ? e.message : String(e);
  }
  let ttsStatus = null, ttsError = null;
  try {
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-RyanMultilingualNeural">Testing voice.</voice></speak>`;
    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
        "User-Agent": "AdversaryAI/1.0"
      },
      body: ssml
    });
    ttsStatus = res.status;
    if (!res.ok) ttsError = await res.text();
  } catch (e) {
    ttsError = e instanceof Error ? e.message : String(e);
  }
  return c.json({ ok: true, region, keyConfigured: true, tokenStatus, tokenError, ttsStatus, ttsError });
});
// Server-side speech for the latest opponent turn. Used only when the browser can't
// synthesize itself (SDK blocked/unavailable) or failed mid-reply; `offset`/`anchor`
// let the client request just the part it hasn't played yet, so nothing is heard twice.
// Capped at 3 syntheses per turn so it can't be used as a free TTS API.
speechRouter.post("/turn-audio", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.json().catch(() => ({}));
  const debateId = String(body.debateId ?? "");
  const debate = await getOwnedDebate(c, debateId, user.id);
  if (!debate) return c.json({ error: "debate_not_found" }, 404);
  const turn = await c.env.DB.prepare("SELECT id, text FROM turns WHERE debate_id = ? AND role = 'assistant' ORDER BY id DESC LIMIT 1").bind(debateId).first();
  if (!turn?.text) return c.json({ error: "no_turn" }, 404);
  try {
    await c.env.DB.prepare("CREATE TABLE IF NOT EXISTS tts_usage (turn_id INTEGER PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0)").run();
    const slot = await c.env.DB.prepare(
      "INSERT INTO tts_usage (turn_id, n) VALUES (?, 1) ON CONFLICT(turn_id) DO UPDATE SET n = n + 1 WHERE n < 3 RETURNING n"
    ).bind(turn.id).first();
    if (!slot) return c.json({ error: "tts_limit" }, 429);
  } catch (err) {
    console.error("tts_usage", err instanceof Error ? err.message : err);
    return c.json({ error: "tts_unavailable" }, 503);
  }
  let text = String(turn.text);
  const anchor = String(body.anchor ?? "").trim();
  let offset = Math.max(0, Math.min(text.length, Math.floor(Number(body.offset) || 0)));
  if (anchor) {
    // Search near the client's offset so a repeated phrase (e.g. a rap hook) can't send
    // us back to audio the user already heard.
    const at = text.indexOf(anchor.slice(0, 40), Math.max(0, offset - 80));
    if (at >= 0) offset = at;
  }
  text = text.slice(offset).trim();
  if (!text) return c.body(null, 204);
  const setup = parseSetup(debate.setup_json);
  const figureId = debate.mode === "historical" ? figureById(setup.figureId)?.id : void 0;
  try {
    const tts = await ttsDebateLine(c.env, text, debate.personality, figureId, setup.personaVisual);
    if (!tts.audioBase64) return c.json({ error: "tts_unavailable" }, 503);
    const bin = Uint8Array.from(atob(tts.audioBase64), (ch) => ch.charCodeAt(0));
    return new Response(bin, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=600" } });
  } catch (err) {
    console.error("turn-audio failed", err instanceof Error ? err.message : err);
    return c.json({ error: "tts_failed" }, 502);
  }
});
speechRouter.post("/token", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  // Speech tokens can synthesize anything for 10 minutes, so only hand them to users who
  // can actually spar right now, and cap how often they can be minted.
  const avail = await checkRoundsAvailable(c, user.id, user.email);
  if (!avail.ok) return c.json({ error: "quota_exhausted" }, 402);
  if (!isOwnerEmail(user.email, c.env)) {
    try {
      await c.env.DB.prepare("CREATE TABLE IF NOT EXISTS speech_token_mints (user_id TEXT NOT NULL, minted_at TEXT NOT NULL)").run();
      const since = new Date(Date.now() - 60 * 60 * 1e3).toISOString();
      const row = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM speech_token_mints WHERE user_id = ? AND minted_at > ?").bind(user.id, since).first();
      if (Number(row?.n ?? 0) >= 15) return c.json({ error: "rate_limited" }, 429);
      await c.env.DB.prepare("INSERT INTO speech_token_mints (user_id, minted_at) VALUES (?, ?)").bind(user.id, nowIso()).run();
      if (Math.random() < 0.02) await c.env.DB.prepare("DELETE FROM speech_token_mints WHERE minted_at < ?").bind(new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString()).run();
    } catch (err) {
      console.error("speech token rate limit", err instanceof Error ? err.message : err);
    }
  }
  const wantHd = c.req.query("hd") === "1" && hdSpeechConfigured(c.env) && await isPremium(c, user.id, user.email);
  const region = wantHd ? c.env.AZURE_SPEECH_HD_REGION : c.env.AZURE_SPEECH_REGION;
  const key = wantHd ? hdSpeechKey(c.env) : c.env.AZURE_SPEECH_KEY;
  if (!region || !key) {
    return c.json({ error: "speech_not_configured" }, 503);
  }
  const url = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      // Never log this header value.
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "AdversaryAI/1.0"
    },
    body: ""
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("Speech token mint failed:", res.status, body.slice(0, 200));
    return c.json({ error: "token_failed" }, 502);
  }
  const token = (await res.text()).trim();
  if (!token) return c.json({ error: "token_failed" }, 502);
  return c.json({ token, region, expiresIn: 600 });
});

// worker/src/avatar.ts — Champion photoreal avatars (HeyGen LiveAvatar, LITE mode).
// We keep our own LLM + Azure TTS; LiveAvatar only renders lip-synced video from the
// PCM audio the browser sends it. Minutes are metered here so a Champion plan can't
// run up an unbounded video bill.
var avatarRouter = new Hono2();
var AVATAR_VISUAL_KEYS = ["man-pro", "woman-pro", "older-man", "older-woman", "man-casual", "woman-casual", "teen-boy", "teen-girl", "default-masc", "default-fem"];
// Each persona "look" and what kind of LiveAvatar actor should play it.
// Azure HD ("DragonHD") voices: far more natural, used for Champion photoreal opponents when an
// HD-capable Speech resource is configured (AZURE_SPEECH_HD_REGION + AZURE_SPEECH_HD_KEY).
// HD voices have no viseme events, which the photoreal avatar doesn't need (it lip-syncs from audio).
var HD_VOICE_MAP = {
  "en-US-DavisNeural": "en-US-Davis:DragonHDLatestNeural",
  "en-US-BrianNeural": "en-US-Brian:DragonHDLatestNeural",
  "en-US-RogerNeural": "en-US-Adam:DragonHDLatestNeural",
  "en-US-JasonNeural": "en-US-Steffan:DragonHDLatestNeural",
  "en-US-GuyNeural": "en-US-Andrew2:DragonHDLatestNeural",
  "en-US-ChristopherNeural": "en-US-Andrew:DragonHDLatestNeural",
  "en-US-TonyNeural": "en-US-Steffan:DragonHDLatestNeural",
  "en-US-AndrewNeural": "en-US-Andrew:DragonHDLatestNeural",
  "en-US-AndrewMultilingualNeural": "en-US-Andrew:DragonHDLatestNeural",
  "en-US-RyanMultilingualNeural": "en-US-Adam:DragonHDLatestNeural",
  "en-US-AvaNeural": "en-US-Ava:DragonHDLatestNeural",
  "en-US-JennyNeural": "en-US-Jenny:DragonHDLatestNeural",
  "en-US-SaraNeural": "en-US-Emma2:DragonHDLatestNeural",
  "en-US-AriaNeural": "en-US-Aria:DragonHDLatestNeural"
};
function hdSpeechKey(env) {
  return env.AZURE_SPEECH_HD_KEY || null;
}
__name(hdSpeechKey, "hdSpeechKey");
function hdSpeechConfigured(env) {
  return !!(env.AZURE_SPEECH_HD_REGION && hdSpeechKey(env));
}
__name(hdSpeechConfigured, "hdSpeechConfigured");
var AVATAR_VISUAL_PROFILE = {
  "man-pro": { g: "m", want: /(business|suit|lawyer|attorney|professional|office|formal|executive|ceo|consult|manager|corporate|blazer|interview)/ },
  "woman-pro": { g: "f", want: /(business|suit|lawyer|attorney|professional|office|formal|executive|ceo|consult|manager|corporate|blazer|interview)/ },
  "older-man": { g: "m", want: /(senior|elder|older|old|grand|retired|mature)/ },
  "older-woman": { g: "f", want: /(senior|elder|older|old|grand|retired|mature)/ },
  "man-casual": { g: "m", want: /(casual|home|sofa|couch|outdoor|hoodie|sweater|relax|street)/ },
  "woman-casual": { g: "f", want: /(casual|home|sofa|couch|outdoor|hoodie|sweater|relax|street)/ },
  "teen-boy": { g: "m", want: /(young|youth|teen|student|college|kid)/ },
  "teen-girl": { g: "f", want: /(young|youth|teen|student|college|kid)/ },
  "default-masc": { g: "m", want: null },
  "default-fem": { g: "f", want: null }
};
var FEMALE_NAMES = new Set("anna ann anne amy amelia alice alexa alexandra aria ava bella brenda carla carol caroline chloe claire dana daisy diana elena elenora eleanor elizabeth ella ellie emily emma eva fiona grace hannah helen isabella jane jennifer jenny jessica jill joan judy julia june karen kate katya kayla kelly kim kristin laura lea leah lily linda lisa lucy maria marie mary maya mia monica nancy natalie nina olivia paige rachel rebecca rika rose ruby sara sarah shelby sofia sophia susan tina valeria vanessa victoria wendy zoe".split(" "));
var MALE_NAMES = new Set("aaron adam alex alan andrew anthony ben benjamin bill brian bryan carl charles chris daniel dave david dexter eddie edward eric ethan frank gary george graham greg harry henry jack jacob james jason jeff joe john jonathan josh justin kevin leo liam lucas marcus mark matt max michael mike nathan nick noah oliver owen patrick paul pedro peter richard rick robert ryan sam santa scott sean shawn silas simon steve steven thomas tim tom tony tyler victor wayne william".split(" "));
function avatarGender(a) {
  const g = String(a.gender || "").toLowerCase();
  if (/^(f|female|woman|women|girl)$/.test(g)) return "f";
  if (/^(m|male|man|men|boy)$/.test(g)) return "m";
  const text = ` ${String(a.text || a.name || "").toLowerCase()} `;
  if (/\b(female|woman|women|girl|lady|she|her)\b/.test(text)) return "f";
  if (/\b(male|man|men|boy|guy|gentleman|he|his)\b/.test(text)) return "m";
  const first = String(a.name || "").toLowerCase().split(/[^a-z]+/).find(Boolean) || "";
  if (FEMALE_NAMES.has(first)) return "f";
  if (MALE_NAMES.has(first)) return "m";
  return null;
}
// LiveAvatar catalog (the owner's own avatars + public stock actors), cached for 12h.
async function fetchAvatarCatalog(env, db, { fresh = false } = {}) {
  if (!fresh) {
    try {
      const row = await db.prepare("SELECT value FROM app_config WHERE key = 'liveavatar_catalog'").first();
      const cached = row?.value ? JSON.parse(row.value) : null;
      if (cached?.at && Date.now() - cached.at < 12 * 3600e3 && Array.isArray(cached.avatars) && cached.avatars.length) return cached.avatars;
    } catch {
    }
  }
  const pick = (a, own) => {
    const tags = Array.isArray(a.tags) ? a.tags.join(" ") : String(a.tags ?? "");
    return {
      id: a.id ?? a.avatar_id,
      name: a.name ?? a.avatar_name ?? a.id,
      image: a.preview_url ?? a.image_url ?? a.thumbnail_url ?? a.preview_image_url ?? null,
      gender: a.gender ?? null,
      text: [a.name, a.avatar_name, a.description, tags, a.category, a.style].filter(Boolean).join(" ").slice(0, 400),
      own
    };
  };
  const out = [];
  for (const [path, own] of [["/v1/avatars?page_size=100", true], ["/v1/avatars/public?page_size=100", false]]) {
    const r = await liveAvatarFetch(env, path);
    const d = r.data?.data;
    const list = Array.isArray(d) ? d : d?.results ?? d?.items ?? d?.data ?? [];
    for (const a of list) out.push(pick(a, own));
  }
  const avatars = out.filter((a) => a.id);
  if (avatars.length) {
    await db.prepare("INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES ('liveavatar_catalog', ?, ?)").bind(JSON.stringify({ at: Date.now(), avatars }), nowIso()).run().catch(() => {
    });
  }
  return avatars;
}
__name(fetchAvatarCatalog, "fetchAvatarCatalog");
// Actors dressed for a specific job read wrong as a debate opponent (a "prosecutor" in a lab coat).
var AVATAR_AUTO_V = "3";
var AVATAR_COSTUME = /(doctor|dr\.|nurse|medical|clinic|hospital|physician|dentist|scrubs|lab coat|chef|cook|santa|christmas|pilot|police|officer|soldier|military|firefight|mechanic|construction|worker|fitness|yoga|trainer|gym|sport|wizard|costume|halloween|customer ?support|call ?center|headset|receptionist|barista|waiter)/;
// Pick a gender-matched, look-appropriate stock actor for each persona look, keeping them distinct.
function autoAssignAvatars(catalog, map, keys) {
  const pool = catalog.filter((a) => !a.own).length >= 2 ? catalog.filter((a) => !a.own) : catalog;
  const withG = pool.map((a, i) => ({ ...a, g: avatarGender(a), i, low: String(a.text || a.name || "").toLowerCase() }));
  const used = new Set(Object.values(map));
  const out = { ...map };
  for (const key of keys) {
    const prof = AVATAR_VISUAL_PROFILE[key];
    if (!prof) continue;
    const gendered = withG.filter((a) => a.g === prof.g);
    const cands = gendered.length ? gendered : withG.filter((a) => a.g == null);
    if (!cands.length) continue;
    const score = (a) => (prof.want && prof.want.test(a.low) ? 10 : 0) + (AVATAR_COSTUME.test(a.low) ? -30 : 0) + (used.has(a.id) ? -20 : 0) - a.i / 1e3;
    const best = cands.slice().sort((x, y) => score(y) - score(x))[0];
    out[key] = best.id;
    used.add(best.id);
  }
  return out;
}
__name(autoAssignAvatars, "autoAssignAvatars");
// The map every session uses. Persona looks with no avatar get one automatically (so Champion
// works with zero setup); "none" means the owner explicitly wants that look to stay 3D.
// Historical figures are never auto-assigned — only an explicit owner pick.
async function resolveAvatarMap(env, db) {
  const map = await getAvatarMap(db);
  if (!env.LIVEAVATAR_API_KEY) return map;
  let autoV = null;
  try {
    autoV = (await db.prepare("SELECT value FROM app_config WHERE key = 'liveavatar_auto_v'").first())?.value ?? null;
  } catch {
  }
  // When the casting rules change (AVATAR_AUTO_V bump), re-cast every persona look once.
  const keys = autoV === AVATAR_AUTO_V ? AVATAR_VISUAL_KEYS.filter((k) => !map[k]) : AVATAR_VISUAL_KEYS;
  if (!keys.length) return map;
  let catalog = [];
  try {
    catalog = await fetchAvatarCatalog(env, db);
  } catch (e) {
    console.error("avatar catalog failed", e?.message || e);
  }
  if (!catalog.length) return map;
  // Only persona looks live in the map (historical figures never get an actor).
  const next = autoAssignAvatars(catalog, autoV === AVATAR_AUTO_V ? Object.fromEntries(Object.entries(map).filter(([k]) => AVATAR_VISUAL_KEYS.includes(k))) : {}, keys);
  await db.batch([
    db.prepare("INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES ('liveavatar_map', ?, ?)").bind(JSON.stringify(next), nowIso()),
    db.prepare("INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES ('liveavatar_auto_v', ?, ?)").bind(AVATAR_AUTO_V, nowIso())
  ]).catch((e) => console.error("avatar map save failed", e?.message || e));
  return next;
}
__name(resolveAvatarMap, "resolveAvatarMap");
function avatarIdFor(map, key) {
  const v = map[key];
  return v && v !== "none" ? v : null;
}
__name(avatarIdFor, "avatarIdFor");
var avatarTablesReady = false;
async function ensureAvatarTables(db) {
  if (avatarTablesReady) return;
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS avatar_usage (user_id TEXT NOT NULL, month TEXT NOT NULL, seconds INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (user_id, month))"),
    db.prepare("CREATE TABLE IF NOT EXISTS avatar_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, debate_id TEXT, started_at TEXT NOT NULL, last_beat_at TEXT NOT NULL, ended_at TEXT, max_seconds INTEGER)")
  ]);
  try {
    await db.prepare("ALTER TABLE avatar_sessions ADD COLUMN max_seconds INTEGER").run();
  } catch {
  }
  avatarTablesReady = true;
}
__name(ensureAvatarTables, "ensureAvatarTables");
function avatarApiUrl(env) {
  return (env.LIVEAVATAR_API_URL || "https://api.liveavatar.com").replace(/\/+$/, "");
}
__name(avatarApiUrl, "avatarApiUrl");
function videoMinutesCap(env) {
  const n = Number(env.CHAMPION_VIDEO_MINUTES ?? 150);
  return Number.isFinite(n) && n > 0 ? n : 150;
}
__name(videoMinutesCap, "videoMinutesCap");
// Complimentary (lifetime VIP) Champions get a small monthly photoreal allowance: video is billed
// per minute, and they don't pay for it. VIP rows are Champion with no Stripe subscription.
var VIP_VIDEO_MINUTES = 10;
async function isCompedChampion(db, userId) {
  const row = await db.prepare("SELECT stripe_subscription_id, current_period_end FROM subscriptions WHERE user_id = ? AND tier = 'champion'").bind(userId).first();
  return !!row && !row.stripe_subscription_id && String(row.current_period_end ?? "").startsWith("2099");
}
__name(isCompedChampion, "isCompedChampion");
async function getAvatarMap(db) {
  try {
    const row = await db.prepare("SELECT value FROM app_config WHERE key = 'liveavatar_map'").first();
    const m = row?.value ? JSON.parse(row.value) : {};
    return m && typeof m === "object" ? m : {};
  } catch {
    return {};
  }
}
__name(getAvatarMap, "getAvatarMap");
async function avatarSecondsUsed(db, userId) {
  await ensureAvatarTables(db);
  const row = await db.prepare("SELECT seconds FROM avatar_usage WHERE user_id = ? AND month = ?").bind(userId, currentMonth()).first();
  return Number(row?.seconds ?? 0);
}
__name(avatarSecondsUsed, "avatarSecondsUsed");
// When LiveAvatar reports the account is out of credits, pause photoreal for everyone for a
// while (straight to 3D, no connect-then-fail) instead of failing every Champion session.
var OUT_OF_CREDITS_MS = 15 * 60 * 1e3;
async function avatarOutOfCredits(db) {
  try {
    const row = await db.prepare("SELECT value FROM app_config WHERE key = 'liveavatar_out_until'").first();
    return Number(row?.value ?? 0) > Date.now();
  } catch {
    return false;
  }
}
__name(avatarOutOfCredits, "avatarOutOfCredits");
async function markAvatarOutOfCredits(db) {
  await db.prepare("INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES ('liveavatar_out_until', ?, ?)").bind(String(Date.now() + OUT_OF_CREDITS_MS), nowIso()).run().catch(() => {
  });
}
__name(markAvatarOutOfCredits, "markAvatarOutOfCredits");
var isCreditError = (x) => /credit|insufficient|balance|quota|payment/i.test(typeof x === "string" ? x : JSON.stringify(x ?? ""));
async function avatarStatus(c, user) {
  const outOfCredits = !!c.env.LIVEAVATAR_API_KEY && await avatarOutOfCredits(c.env.DB);
  const enabled = !!c.env.LIVEAVATAR_API_KEY && !outOfCredits;
  const eligible = await isPremium(c, user.id, user.email);
  const owner = isOwnerEmail(user.email, c.env);
  const capMinutes = await isCompedChampion(c.env.DB, user.id) ? VIP_VIDEO_MINUTES : videoMinutesCap(c.env);
  const capSeconds = owner ? 24 * 3600 : capMinutes * 60;
  const used = enabled && eligible ? await avatarSecondsUsed(c.env.DB, user.id) : 0;
  return { enabled, outOfCredits, eligible, owner, capSeconds, usedSeconds: used, remainingSeconds: Math.max(0, capSeconds - used) };
}
__name(avatarStatus, "avatarStatus");
function avatarKeyForDebate(debate) {
  // Historical figures never get a video actor: a stock actor isn't them, and the video
  // provider's policy forbids real-person likenesses without consent. They keep their portraits.
  if (debate.mode === "historical") return "";
  const setup = parseSetup(debate.setup_json);
  return AVATAR_VISUAL_KEYS.includes(setup.personaVisual) ? setup.personaVisual : "";
}
__name(avatarKeyForDebate, "avatarKeyForDebate");
async function liveAvatarFetch(env, path, init = {}) {
  const res = await fetch(`${avatarApiUrl(env)}${path}`, {
    ...init,
    headers: { "X-API-KEY": env.LIVEAVATAR_API_KEY, "Content-Type": "application/json", accept: "application/json", ...init.headers ?? {} }
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
  }
  return { ok: res.ok, status: res.status, data };
}
__name(liveAvatarFetch, "liveAvatarFetch");
avatarRouter.get("/status", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const st = await avatarStatus(c, user);
  let mapped = null;
  let avatarImage = null;
  const debateId = c.req.query("debateId");
  if (debateId && st.enabled && st.eligible) {
    const debate = await getOwnedDebate(c, debateId, user.id);
    if (debate) {
      const map = await resolveAvatarMap(c.env, c.env.DB);
      const id = avatarIdFor(map, avatarKeyForDebate(debate));
      mapped = !!id;
      if (id) {
        // Still of the actor, shown while the live video connects (instead of the 3D model).
        const cat = await fetchAvatarCatalog(c.env, c.env.DB).catch(() => []);
        avatarImage = cat.find((a) => a.id === id)?.image || null;
      }
    }
  }
  return c.json({ ...st, capMinutes: Math.round(st.capSeconds / 60), remainingMinutes: Math.floor(st.remainingSeconds / 60), mapped, avatarImage });
});
avatarRouter.post("/session", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const st = await avatarStatus(c, user);
  if (st.outOfCredits) return c.json({ error: "photoreal_out_of_credits", ...(st.owner ? { detail: "LiveAvatar account is out of credits — add credits at liveavatar.com (video resumes automatically)." } : {}) }, 402);
  if (!st.enabled) return c.json({ error: "photoreal_not_configured" }, 503);
  if (!st.eligible) return c.json({ error: "champion_required" }, 402);
  if (st.remainingSeconds < 30) return c.json({ error: "video_minutes_exhausted" }, 402);
  const body = await c.req.json().catch(() => ({}));
  const debate = await getOwnedDebate(c, String(body.debateId ?? ""), user.id);
  if (!debate) return c.json({ error: "debate_not_found" }, 404);
  if (debate.ended_at) return c.json({ error: "debate_ended" }, 400);
  const map = await resolveAvatarMap(c.env, c.env.DB);
  const avatarId = avatarIdFor(map, avatarKeyForDebate(debate));
  if (!avatarId) return c.json({ error: "no_avatar_for_persona" }, 404);
  // LiveAvatar caps session length per plan and rejects anything longer with a 400.
  // Start at 20 min (or the user's remaining minutes) and step down until it's accepted;
  // when a session hits its limit the client simply reopens it on the next reply.
  // 10 min cap per video session: if a browser dies without hanging up, LiveAvatar stops
  // billing within 10 min (the app reconnects seamlessly when a session ends).
  let maxSeconds = Math.max(60, Math.min(st.remainingSeconds, 10 * 60));
  const requestToken = (dur) => liveAvatarFetch(c.env, "/v1/sessions/token", {
    method: "POST",
    body: JSON.stringify({
      mode: "LITE",
      avatar_id: avatarId,
      is_sandbox: c.env.LIVEAVATAR_SANDBOX === "1",
      video_settings: { quality: "high", encoding: "H264" },
      ...(dur ? { max_session_duration: dur } : {})
    })
  });
  let r = await requestToken(maxSeconds);
  for (let attempt = 0; attempt < 4 && !r.ok && JSON.stringify(r.data ?? "").includes("max_session_duration"); attempt++) {
    // Prefer a limit stated in the error message (largest number below what we asked for).
    const msg = [r.data?.message, ...(Array.isArray(r.data?.data) ? r.data.data.map((e) => e?.msg || e?.message) : [])].filter(Boolean).join(" ");
    const stated = (msg.match(/\d+/g) || []).map(Number).filter((n) => n >= 30 && n < (maxSeconds || Infinity));
    const ladder = [600, 300, 180, 0].filter((n) => !maxSeconds || n < maxSeconds);
    maxSeconds = stated.length ? Math.max(...stated) : (ladder[0] ?? 0);
    r = await requestToken(maxSeconds);
  }
  const token = r.data?.data?.session_token;
  const sessionId = r.data?.data?.session_id;
  if (!r.ok || !token) {
    const raw = JSON.stringify(r.data ?? null).slice(0, 300);
    console.error("LiveAvatar token failed", r.status, raw);
    if (isCreditError(r.data)) {
      await markAvatarOutOfCredits(c.env.DB);
      return c.json({ error: "photoreal_out_of_credits", ...(isOwnerEmail(user.email, c.env) ? { detail: "LiveAvatar account is out of credits — add credits at liveavatar.com" } : {}) }, 402);
    }
    const body = { error: "photoreal_unavailable" };
    // Owners get the real reason inline (invalid key, no credits, unknown avatar id, …)
    // since they can't easily read Worker logs; regular users just see the generic message.
    if (isOwnerEmail(user.email, c.env)) body.detail = `LiveAvatar ${r.status || "no response"}: ${raw}`;
    return c.json(body, 502);
  }
  // Start it here (not in the browser) so the server sees billing errors like "Insufficient
  // credits" and can pause photoreal for everyone instead of failing each session.
  let start = null;
  try {
    const sr = await fetch(`${avatarApiUrl(c.env)}/v1/sessions/start`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", accept: "application/json" } });
    const sj = await sr.json().catch(() => null);
    if (!sr.ok || sj?.code !== void 0 && sj.code !== 1e3) {
      console.error("LiveAvatar start failed", sr.status, JSON.stringify(sj).slice(0, 300));
      if (isCreditError(sj)) {
        await markAvatarOutOfCredits(c.env.DB);
        return c.json({ error: "photoreal_out_of_credits", ...(isOwnerEmail(user.email, c.env) ? { detail: "LiveAvatar account is out of credits — add credits at liveavatar.com" } : {}) }, 402);
      }
      return c.json({ error: "photoreal_unavailable", ...(isOwnerEmail(user.email, c.env) ? { detail: `LiveAvatar start ${sr.status}: ${JSON.stringify(sj).slice(0, 240)}` } : {}) }, 502);
    }
    start = sj?.data ?? sj;
  } catch (e) {
    return c.json({ error: "photoreal_unavailable", ...(isOwnerEmail(user.email, c.env) ? { detail: `LiveAvatar start: ${e?.message || e}` } : {}) }, 502);
  }
  await ensureAvatarTables(c.env.DB);
  const now = nowIso();
  // Billing is server-side and can't be skipped by a client that never sends heartbeats:
  // the whole session allowance is charged now and the unused part is refunded on /end.
  // One open session per user: settle any previous one first.
  const open = await c.env.DB.prepare("SELECT id FROM avatar_sessions WHERE user_id = ? AND ended_at IS NULL").bind(user.id).all();
  for (const row of open.results ?? []) await meterAvatarSession(c, user, row.id, true);
  await c.env.DB.batch([
    c.env.DB.prepare("INSERT OR REPLACE INTO avatar_sessions (id, user_id, debate_id, started_at, last_beat_at, max_seconds) VALUES (?, ?, ?, ?, ?, ?)").bind(String(sessionId || newId()), user.id, debate.id, now, now, maxSeconds),
    c.env.DB.prepare("INSERT INTO avatar_usage (user_id, month, seconds) VALUES (?, ?, ?) ON CONFLICT(user_id, month) DO UPDATE SET seconds = seconds + excluded.seconds").bind(user.id, currentMonth(), maxSeconds)
  ]);
  return c.json({ sessionToken: token, sessionId, apiUrl: avatarApiUrl(c.env), maxSeconds, remainingSeconds: Math.max(0, st.remainingSeconds - maxSeconds), start });
});
async function meterAvatarSession(c, user, sessionId, end) {
  await ensureAvatarTables(c.env.DB);
  const row = await c.env.DB.prepare("SELECT started_at, last_beat_at, ended_at, max_seconds FROM avatar_sessions WHERE id = ? AND user_id = ?").bind(sessionId, user.id).first();
  if (!row || row.ended_at) return 0;
  const now = Date.now();
  const iso = new Date(now).toISOString();
  if (row.max_seconds != null) {
    // Pre-charged at start. On end, refund what wasn't used (elapsed wall-clock, capped).
    if (!end) {
      await c.env.DB.prepare("UPDATE avatar_sessions SET last_beat_at = ? WHERE id = ?").bind(iso, sessionId).run();
      return 0;
    }
    const elapsed = Math.max(0, Math.min(Number(row.max_seconds), Math.round((now - Date.parse(row.started_at)) / 1e3)));
    const refund = Math.max(0, Number(row.max_seconds) - elapsed);
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE avatar_sessions SET last_beat_at = ?, ended_at = ? WHERE id = ?").bind(iso, iso, sessionId),
      c.env.DB.prepare("INSERT INTO avatar_usage (user_id, month, seconds) VALUES (?, ?, 0) ON CONFLICT(user_id, month) DO UPDATE SET seconds = MAX(0, seconds - ?)").bind(user.id, currentMonth(), refund)
    ]);
    return elapsed;
  }
  // Legacy rows (before pre-charging): count real elapsed time, never more than 45s per beat.
  const secs = Math.max(0, Math.min(45, Math.round((now - Date.parse(row.last_beat_at)) / 1e3)));
  await c.env.DB.batch([
    c.env.DB.prepare(end ? "UPDATE avatar_sessions SET last_beat_at = ?, ended_at = ? WHERE id = ?" : "UPDATE avatar_sessions SET last_beat_at = ? WHERE id = ?").bind(...end ? [iso, iso, sessionId] : [iso, sessionId]),
    c.env.DB.prepare("INSERT INTO avatar_usage (user_id, month, seconds) VALUES (?, ?, ?) ON CONFLICT(user_id, month) DO UPDATE SET seconds = seconds + excluded.seconds").bind(user.id, currentMonth(), secs)
  ]);
  return secs;
}
__name(meterAvatarSession, "meterAvatarSession");
avatarRouter.post("/heartbeat", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.json().catch(() => ({}));
  await meterAvatarSession(c, user, String(body.sessionId ?? ""), false);
  const st = await avatarStatus(c, user);
  return c.json({ remainingSeconds: st.remainingSeconds, stop: st.remainingSeconds <= 0 });
});
avatarRouter.post("/end", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.json().catch(() => ({}));
  await meterAvatarSession(c, user, String(body.sessionId ?? ""), true);
  const st = await avatarStatus(c, user);
  return c.json({ remainingSeconds: st.remainingSeconds });
});
// Owner tools: pick which LiveAvatar avatar plays each persona / historical figure.
avatarRouter.get("/catalog", async (c) => {
  const user = await getSessionUser(c);
  if (!user || !isOwnerEmail(user.email, c.env)) return c.json({ error: "forbidden" }, 403);
  if (!c.env.LIVEAVATAR_API_KEY) return c.json({ error: "photoreal_not_configured" }, 503);
  const avatars = await fetchAvatarCatalog(c.env, c.env.DB, { fresh: true });
  return c.json({ avatars: avatars.map(({ text, ...a }) => ({ ...a, gender: a.gender ?? avatarGender({ ...a, text }) })) });
});
avatarRouter.get("/map", async (c) => {
  const user = await getSessionUser(c);
  if (!user || !isOwnerEmail(user.email, c.env)) return c.json({ error: "forbidden" }, 403);
  const visuals = AVATAR_VISUAL_KEYS.map((k) => ({ key: k, label: k.replace(/-/g, " ") }));
  return c.json({ map: await resolveAvatarMap(c.env, c.env.DB), keys: visuals });
});
avatarRouter.post("/map", async (c) => {
  const user = await getSessionUser(c);
  if (!user || !isOwnerEmail(user.email, c.env)) return c.json({ error: "forbidden" }, 403);
  const body = await c.req.json().catch(() => ({}));
  const map = {};
  for (const [k, v] of Object.entries(body.map ?? {})) {
    if (typeof v === "string" && v.trim() && AVATAR_VISUAL_KEYS.includes(k)) map[k] = v.trim().slice(0, 100);
  }
  await c.env.DB.prepare("INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES ('liveavatar_map', ?, ?)").bind(JSON.stringify(map), nowIso()).run();
  return c.json({ ok: true, map });
});
// Owner: re-run automatic casting for every persona look.
avatarRouter.post("/map/auto", async (c) => {
  const user = await getSessionUser(c);
  if (!user || !isOwnerEmail(user.email, c.env)) return c.json({ error: "forbidden" }, 403);
  if (!c.env.LIVEAVATAR_API_KEY) return c.json({ error: "photoreal_not_configured" }, 503);
  const catalog = await fetchAvatarCatalog(c.env, c.env.DB, { fresh: true });
  if (!catalog.length) return c.json({ error: "catalog_empty" }, 502);
  const next = autoAssignAvatars(catalog, {}, AVATAR_VISUAL_KEYS);
  await c.env.DB.prepare("INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES ('liveavatar_map', ?, ?)").bind(JSON.stringify(next), nowIso()).run();
  return c.json({ ok: true, map: next });
});

// worker/src/index.ts
var app = new Hono2();
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "internal_error" }, 500);
});
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  if (!c.req.path.startsWith("/api/")) c.header("X-Frame-Options", "SAMEORIGIN");
});
app.get("/health", (c) => c.json({ ok: true }));
app.get("/app", (c) => c.redirect("/app/", 301));
app.get("/arena", (c) => c.redirect("/app/#/arena", 301));
app.get("/debate/:id", handlePublicDebateOg);
app.route("/api/public", publicRouter);
app.route("/api/auth", authRouter);
app.route("/api/debate", debateRouter);
app.route("/api/debates", debatesRouter);
app.route("/api/modes", modesRouter);
app.route("/api/account", accountRouter);
app.post("/api/promo/redeem", handlePromoRedeem);
app.route("/api/speech", speechRouter);
app.route("/api/avatar", avatarRouter);
app.route("/api/orgs", orgsRouter);
app.route("/", billingRouter);
app.route("/", webhookRouter);
var index_default = app;
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
