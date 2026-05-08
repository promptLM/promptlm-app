// promptLM marketing site — landing page interactions.
//
// The brand drop's `Landing` JSX (design/handoff/brand/site.jsx) is
// almost entirely declarative. The only real client-side affordance
// is the install-line copy button, so this file stays intentionally
// small. If you find yourself reaching for a framework here, you've
// drifted from the brand contract — push that work into a separate
// surface instead.

(function () {
  'use strict';

  // ── install-line copy-to-clipboard ────────────────────────────────
  const copyButton = document.querySelector('[data-install-copy]');
  const cmdNode = document.querySelector('[data-install-cmd]');

  if (copyButton && cmdNode && navigator.clipboard) {
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(cmdNode.textContent.trim());
        copyButton.classList.add('is-copied');
        copyButton.setAttribute('aria-label', 'Copied');
        window.setTimeout(() => {
          copyButton.classList.remove('is-copied');
          copyButton.setAttribute('aria-label', 'Copy install command');
        }, 1500);
      } catch (err) {
        // Clipboard write can fail in restrictive contexts (iframes
        // without permission, file:// origins). Fail silently — the
        // command is visible and selectable inline.
      }
    });
  }
})();
