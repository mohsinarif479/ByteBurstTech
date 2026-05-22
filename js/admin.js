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

const loginForm = document.getElementById('loginForm');
const adminPassword = document.getElementById('adminPassword');
const loginPanel = document.getElementById('loginPanel');
const dashboardPanel = document.getElementById('dashboardPanel');
const logoutButton = document.getElementById('logoutButton');
const projectForm = document.getElementById('projectForm');
const editingIndex = document.getElementById('editingIndex');
const projectTitle = document.getElementById('projectTitle');
const projectBannerTitle = document.getElementById('projectBannerTitle');
const projectBannerText = document.getElementById('projectBannerText');
const projectBannerIcon = document.getElementById('projectBannerIcon');
const projectDescription = document.getElementById('projectDescription');
const projectImageUrl = document.getElementById('projectImageUrl');
const projectImages = document.getElementById('projectImages');
const imagePreviewList = document.getElementById('imagePreviewList');
const adminPortfolioList = document.getElementById('adminPortfolioList');
const adminMessageList = document.getElementById('adminMessageList');
const saveProjectButton = document.getElementById('saveProjectButton');
const cancelEditButton = document.getElementById('cancelEditButton');
const resetProjectsButton = document.getElementById('resetProjectsButton');
const refreshMessagesButton = document.getElementById('refreshMessagesButton');
const clearMessagesButton = document.getElementById('clearMessagesButton');
const loginStatus = document.getElementById('loginStatus');
const passwordForm = document.getElementById('passwordForm');
const currentPassword = document.getElementById('currentPassword');
const newPassword = document.getElementById('newPassword');
const confirmPassword = document.getElementById('confirmPassword');
const updatePasswordButton = document.getElementById('updatePasswordButton');
const passwordStatus = document.getElementById('passwordStatus');
const adminNavButtons = document.querySelectorAll('[data-admin-section]');
const adminSections = document.querySelectorAll('[data-admin-panel]');

const MAX_IMAGE_BYTES = 1024 * 1024;
let projects = [];
let selectedImages = [];

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

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : { error: await response.text().catch(() => '') };
  if (!response.ok) {
    const message = data.error || `Request failed (${response.status})`;
    throw new Error(message.length > 180 ? `Request failed (${response.status})` : message);
  }
  return data;
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

function showLoginStatus(message) {
  if (!loginStatus) return;
  loginStatus.textContent = message;
  loginStatus.classList.remove('hidden');
}

function showPasswordStatus(message) {
  if (!passwordStatus) return;
  passwordStatus.textContent = message;
  passwordStatus.classList.remove('hidden');
}

function setActiveSection(sectionName) {
  adminSections.forEach((section) => {
    section.classList.toggle('hidden', section.dataset.adminPanel !== sectionName);
  });
  adminNavButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.adminSection === sectionName);
  });
}

async function loadProjects() {
  try {
    const data = await requestJson('/api/projects');
    projects = Array.isArray(data.projects) ? data.projects.map(normalizeProject) : [];
    renderAdminItems();
  } catch (error) {
    if (adminPortfolioList) {
      adminPortfolioList.innerHTML = `<p class="note form-error">Projects could not load: ${escapeHtml(error.message || 'Request failed')}</p>`;
    }
  }
}

async function saveProjects(nextProjects) {
  const data = await requestJson('/api/projects', {
    method: 'PUT',
    body: JSON.stringify({ projects: nextProjects.map(normalizeProject) }),
  });
  projects = data.projects.map(normalizeProject);
  renderAdminItems();
}

async function loadMessages() {
  if (adminMessageList) {
    adminMessageList.innerHTML = '<p class="note">Loading client messages...</p>';
  }

  try {
    const data = await requestJson('/api/messages');
    renderMessages(Array.isArray(data.messages) ? data.messages : []);
  } catch (error) {
    if (adminMessageList) {
      adminMessageList.innerHTML = `<p class="note form-error">Messages could not load: ${escapeHtml(error.message || 'Request failed')}</p>`;
    }
  }
}

function renderImagePreview() {
  if (!imagePreviewList) return;
  if (!selectedImages.length) {
    imagePreviewList.innerHTML = '<p class="note">No uploaded images selected. The Image URL will be used as the project cover.</p>';
    return;
  }

  imagePreviewList.innerHTML = selectedImages
    .map((image, index) => `
      <div class="upload-preview-item">
        <img src="${escapeHtml(image.preview || image.url)}" alt="Selected project image ${index + 1}" />
        <button type="button" data-index="${index}" class="removeUpload">Remove</button>
      </div>`)
    .join('');

  document.querySelectorAll('.removeUpload').forEach((button) => {
    button.addEventListener('click', () => {
      selectedImages = selectedImages.filter((_, index) => index !== Number(button.dataset.index));
      renderImagePreview();
    });
  });
}

