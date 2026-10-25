document.querySelectorAll('#year').forEach((node) => { node.textContent = new Date().getFullYear() })

// Keep links to the former homepage sections useful after the move to subpages.
const sectionPages = ['research', 'publication', 'experience', 'community', 'honors', 'beyond', 'contact'];
const section = window.location.hash.slice(1);
if ((window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/index.html')) && sectionPages.includes(section)) {
  window.location.replace(section + '.html?v=20261024-7');
}
