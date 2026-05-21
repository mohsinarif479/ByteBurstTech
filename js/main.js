const defaultProjects = [
  {
    title: 'Biometric Voting System',
    bannerTitle: 'Secure biometric voting',
    bannerText: 'Fraud-resistant voting with biometric authentication and a React-based interface.',
    bannerIcon: '01',
    imageUrl: 'images/project-default.svg',
    images: ['images/project-default.svg'],
    description: 'Secure voting application using biometric authentication, C#, .NET, SQL Server, and a React-based frontend for a modern voting experience.',
  },
  {
    title: 'Freelancer Auto Bidder',
    bannerTitle: 'Automated freelance bidding',
    bannerText: 'Smart project matching and automated bids managed through a React dashboard.',
    bannerIcon: '02',
    imageUrl: 'images/project-automation.svg',
    images: ['images/project-automation.svg'],
    description: 'Automated bidding system built with JavaScript, web scraping logic, and a React dashboard for bid management.',
  },
  {
    title: 'Online Ticket Reservation System',
    bannerTitle: 'Real-time ticket booking',
    bannerText: 'MERN reservation platform with live seat management and Stripe payments.',
    bannerIcon: '03',
    imageUrl: 'images/project-crm.svg',
    images: ['images/project-crm.svg'],
    description: 'MERN stack booking system with real-time seat management and Stripe payment integration for secure transactions.',
  },
  {
    title: 'Phishing URL Detection System',
    bannerTitle: 'Machine learning URL security',
    bannerText: 'Python ML pipeline for classifying malicious and safe URLs in real time.',
    bannerIcon: '04',
    imageUrl: 'images/project-default.svg',
    images: ['images/project-default.svg'],
    description: 'Python and machine learning system for feature extraction, model training, and malicious URL classification.',
  },
  {
    title: 'Online E-Commerce Book Store',
    bannerTitle: 'MERN book commerce',
    bannerText: 'Responsive online bookstore with cart, authentication, and order management.',
    bannerIcon: '05',
    imageUrl: 'images/project-ecommerce.svg',
    images: ['images/project-ecommerce.svg'],
    description: 'MERN stack e-commerce bookstore with product browsing, cart functionality, authentication, and order management.',
  },
  {
    title: 'File Management System',
    bannerTitle: 'C++ file operations system',
    bannerText: 'Structured file I/O system supporting create, read, update, and delete flows.',
    bannerIcon: '06',
    imageUrl: 'images/project-default.svg',
    images: ['images/project-default.svg'],
    description: 'C++ file management system using structured programming and file I/O concepts for optimized CRUD operations.',
  },
];

const legacyProjectTitles = ['Custom CRM Solution', 'E-commerce Website', 'Business Automation'];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function isLegacyProjectSet(items) {
  return Array.isArray(items)
    && items.length === legacyProjectTitles.length
    && items.every((item) => legacyProjectTitles.includes(item.title));
}

function normalizeProject(item, index = 0) {
  const imageUrl = item.imageUrl || 'images/project-default.svg';
  const images = Array.isArray(item.images) && item.images.length ? item.images : [imageUrl];
  return {
    title: item.title || `Project ${index + 1}`,
    bannerTitle: item.bannerTitle || item.title || `Project ${index + 1}`,
    bannerText: item.bannerText || item.description || '',
    bannerIcon: item.bannerIcon || String(index + 1).padStart(2, '0'),
    imageUrl: images[0] || imageUrl,
    images,
    description: item.description || '',
  };
}

async function getPortfolioItems() {
  try {
    const response = await fetch('/api/projects', { cache: 'no-store' });
    if (!response.ok) throw new Error('Projects request failed');
    const data = await response.json();
    if (!Array.isArray(data.projects) || !data.projects.length || isLegacyProjectSet(data.projects)) {
      return defaultProjects;
    }
    return data.projects.map(normalizeProject);
  } catch (error) {
    return defaultProjects;
  }
}

