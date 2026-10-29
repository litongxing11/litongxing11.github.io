document.querySelectorAll('#year').forEach((node) => { node.textContent = new Date().getFullYear() })

// Let native page transitions handle the entrance when the browser provides one.
// Other browsers still get the CSS entrance without changing how links work.
window.addEventListener('pagereveal', (event) => {
  document.documentElement.classList.toggle('native-page-transition', Boolean(event.viewTransition));
});

// Keep links to the former homepage sections useful after the move to subpages.
const sectionPages = ['research', 'publication', 'experience', 'community', 'honors', 'beyond', 'contact'];
function redirectMovedSection() {
  const section = window.location.hash.slice(1);
  const homePage = window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/index.html');
  if (homePage && sectionPages.includes(section)) {
    window.location.replace(section + '.html?v=20261028-2');
  } else if (section === 'education' && (homePage || window.location.pathname.endsWith('/experience.html'))) {
    window.location.replace('index.html?v=20261028-2#about');
  }
}
redirectMovedSection();
window.addEventListener('hashchange', redirectMovedSection);

// Language links always lead to this page and preserve a selected subsection.
function updateLanguageLinks() {
  document.querySelectorAll('.language-switch a').forEach((link) => {
    const destination = new URL(link.href);
    destination.hash = window.location.hash;
    link.href = destination.href;
  });
}
updateLanguageLinks();
window.addEventListener('hashchange', updateLanguageLinks);

document.querySelectorAll('.language-switch a').forEach((link) => {
  link.addEventListener('click', () => {
    try { localStorage.setItem('site-language', link.dataset.language); } catch { /* Optional preference. */ }
  });
});

// A disclosure keeps the sticky navigation compact on small screens.
const siteHeader = document.querySelector('.header');
const menuToggle = document.querySelector('[data-menu-toggle]');
function closeMenu(restoreFocus = false) {
  siteHeader?.classList.remove('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  if (restoreFocus) menuToggle?.focus();
}
menuToggle?.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(expanded));
  siteHeader.classList.toggle('menu-open', expanded);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && siteHeader?.classList.contains('menu-open')) closeMenu(true);
});
window.matchMedia('(max-width: 760px)').addEventListener('change', () => closeMenu());

const progress = document.querySelector('.reading-progress');
let scrollPending = false;
function updateReadingPosition() {
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
  if (progress) progress.style.transform = `scaleX(${ratio})`;
  siteHeader?.classList.toggle('is-scrolled', window.scrollY > 20);
  scrollPending = false;
}
window.addEventListener('scroll', () => {
  if (!scrollPending) {
    scrollPending = true;
    window.requestAnimationFrame(updateReadingPosition);
  }
}, { passive: true });
window.addEventListener('resize', updateReadingPosition);
window.addEventListener('load', updateReadingPosition);
updateReadingPosition();

// PDF links remain ordinary links if dialogs are unavailable or a new tab is requested.
const documentDialog = document.querySelector('#document-preview');
const documentCover = documentDialog?.querySelector('.document-cover');
let documentOpener;
document.addEventListener('click', (event) => {
  const link = event.target.closest?.('a[href]');
  if (!link || link.closest('#document-preview') || link.hasAttribute('download')) return;
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  if (!documentDialog || typeof documentDialog.showModal !== 'function' || !link.dataset.previewImage) return;
  const url = new URL(link.href);
  if (url.origin !== window.location.origin || !/\.pdf$/i.test(url.pathname)) return;
  event.preventDefault();
  closeMenu();
  const title = link.dataset.documentTitle || link.textContent.trim();
  documentDialog.querySelector('#document-title').textContent = title;
  documentCover.src = link.dataset.previewImage;
  documentDialog.querySelector('.document-canvas').scrollTop = 0;
  documentDialog.querySelector('[data-document-open]').href = url.href;
  const download = documentDialog.querySelector('[data-document-download]');
  download.href = url.href;
  download.download = url.pathname.split('/').pop();
  documentOpener = link;
  document.documentElement.classList.add('modal-open');
  documentDialog.showModal();
});
documentDialog?.querySelector('[data-preview-close]').addEventListener('click', () => documentDialog.close());
documentDialog?.addEventListener('click', (event) => {
  if (event.target !== documentDialog) return;
  const rect = documentDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) documentDialog.close();
});
documentDialog?.addEventListener('close', () => {
  documentCover.removeAttribute('src');
  document.documentElement.classList.remove('modal-open');
  documentOpener?.focus({ preventScroll: true });
});

const copyToast = document.querySelector('.copy-toast');
let copyTimer;
document.querySelectorAll('[data-copy-email]').forEach((button) => {
  button.addEventListener('click', async () => {
    let message;
    try {
      await navigator.clipboard.writeText(button.dataset.copyEmail);
      message = button.dataset.copySuccess;
    } catch {
      message = button.dataset.copyError;
    }
    if (!copyToast) return;
    window.clearTimeout(copyTimer);
    copyToast.textContent = message;
    copyToast.classList.add('is-visible');
    copyTimer = window.setTimeout(() => copyToast.classList.remove('is-visible'), 3000);
  });
});
