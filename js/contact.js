const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

function setStatus(message, isError = false) {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.classList.remove('hidden');
  formStatus.classList.toggle('form-error', isError);
}

contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const payload = {
    name: String(formData.get('name') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    message: String(formData.get('message') || '').trim(),
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

    if (!response.ok) throw new Error('Message could not be sent');

    contactForm.reset();
    setStatus('Message sent successfully. I will reply as soon as possible.');
  } catch (error) {
    setStatus('Message could not be sent right now. Please email me directly.', true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Send Message';
  }
});
