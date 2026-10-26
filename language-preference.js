// Runs before rendering so a remembered language does not flash English first.
(() => {
  document.documentElement.classList.add('js');
  try {
    const base = new URL('./', document.currentScript.src);
    const current = new URL(window.location.href);
    if (current.origin !== base.origin || !current.pathname.startsWith(base.pathname)) return;
    const page = current.pathname.slice(base.pathname.length) || 'index.html';
    const explicit = page.match(/^(zh|fr)\//);
    if (explicit) {
      localStorage.setItem('site-language', explicit[1] === 'zh' ? 'zh-Hans' : 'fr');
      return;
    }
    const preferred = localStorage.getItem('site-language');
    const folder = { 'zh-Hans': 'zh', fr: 'fr' }[preferred];
    if (!folder || !/^(?:[\w-]+\.html|projects\/[\w-]+\.html)$/.test(page)) return;
    const target = new URL(folder + '/' + page, base);
    target.search = current.search;
    target.hash = current.hash;
    window.location.replace(target.href);
  } catch {
    // Storage restrictions should never prevent access to any language edition.
  }
})();
