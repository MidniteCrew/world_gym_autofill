(() => {
  const browserApi = typeof browser !== 'undefined'
  ? browser
  : chrome;

  function waitFor(selector, callback) {
    const el = document.querySelector(selector);
    if (el) return callback(el);

    const obs = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (!found) return;
      obs.disconnect();
      callback(found);
    });

    obs.observe(document.body, { childList: true, subtree: true });
  }

  async function getFormData() {
    const { formData } = await browserApi.storage.local.get('formData');
    return formData || null;
  }

  function runAutofill() {
    waitFor('#Email', async () => {
      const formData = await getFormData();
      if (!formData) return;

      const $ = s => document.querySelector(s);

      $('#Email').value = formData.email || '';
      $('#FirstName').value = formData.firstName || '';
      $('#LastName').value = formData.lastName || '';
      $('#YearOfBirth').value = formData.year || '';
      $('#StreetAddress').value = formData.street || '';
      $('#City').value = formData.city || '';
      $('#StateProv').value = formData.state || '';
      $('#PostalCode').value = formData.postal || '';
      $('#PhoneMobile').value = formData.phone || '';
      $('#PromoCode').value = formData.promo || '';

      const guestType = $('#GuestPassType');
      if (guestType && formData.guestType) {
        guestType.value = formData.guestType;
        guestType.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const male = $('#GenderM');
      const female = $('#GenderF');

      if (male) male.checked = false;
      if (female) female.checked = false;

      if (formData.gender === 'M' && male) male.checked = true;
      if (formData.gender === 'F' && female) female.checked = true;

      male?.dispatchEvent(new Event('change', { bubbles: true }));
      female?.dispatchEvent(new Event('change', { bubbles: true }));

      console.log('[WG - autofill] Autofill applied');
    });
  }

  // Run on page load
  runAutofill();

  // Re-run when popup data changes
  browserApi.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.formData) {
      runAutofill();
    }
  });
})();