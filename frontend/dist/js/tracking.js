/**
 * AdversaryAI ad tracking (landing + app).
 *
 * Paste your IDs below (leave blank to disable). Nothing loads until an ID is set, and
 * nothing loads for visitors who look like they're in the EU/UK unless they accept the
 * small consent bar (Meta requires consent there).
 *
 *   GTM_ID   – Google Tag Manager container, e.g. "GTM-XXXXXXX" (recommended: manage all
 *              pixels here; the events below arrive on the dataLayer)
 *   META_ID  – Meta Pixel ID, e.g. "1234567890"
 *   TIKTOK_ID– TikTok Pixel ID, e.g. "CXXXXXXXXXXXXXXXXX"
 *   GADS     – Google Ads conversion, e.g. { id: "AW-123456789", signup: "abcDEF", purchase: "ghiJKL" }
 *
 * Events fired by the site (all go to dataLayer as {event, ...}, and to the pixels):
 *   view_landing, cta_click, sign_up, session_start, session_complete, begin_checkout, purchase
 */
(function () {
  'use strict';
  var CFG = {
    GTM_ID: '',
    META_ID: '',
    TIKTOK_ID: '',
    GADS: { id: 'AW-18489049594', signup: '', purchase: '' }
  };
  window.ADV_TRACK_CFG = CFG;

  // ---- UTM / click-id capture (kept for 30 days, sent with sign_up and purchase)
  var ATTR_KEY = 'aai_attrib';
  function readAttrib() {
    try { return JSON.parse(localStorage.getItem(ATTR_KEY) || 'null'); } catch (e) { return null; }
  }
  function captureAttrib() {
    var q = new URLSearchParams(location.search);
    var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'ttclid'];
    var found = {};
    var any = false;
    keys.forEach(function (k) { var v = q.get(k); if (v) { found[k] = v.slice(0, 200); any = true; } });
    if (!any) return;
    found.landing = location.pathname;
    found.at = Date.now();
    try { localStorage.setItem(ATTR_KEY, JSON.stringify(found)); } catch (e) {}
  }
  captureAttrib();
  window.adversaryAttribution = readAttrib;

  // ---- consent (EU/UK only; everyone else is tracked immediately)
  var EU = /^(AT|BE|BG|HR|CY|CZ|DK|EE|FI|FR|DE|GR|HU|IE|IT|LV|LT|LU|MT|NL|PL|PT|RO|SK|SI|ES|SE|GB|IS|LI|NO|CH)$/;
  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  var looksEU = /^Europe\//.test(tz);
  var consent = null;
  try { consent = localStorage.getItem('aai_consent'); } catch (e) {}
  var anyPixel = !!(CFG.GTM_ID || CFG.META_ID || CFG.TIKTOK_ID || (CFG.GADS && CFG.GADS.id));

  var loaded = false;
  var queue = [];
  function loadPixels() {
    if (loaded || !anyPixel) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    if (CFG.GTM_ID) {
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      var g = document.createElement('script'); g.async = true;
      g.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(CFG.GTM_ID);
      document.head.appendChild(g);
    }
    if (CFG.GADS && CFG.GADS.id && !CFG.GTM_ID) {
      var a = document.createElement('script'); a.async = true;
      a.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CFG.GADS.id);
      document.head.appendChild(a);
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', CFG.GADS.id);
    }
    if (CFG.META_ID) {
      !(function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', CFG.META_ID); window.fbq('track', 'PageView');
    }
    if (CFG.TIKTOK_ID) {
      !(function (w, d, t) { w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || []; ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
        ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; }; for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.load = function (e) { var o = d.createElement('script'); o.async = !0; o.src = 'https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=' + e + '&lib=' + t; var a = d.getElementsByTagName('script')[0]; a.parentNode.insertBefore(o, a); };
        ttq.load(CFG.TIKTOK_ID); ttq.page(); })(window, document, 'ttq');
    }
    queue.splice(0).forEach(function (q) { track(q[0], q[1]); });
  }

  var META_MAP = { sign_up: 'CompleteRegistration', session_start: 'StartTrial', begin_checkout: 'InitiateCheckout', purchase: 'Purchase', cta_click: 'Lead' };
  var TT_MAP = { sign_up: 'CompleteRegistration', session_start: 'SubmitForm', begin_checkout: 'InitiateCheckout', purchase: 'CompletePayment', cta_click: 'ClickButton' };
  function track(event, data) {
    data = data || {};
    if (!loaded) { if (anyPixel) queue.push([event, data]); return; }
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: event }, data));
      if (window.fbq && META_MAP[event]) window.fbq('track', META_MAP[event], data);
      if (window.ttq && TT_MAP[event]) window.ttq.track(TT_MAP[event], data);
      if (window.gtag && CFG.GADS && CFG.GADS.id) {
        var label = event === 'sign_up' ? CFG.GADS.signup : event === 'purchase' ? CFG.GADS.purchase : '';
        if (label) window.gtag('event', 'conversion', Object.assign({ send_to: CFG.GADS.id + '/' + label }, data));
      }
    } catch (e) {}
  }
  window.adversaryTrack = track;

  function showConsent() {
    if (document.getElementById('aai-consent')) return;
    var bar = document.createElement('div');
    bar.id = 'aai-consent';
    bar.setAttribute('role', 'dialog');
    bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:99998;background:#111318;color:#e2e8f0;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:12px 14px;font:14px/1.45 system-ui,sans-serif;display:flex;gap:10px;align-items:center;flex-wrap:wrap;box-shadow:0 12px 40px rgba(0,0,0,.5)';
    bar.innerHTML = '<span style="flex:1;min-width:200px">We use cookies to measure our ads. <a href="/privacy.html" style="color:#ff2e3f">Privacy</a></span>' +
      '<button id="aai-c-no" style="background:transparent;color:#cbd5e1;border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:8px 14px;cursor:pointer">No thanks</button>' +
      '<button id="aai-c-yes" style="background:#ff2e3f;color:#fff;border:0;border-radius:999px;padding:8px 14px;font-weight:600;cursor:pointer">OK</button>';
    document.body.appendChild(bar);
    document.getElementById('aai-c-yes').onclick = function () { try { localStorage.setItem('aai_consent', 'yes'); } catch (e) {} bar.remove(); loadPixels(); };
    document.getElementById('aai-c-no').onclick = function () { try { localStorage.setItem('aai_consent', 'no'); } catch (e) {} bar.remove(); };
  }

  if (anyPixel) {
    if (!looksEU || consent === 'yes') loadPixels();
    else if (consent !== 'no') { if (document.body) showConsent(); else document.addEventListener('DOMContentLoaded', showConsent); }
  }
})();
