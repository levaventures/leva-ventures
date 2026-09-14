document.addEventListener('DOMContentLoaded', () => {
  const source = document.getElementById('referral_source');
  const referredBy = document.getElementById('referred_by');

  if (source && referredBy) {
    source.addEventListener('change', () => {
      if (source.value === 'Not Applicable') {
        referredBy.value = 'N/A';
      } else if (referredBy.value.trim().toUpperCase() === 'N/A') {
        referredBy.value = '';
      }
    });
  }

  const form = document.getElementById('contact-form');
  if (!form) return;

  const success = document.querySelector('[data-fs-success]');
  const submitButton = form.querySelector('[data-fs-submit-btn]');
  const originalButtonText = submitButton ? submitButton.textContent : '';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const honeypot = form.querySelector('input[name="_gotcha"]');
    if (honeypot && honeypot.value) return;

    const turnstileToken = form.querySelector('[name="cf-turnstile-response"]');
    if (!turnstileToken || !turnstileToken.value) {
      window.alert('Please complete the security verification before submitting.');
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      submitButton.textContent = 'Submitting...';
    }

    try {
      const response = await fetch(form.action, {
        method: form.method || 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        const err = new Error('Form submission failed');
        err.status = response.status;
        throw err;
      }

      form.reset();
      form.style.display = 'none';

      if (success) {
        success.setAttribute('data-fs-active', '');
        success.setAttribute('role', 'status');
        success.setAttribute('aria-live', 'polite');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (error) {
      const message = error && error.status === 429
        ? 'We are receiving a high number of submissions. Please wait a moment and try again.'
        : 'We could not submit your opportunity at this time. Please try again shortly.';
      window.alert(message);
    } finally {
      if (submitButton && form.style.display !== 'none') {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
        submitButton.textContent = originalButtonText;
      }
    }
  });
});
