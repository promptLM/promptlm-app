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

  // ── code-tabs (Java / Python / TypeScript test-harness examples) ──
  document.querySelectorAll('[data-code-tabs]').forEach((group) => {
    const tabs = Array.from(group.querySelectorAll('[data-code-tab]'));
    const panels = Array.from(group.querySelectorAll('[data-code-panel]'));
    const activate = (key) => {
      tabs.forEach((tab) => {
        const isActive = tab.dataset.codeTab === key;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
      });
      panels.forEach((panel) => {
        const isActive = panel.dataset.codePanel === key;
        panel.classList.toggle('is-active', isActive);
        panel.hidden = !isActive;
      });
    };
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => activate(tab.dataset.codeTab));
      tab.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const idx = tabs.indexOf(tab);
        const next = event.key === 'ArrowRight'
          ? (idx + 1) % tabs.length
          : (idx - 1 + tabs.length) % tabs.length;
        activate(tabs[next].dataset.codeTab);
        tabs[next].focus();
      });
    });
  });
})();
