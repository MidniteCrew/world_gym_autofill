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

  // 1. Check agreements reliably (works for plain + React-controlled checkboxes)
  function clickAgreement(inputSelector) {
    const input = document.querySelector(inputSelector);
    if (!input) return false;

    // If it's disabled, we can't toggle it.
    if (input.disabled) return false;

    // If already checked then done.
    if (input.checked === true) return true;

    // user-like click
    try {
      input.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
      input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      input.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse' }));
      input.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      input.click();
    } catch (_) {
      // ignore
    }

    if (input.checked === true) return true;
    const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
    const nativeCheckedSetter = desc && typeof desc.set === 'function' ? desc.set : null;

    if (nativeCheckedSetter) {
      nativeCheckedSetter.call(input, true);
    } else {
      input.checked = true;
    }

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    const clickable = input.closest('label') || input.parentElement;
    if (clickable) {
      try {
        clickable.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      } catch (_) {
        // ignore
      }
    }

    // final check
    return input.checked === true;
  }

  function runAutofill() {
    waitFor('#Email', async () => {
      const formData = await getFormData();
      if (!formData) return;

      const $ = s => document.querySelector(s);

      // ---- Text fields ----
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

      // ---- Guest type ----
      const guestType = $('#GuestPassType');
      if (guestType && formData.guestType) {
        guestType.value = formData.guestType;
        guestType.dispatchEvent(new Event('input', { bubbles: true }));
        guestType.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // ---- Gender ----
      const male = $('#GenderM');
      const female = $('#GenderF');

      if (male) male.checked = false;
      if (female) female.checked = false;

      if (formData.gender === 'M' && male) male.checked = true;
      if (formData.gender === 'F' && female) female.checked = true;

      male?.dispatchEvent(new Event('change', { bubbles: true }));
      female?.dispatchEvent(new Event('change', { bubbles: true }));

      // ---- Agreements ----
      const agreementSelectors = [
        '#GuestServicesAgreement1',
        '#GuestServicesAgreement2',
        '#GuestServicesAgreement3',
        '#Agreement'
      ];

      let attempts = 0;
      const maxAttempts = 12;

      const interval = setInterval(() => {
        attempts++;

        const results = agreementSelectors.map(sel => {
          const el = document.querySelector(sel);
          return el ? clickAgreement(sel) : false;
        });

        const allChecked = results.every(Boolean);

        if (allChecked || attempts >= maxAttempts) {
          clearInterval(interval);
          console.log(
            '[WG - autofill]',
            allChecked ? 'Agreements checked' : 'Agreements not fully clickable'
          );
        }
      }, 250);

      console.log('[WG - autofill] Autofill applied');
    });
  }

  // init run
  runAutofill();

  // re-run when popup data changes
  browserApi.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.formData) {
      runAutofill();
    }
  });
})();