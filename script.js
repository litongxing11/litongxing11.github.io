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
    window.location.replace(section + '.html?v=20261025-1');
  } else if (section === 'education' && (homePage || window.location.pathname.endsWith('/experience.html'))) {
    window.location.replace('index.html?v=20261025-1#about');
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
