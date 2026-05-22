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

const siteHeader = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');

function setMenuOpen(isOpen) {
  if (!siteHeader || !navToggle || !mainNav) return;
  siteHeader.classList.toggle('nav-open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
}

navToggle?.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  setMenuOpen(!isOpen);
});

mainNav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenuOpen(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenuOpen(false);
});

window.addEventListener('resize', () => {
  if (window.matchMedia('(min-width: 901px)').matches) setMenuOpen(false);
});