async function renderSliderTrack(trackId) {
  const track = document.getElementById(trackId);
  if (!track) return;

  const items = await getPortfolioItems();
  track.innerHTML = items
    .map((item) => {
      const title = escapeHtml(item.title);
      const bannerTitle = escapeHtml(item.bannerTitle || item.title);
      const bannerText = escapeHtml(item.bannerText || item.description);
      const bannerIcon = escapeHtml(item.bannerIcon || 'New');
      const imageUrl = escapeHtml(item.imageUrl || 'images/project-default.svg');
      const gallery = Array.isArray(item.images) && item.images.length ? item.images : [item.imageUrl || 'images/project-default.svg'];
      const galleryImages = gallery.slice(1, 4).map((image, index) => {
        const safeImage = escapeHtml(image);
        return `<img src="${safeImage}" alt="${title} gallery image ${index + 2}" loading="lazy" />`;
      }).join('');
      const description = escapeHtml(item.description);

      return `
        <article class="portfolio-card slider-slide">
          <div class="slide-banner">
            <div class="banner-copy">
              <span class="banner-label">Featured case study</span>
              <div class="banner-title-wrap">
                <span class="banner-icon">${bannerIcon}</span>
                <div>
                  <h3>${bannerTitle}</h3>
                  <p>${bannerText}</p>
                </div>
              </div>
            </div>
            <div class="banner-visual">
              <img class="banner-image" src="${imageUrl}" alt="${title}" loading="lazy" />
              ${galleryImages ? `<div class="banner-gallery">${galleryImages}</div>` : ''}
              <span class="banner-tag">Portfolio project</span>
            </div>
          </div>
          <p>${description}</p>
        </article>`;
    })
    .join('');
}

async function renderPortfolioCards() {
  const list = document.getElementById('portfolioList');
  if (!list) return;

  const items = await getPortfolioItems();
  list.innerHTML = items
    .map((item) => {
      const title = escapeHtml(item.title);
      const imageUrl = escapeHtml(item.imageUrl || 'images/project-default.svg');
      const gallery = Array.isArray(item.images) && item.images.length ? item.images : [item.imageUrl || 'images/project-default.svg'];
      const galleryImages = gallery.slice(1, 4).map((image, index) => {
        const safeImage = escapeHtml(image);
        return `<img src="${safeImage}" alt="${title} gallery image ${index + 2}" loading="lazy" />`;
      }).join('');
      const description = escapeHtml(item.description);

      return `
        <article class="portfolio-card">
          <div class="portfolio-media">
            <img class="portfolio-image" src="${imageUrl}" alt="${title}" loading="lazy" />
            ${galleryImages ? `<div class="portfolio-gallery">${galleryImages}</div>` : ''}
          </div>
          <div class="portfolio-card-copy">
            <span class="card-label">Mohsin project</span>
            <h3>${title}</h3>
            <p>${description}</p>
          </div>
        </article>`;
    })
    .join('');
}

function initSlider(sliderId, trackId, dotsId, autoRotate = false) {
  const slider = document.getElementById(sliderId);
  const track = document.getElementById(trackId);
  const dotsContainer = document.getElementById(dotsId);
  if (!slider || !track || !dotsContainer) return;

  const slides = Array.from(track.children);
  if (!slides.length) return;

  let activeIndex = 0;
  let intervalId = null;

  function updateSlider(index) {
    activeIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${activeIndex * 100}%)`;
    Array.from(dotsContainer.children).forEach((dot, dotIndex) => {
      dot.classList.toggle('active', dotIndex === activeIndex);
      dot.setAttribute('aria-pressed', String(dotIndex === activeIndex));
    });
  }

  dotsContainer.innerHTML = '';
  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'slider-dot';
    dot.setAttribute('aria-label', `Show project ${index + 1}`);
    dot.addEventListener('click', () => updateSlider(index));
    dotsContainer.append(dot);
  });

  slider.querySelector('.slider-button.prev')?.addEventListener('click', () => updateSlider(activeIndex - 1));
  slider.querySelector('.slider-button.next')?.addEventListener('click', () => updateSlider(activeIndex + 1));

  if (autoRotate && slides.length > 1) {
    const start = () => {
      intervalId = window.setInterval(() => updateSlider(activeIndex + 1), 7000);
    };
    const stop = () => window.clearInterval(intervalId);

    start();
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    slider.addEventListener('focusin', stop);
    slider.addEventListener('focusout', start);
  }

  updateSlider(0);
}

async function setupPortfolio() {
  await renderSliderTrack('homeSliderTrack');
  await renderPortfolioCards();
  initSlider('homePortfolioSlider', 'homeSliderTrack', 'homeSliderDots', true);
}

document.addEventListener('DOMContentLoaded', setupPortfolio);
