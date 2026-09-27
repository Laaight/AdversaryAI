/**
 * AdversaryAI PWA Helper
 * - Registers ServiceWorker for offline caching & installability
 * - Handles Android/Desktop Chrome `beforeinstallprompt` (1-tap native install)
 * - Handles iOS Safari "Add to Home Screen" guidance modal
 * - Dynamic Viewport Height (100dvh) polyfill for mobile keyboards
 */
(function () {
  'use strict';

  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(function (reg) {
          reg.onupdatefound = function () {
            var inst = reg.installing;
            if (!inst) return;
            inst.onstatechange = function () {
              if (inst.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[AdversaryAI] New version available.');
              }
            };
          };
        })
        .catch(function (err) {
          console.warn('[AdversaryAI] Service worker failed:', err);
        });
    });
  }

  // 2. Viewport height fix for mobile browsers
  function setDvh() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--dvh', vh + 'px');
  }
  window.addEventListener('resize', setDvh);
  window.addEventListener('orientationchange', setDvh);
  setDvh();

  // 3. Detect standalone mode
  var isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone) {
    document.documentElement.classList.add('is-pwa-standalone');
    return; // Already installed and running as an app
  }

  var isIOS =
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !window.MSStream;
  var isSafari =
    isIOS &&
    /Safari/i.test(navigator.userAgent) &&
    !/CriOS|FxiOS|OPiOS|EdgiOS/i.test(navigator.userAgent);

  var deferredPrompt = null;

  // Create UI container
  function createInstallUI() {
    if (document.getElementById('pwa-install-container')) return;

    var container = document.createElement('div');
    container.id = 'pwa-install-container';
    container.style.cssText =
      'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:99999;max-width:92vw;width:420px;pointer-events:auto;';

    document.body.appendChild(container);
    return container;
  }

  // A. Android / Chrome 1-Tap Install Button
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;

    var container = createInstallUI();
    if (!container) return;

    container.innerHTML =
      '<div style="background:rgba(13,15,20,0.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,46,63,0.35);border-radius:16px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:14px;box-shadow:0 12px 36px rgba(0,0,0,0.6),0 0 20px rgba(255,46,63,0.18);">' +
      '  <div style="display:flex;align-items:center;gap:12px;">' +
      '    <img src="/icons/icon-192.png" alt="AdversaryAI" style="width:40px;height:40px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);">' +
      '    <div>' +
      '      <div style="font-weight:700;font-size:14px;color:#fff;letter-spacing:-0.2px;">Install AdversaryAI</div>' +
      '      <div style="font-size:12px;color:#94a3b8;">1-tap sparring from home screen</div>' +
      '    </div>' +
      '  </div>' +
      '  <div style="display:flex;align-items:center;gap:8px;">' +
      '    <button id="pwa-install-btn" style="background:#ff2e3f;color:#fff;border:none;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;transition:transform 0.15s,background 0.15s;">Install</button>' +
      '    <button id="pwa-dismiss-btn" style="background:transparent;color:#64748b;border:none;font-size:18px;cursor:pointer;padding:4px 6px;">✕</button>' +
      '  </div>' +
      '</div>';

    var btn = document.getElementById('pwa-install-btn');
    var dismiss = document.getElementById('pwa-dismiss-btn');

    if (btn) {
      btn.addEventListener('click', function () {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function (choice) {
          if (choice.outcome === 'accepted') {
            container.remove();
          }
          deferredPrompt = null;
        });
      });
    }

    if (dismiss) {
      dismiss.addEventListener('click', function () {
        container.remove();
      });
    }
  });

  window.addEventListener('appinstalled', function () {
    var c = document.getElementById('pwa-install-container');
    if (c) c.remove();
    console.log('[AdversaryAI] App successfully installed.');
  });

  // B. iOS Safari "Add to Home Screen" Instruction Modal
  var dismissedIOS = sessionStorage.getItem('pwa-ios-dismissed');
  if (isSafari && !dismissedIOS) {
    // Delay prompt slightly so user gets oriented
    window.setTimeout(function () {
      if (document.getElementById('pwa-install-container')) return;
      var container = createInstallUI();
      if (!container) return;

      container.innerHTML =
        '<div style="background:rgba(13,15,20,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,46,63,0.35);border-radius:18px;padding:16px 20px;box-shadow:0 16px 44px rgba(0,0,0,0.7),0 0 24px rgba(255,46,63,0.2);">' +
        '  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;">' +
        '    <div style="display:flex;align-items:center;gap:10px;">' +
        '      <img src="/icons/icon-192.png" alt="AdversaryAI" style="width:36px;height:36px;border-radius:8px;">' +
        '      <div>' +
        '        <div style="font-weight:700;font-size:14px;color:#fff;">Install on iPhone</div>' +
        '        <div style="font-size:12px;color:#94a3b8;">Fullscreen sparring with no address bar</div>' +
        '      </div>' +
        '    </div>' +
        '    <button id="pwa-ios-close" style="background:none;border:none;color:#64748b;font-size:18px;cursor:pointer;padding:2px 6px;">✕</button>' +
        '  </div>' +
        '  <div style="font-size:13px;color:#cbd5e1;line-height:1.5;background:rgba(255,255,255,0.04);padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.06);">' +
        '    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
        '      <span style="font-weight:700;color:#ff2e3f;">1.</span> Tap the <strong>Share</strong> button <span style="display:inline-block;padding:1px 6px;background:rgba(255,255,255,0.1);border-radius:4px;font-size:12px;">⎋</span> below' +
        '    </div>' +
        '    <div style="display:flex;align-items:center;gap:8px;">' +
        '      <span style="font-weight:700;color:#ff2e3f;">2.</span> Scroll & tap <strong>"Add to Home Screen"</strong> <span style="display:inline-block;padding:1px 6px;background:rgba(255,255,255,0.1);border-radius:4px;font-size:12px;">⊞</span>' +
        '    </div>' +
        '  </div>' +
        '</div>';

      var closeBtn = document.getElementById('pwa-ios-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          sessionStorage.setItem('pwa-ios-dismissed', '1');
          container.remove();
        });
      }
    }, 2800);
  }
})();