function resetProjectForm() {
  projectForm.reset();
  editingIndex.value = '';
  selectedImages = [];
  saveProjectButton.textContent = 'Save Project';
  cancelEditButton.classList.add('hidden');
  renderImagePreview();
}

function renderAdminItems() {
  if (!adminPortfolioList) return;

  if (!projects.length) {
    adminPortfolioList.innerHTML = '<p class="note">No portfolio items yet. Add a project to publish it on the portfolio page.</p>';
    return;
  }

  adminPortfolioList.innerHTML = projects
    .map((item, index) => {
      const title = escapeHtml(item.title);
      const cover = escapeHtml(item.images?.[0] || item.imageUrl || 'images/project-default.svg');
      const description = escapeHtml(item.description);
      const bannerTitle = escapeHtml(item.bannerTitle || item.title);
      const count = item.images?.length || 1;

      return `
        <div class="project-item">
          <div class="project-card-heading">
            <img class="project-thumb" src="${cover}" alt="${title}" loading="lazy" />
            <div>
              <h3>${title}</h3>
              <p><strong>Slider:</strong> ${bannerTitle}</p>
              <p><strong>Images:</strong> ${count}</p>
              <p>${description}</p>
            </div>
          </div>
          <div class="project-actions">
            <button type="button" data-index="${index}" class="editProject">Edit</button>
            <button type="button" data-index="${index}" class="deleteProject">Delete</button>
          </div>
        </div>`;
    })
    .join('');

  document.querySelectorAll('.editProject').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      const item = projects[index];
      if (!item) return;

      editingIndex.value = String(index);
      projectTitle.value = item.title || '';
      projectBannerTitle.value = item.bannerTitle || '';
      projectBannerText.value = item.bannerText || '';
      projectBannerIcon.value = item.bannerIcon || '';
      projectDescription.value = item.description || '';
      projectImageUrl.value = item.imageUrl || '';
      selectedImages = (item.images || []).map((url) => ({ url, preview: url, uploaded: true }));
      saveProjectButton.textContent = 'Update Project';
      cancelEditButton.classList.remove('hidden');
      renderImagePreview();
      setActiveSection('projects');
      projectForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.querySelectorAll('.deleteProject').forEach((button) => {
    button.addEventListener('click', async () => {
      const next = projects.filter((_, index) => index !== Number(button.dataset.index));
      await saveProjects(next);
      resetProjectForm();
    });
  });
}

function renderMessages(messages) {
  if (!adminMessageList) return;

  if (!messages.length) {
    adminMessageList.innerHTML = '<p class="note">No client messages yet. Messages submitted through the contact form will appear here.</p>';
    return;
  }

  adminMessageList.innerHTML = messages
    .map((message) => {
      const name = escapeHtml(message.name);
      const email = escapeHtml(message.email);
      const body = escapeHtml(message.message);
      const createdAt = message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Unknown date';
      const id = escapeHtml(message.id);
      const attachments = Array.isArray(message.attachments) ? message.attachments : [];
      const attachmentMarkup = attachments.length
        ? `
          <div class="message-attachments">
            <strong>Attachments</strong>
            <div class="message-attachment-grid">
              ${attachments.map((file) => {
                const url = escapeHtml(file.url);
                const secureUrl = `/api/blob-file?url=${encodeURIComponent(file.url || '')}`;
                const fileName = escapeHtml(file.name || 'Attachment');
                const fileType = escapeHtml(file.type || 'File');
                const size = file.size ? `${Math.ceil(Number(file.size) / 1024)} KB` : fileType;
                const preview = String(file.type || '').startsWith('image/')
                  ? `<img src="${secureUrl}" alt="${fileName}" loading="lazy" />`
                  : `<span class="message-file-icon">FILE</span>`;
                return `
                  <a href="${secureUrl}" target="_blank" rel="noreferrer" class="message-attachment">
                    ${preview}
                    <span>${fileName}</span>
                    <small>${escapeHtml(size)}</small>
                  </a>`;
              }).join('')}
            </div>
          </div>`
        : '';

      return `
        <article class="message-item">
          <div>
            <span>${escapeHtml(createdAt)}</span>
            <h3>${name}</h3>
            <a href="mailto:${email}">${email}</a>
            <p>${body}</p>
            ${attachmentMarkup}
          </div>
          <button type="button" data-id="${id}" class="deleteMessage">Delete</button>
        </article>`;
    })
    .join('');

  document.querySelectorAll('.deleteMessage').forEach((button) => {
    button.addEventListener('click', async () => {
      await requestJson(`/api/messages?id=${encodeURIComponent(button.dataset.id)}`, { method: 'DELETE' });
      await loadMessages();
    });
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.readAsDataURL(file);
  });
}

