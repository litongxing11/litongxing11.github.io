document.querySelectorAll('#year').forEach((node) => { node.textContent = new Date().getFullYear() })

// Let native page transitions handle the entrance when the browser provides one.
// Other browsers still get the CSS entrance without changing how links work.
window.addEventListener('pagereveal', (event) => {
  document.documentElement.classList.toggle('native-page-transition', Boolean(event.viewTransition));
});

// Keep links to the former homepage sections useful after the move to subpages.
const sectionPages = ['research', 'publication', 'experience', 'community', 'honors', 'beyond', 'contact'];
const section = window.location.hash.slice(1);
if ((window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/index.html')) && sectionPages.includes(section)) {
  window.location.replace(section + '.html?v=20261024-14');
}
