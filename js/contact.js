const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
const contactAttachments = document.getElementById('contactAttachments');
const contactAttachmentPreview = document.getElementById('contactAttachmentPreview');

const MAX_ATTACHMENT_BYTES = 1024 * 1024;
const MAX_ATTACHMENTS = 3;
let selectedAttachments = [];

function setStatus(message, isError = false) {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.classList.remove('hidden');
  formStatus.classList.toggle('form-error', isError);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.readAsDataURL(file);
  });
}

function renderAttachmentPreview() {
  if (!contactAttachmentPreview) return;

  if (!selectedAttachments.length) {
    contactAttachmentPreview.innerHTML = '<p class="note">No files attached.</p>';
    return;
  }

  contactAttachmentPreview.innerHTML = selectedAttachments
    .map((file, index) => `
      <div class="attachment-preview-item">
        <span>${file.name}</span>
        <small>${Math.ceil(file.size / 1024)} KB</small>
        <button type="button" data-index="${index}" class="removeContactAttachment">Remove</button>
      </div>`)
    .join('');

  document.querySelectorAll('.removeContactAttachment').forEach((button) => {
    button.addEventListener('click', () => {
      selectedAttachments = selectedAttachments.filter((_, index) => index !== Number(button.dataset.index));
      renderAttachmentPreview();
    });
  });
}

contactAttachments?.addEventListener('change', async () => {
  const files = Array.from(contactAttachments.files || []);
  const validFiles = files
    .filter((file) => file.size <= MAX_ATTACHMENT_BYTES)
    .slice(0, MAX_ATTACHMENTS - selectedAttachments.length);

  const nextFiles = await Promise.all(validFiles.map(async (file) => ({
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    data: await readFileAsDataUrl(file),
  })));

  selectedAttachments = [...selectedAttachments, ...nextFiles].slice(0, MAX_ATTACHMENTS);
  renderAttachmentPreview();

  if (files.length !== validFiles.length) {
    setStatus('Some attachments were skipped. Use up to 3 files smaller than 1 MB each.', true);
  }

  contactAttachments.value = '';
});

contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const payload = {
    name: String(formData.get('name') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    message: String(formData.get('message') || '').trim(),
    attachments: selectedAttachments,
  };

  if (!payload.name || !payload.email || !payload.message) return;

  const submitButton = contactForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Sending...';

  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail = data.detail ? ` (${data.detail})` : '';
      throw new Error(`${data.error || 'Message could not be sent'}${detail}`);
    }

    contactForm.reset();
    selectedAttachments = [];
    renderAttachmentPreview();
    setStatus('Message sent successfully. I will reply as soon as possible.');
  } catch (error) {
    setStatus(`${error.message || 'Message could not be sent right now.'} Please email me directly.`, true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Send Message';
  }
});
