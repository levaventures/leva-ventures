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

  // Explicitly allowlisted, non-personal attribution is included ONLY if a
  // visitor voluntarily submits the opportunity form. Never read financial
  // fields or forward referrer URLs, query-string contents, cookies or IDs.
  const attribution = new URLSearchParams(window.location.search);
  const allowedOrigins = new Set(['calculator', 'financing_desk_v2', 'debt_sizing_article']);
  const allowedChannels = new Set(['linkedin', 'sior', 'cre_news_today', 'crej', 'partner_newsletter', 'industry_referral', 'organic_search']);
  const origin = attribution.get('lv_origin');
  const channel = attribution.get('lv_channel');

  function addFixedLabel(name, value) {
    const field = document.createElement('input');
    field.type = 'hidden';
    field.name = name;
    field.value = value;
    form.appendChild(field);
  }

  if (allowedOrigins.has(origin)) addFixedLabel('lead_origin', origin);
  if (allowedOrigins.has(origin) && allowedChannels.has(channel)) addFixedLabel('lead_channel', channel);

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
