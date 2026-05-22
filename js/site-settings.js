const defaultSiteSettings = {
  companyName: 'DevCraft Studio',
  logoText: 'D',
  logoUrl: '',
};

function applySiteSettings(settings = defaultSiteSettings) {
  const companyName = settings.companyName || defaultSiteSettings.companyName;
  const logoText = settings.logoText || companyName.charAt(0) || defaultSiteSettings.logoText;

  document.querySelectorAll('[data-brand-name]').forEach((element) => {
    element.textContent = companyName;
  });

  document.querySelectorAll('[data-brand-footer]').forEach((element) => {
    element.textContent = element.dataset.brandFooter.replace('{company}', companyName);
  });

  document.querySelectorAll('[data-brand-mark]').forEach((element) => {
    element.innerHTML = '';
    if (settings.logoUrl) {
      const image = document.createElement('img');
      image.src = '/api/logo';
      image.alt = '';
      image.loading = 'lazy';
      element.append(image);
      element.classList.add('brand-mark-image');
    } else {
      element.textContent = logoText;
      element.classList.remove('brand-mark-image');
    }
  });
}

async function loadSiteSettings() {
  try {
    const response = await fetch('/api/settings', { cache: 'no-store' });
    const data = await response.json();
    if (response.ok) applySiteSettings(data.settings);
  } catch (error) {
    applySiteSettings(defaultSiteSettings);
  }
}

loadSiteSettings();