async function uploadPendingImages() {
  const pending = selectedImages.filter((image) => !image.uploaded);
  const existing = selectedImages.filter((image) => image.uploaded).map((image) => image.url);
  if (!pending.length) return existing;

  const data = await requestJson('/api/upload', {
    method: 'POST',
    body: JSON.stringify({
      files: pending.map((image) => ({
        name: image.name,
        data: image.data,
      })),
    }),
  });

  return [...existing, ...(data.urls || [])];
}

async function showDashboard() {
  loginPanel.classList.add('hidden');
  dashboardPanel.classList.remove('hidden');
  setActiveSection('overview');
  renderImagePreview();
  await Promise.allSettled([loadProjects(), loadMessages()]);
}

function showLogin() {
  loginPanel.classList.remove('hidden');
  dashboardPanel.classList.add('hidden');
  adminPassword.value = '';
}

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await requestJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: adminPassword.value }),
    });
    await showDashboard();
  } catch (error) {
    showLoginStatus(error.message || 'Invalid credentials');
  }
});

logoutButton?.addEventListener('click', async () => {
  await requestJson('/api/auth/logout', { method: 'POST' }).catch(() => {});
  showLogin();
});

adminNavButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setActiveSection(button.dataset.adminSection);
    if (button.dataset.adminSection === 'messages') {
      loadMessages();
    }
  });
});

cancelEditButton?.addEventListener('click', resetProjectForm);

projectImages?.addEventListener('change', async () => {
  const files = Array.from(projectImages.files || []);
  const validFiles = files.filter((file) => file.type.startsWith('image/') && file.size <= MAX_IMAGE_BYTES);
  const images = await Promise.all(validFiles.map(async (file) => ({
    name: file.name,
    data: await readFileAsDataUrl(file),
    preview: URL.createObjectURL(file),
    uploaded: false,
  })));

  selectedImages = [...selectedImages, ...images];
  renderImagePreview();

  if (files.length !== validFiles.length) {
    window.alert('Some images were skipped. Use image files smaller than 1 MB each.');
  }
});

resetProjectsButton?.addEventListener('click', async () => {
  await saveProjects(defaultProjects);
  resetProjectForm();
});

clearMessagesButton?.addEventListener('click', async () => {
  clearMessagesButton.disabled = true;
  try {
    await requestJson('/api/messages', { method: 'DELETE' });
    await loadMessages();
  } catch (error) {
    if (adminMessageList) {
      adminMessageList.innerHTML = `<p class="note form-error">Messages could not be cleared: ${escapeHtml(error.message || 'Request failed')}</p>`;
    }
  } finally {
    clearMessagesButton.disabled = false;
  }
});

refreshMessagesButton?.addEventListener('click', async () => {
  refreshMessagesButton.disabled = true;
  try {
    await loadMessages();
  } finally {
    refreshMessagesButton.disabled = false;
  }
});

passwordForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (newPassword.value !== confirmPassword.value) {
    showPasswordStatus('New password and confirmation do not match.');
    return;
  }

  updatePasswordButton.disabled = true;
  updatePasswordButton.textContent = 'Updating...';

  try {
    await requestJson('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      }),
    });
    passwordForm.reset();
    showPasswordStatus('Password updated successfully. Use the new password next time you log in.');
  } catch (error) {
    showPasswordStatus(error.message || 'Could not update password.');
  } finally {
    updatePasswordButton.disabled = false;
    updatePasswordButton.textContent = 'Update Password';
  }
});

projectForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const title = projectTitle.value.trim();
  const description = projectDescription.value.trim();
  if (!title || !description) return;

  saveProjectButton.disabled = true;
  saveProjectButton.textContent = 'Saving...';

  try {
    const uploadedUrls = await uploadPendingImages();
    const urlImage = projectImageUrl.value.trim();
    const images = uploadedUrls.length ? uploadedUrls : [urlImage || 'images/project-default.svg'];
    const nextProject = {
      title,
      bannerTitle: projectBannerTitle.value.trim() || title,
      bannerText: projectBannerText.value.trim() || description,
      bannerIcon: projectBannerIcon.value.trim() || String(projects.length + 1).padStart(2, '0'),
      description,
      imageUrl: images[0],
      images,
    };

    const index = editingIndex.value === '' ? -1 : Number(editingIndex.value);
    const next = index >= 0
      ? projects.map((item, currentIndex) => (currentIndex === index ? nextProject : item))
      : [...projects, nextProject];

    await saveProjects(next);
    resetProjectForm();
  } finally {
    saveProjectButton.disabled = false;
    saveProjectButton.textContent = editingIndex.value === '' ? 'Save Project' : 'Update Project';
  }
});

requestJson('/api/auth/session')
  .then((data) => {
    if (data.authenticated) return showDashboard();
    return showLogin();
  })
  .catch(showLogin);
