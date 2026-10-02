/**
 * Feedback button (landing + app): a small form that posts to /api/feedback with the page,
 * browser and, when logged in, the account. Open it with window.AAIFeedback.open() or any
 * element carrying data-feedback.
 */
(function () {
  'use strict';
  var box = null;

  function build() {
    box = document.createElement('div');
    box.id = 'aai-feedback';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'aai-fb-title');
    box.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.55);padding:16px;';
    box.innerHTML =
      '<form style="width:100%;max-width:440px;background:#15181f;color:#e5e7eb;border:1px solid #2a2f3a;border-radius:16px;padding:20px;font:14px/1.45 system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
      '<strong id="aai-fb-title" style="font-size:16px">Tell us what happened</strong>' +
      '<button type="button" data-close aria-label="Close" style="background:none;border:0;color:#9ca3af;font-size:22px;line-height:1;cursor:pointer;padding:4px 8px">&times;</button></div>' +
      '<p style="margin:0 0 10px;color:#9ca3af">Something broken, confusing or missing? A sentence or two is plenty. Problems get fixed fast.</p>' +
      '<textarea name="message" required maxlength="2000" rows="4" placeholder="What were you doing, and what went wrong?" style="width:100%;box-sizing:border-box;background:#0d0f14;color:#fff;border:1px solid #2a2f3a;border-radius:10px;padding:10px;font:inherit;resize:vertical"></textarea>' +
      '<input name="email" type="email" placeholder="Email, if you want a reply (optional)" style="width:100%;box-sizing:border-box;margin-top:8px;background:#0d0f14;color:#fff;border:1px solid #2a2f3a;border-radius:10px;padding:10px;font:inherit">' +
      '<div data-out style="display:none;margin-top:8px;color:#fca5a5"></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">' +
      '<button type="button" data-close style="background:none;border:1px solid #2a2f3a;color:#d1d5db;border-radius:10px;padding:9px 14px;font:inherit;cursor:pointer">Cancel</button>' +
      '<button type="submit" style="background:#e8392e;border:0;color:#fff;font-weight:700;border-radius:10px;padding:9px 16px;font:inherit;cursor:pointer">Send</button></div></form>';
    document.body.appendChild(box);
    box.addEventListener('click', function (e) { if (e.target === box || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.style.display !== 'none') close(); });
    var form = box.querySelector('form');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var btn = form.querySelector('[type=submit]');
      var out = form.querySelector('[data-out]');
      var msg = form.message.value.trim();
      if (!msg) return;
      btn.disabled = true;
      btn.textContent = 'Sending…';
      out.style.display = 'none';
      try {
        var r = await fetch('/api/feedback', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg, email: form.email.value.trim(), page: location.pathname + location.hash, ua: navigator.userAgent })
        });
        if (!r.ok) throw new Error((await r.json().catch(function () { return {}; })).message || 'send failed');
        form.innerHTML = '<p style="margin:0;text-align:center;padding:12px 0">Thanks. We read every one of these.</p>';
        setTimeout(close, 1600);
      } catch (err) {
        out.textContent = err.message === 'rate_limited' ? 'Please wait a bit before sending more.' : 'Could not send. Email support@getadversaryai.com instead.';
        out.style.display = '';
        btn.disabled = false;
        btn.textContent = 'Send';
      }
    });
  }

  function open() {
    if (!box) build();
    else if (!box.querySelector('textarea')) { box.remove(); box = null; build(); }
    box.style.display = 'flex';
    setTimeout(function () { box.querySelector('textarea').focus(); }, 50);
  }
  function close() { if (box) box.style.display = 'none'; }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-feedback]');
    if (t) { e.preventDefault(); open(); }
  });
  window.AAIFeedback = { open: open, close: close };
})();
