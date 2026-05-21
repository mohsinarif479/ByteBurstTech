const normalizePage = (value) => {
  const page = (value || 'index.html').split('/').pop().split('#')[0] || 'index.html';
  return page.replace(/\.html$/, '') || 'index';
};

const currentPage = normalizePage(window.location.pathname);

document.querySelectorAll('.main-nav a').forEach((link) => {
  const targetPage = normalizePage(link.getAttribute('href'));
  if (targetPage === currentPage) {
    link.setAttribute('aria-current', 'page');
  }
});
