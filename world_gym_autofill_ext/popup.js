const browser = window.browser || window.chrome;

const fields = [
  'email',
  'firstName',
  'lastName',
  'year',
  'gender',
  'street',
  'city',
  'state',
  'postal',
  'phone',
  'promo',
  'guestType'
];

// Load saved data when popup opens
browser.storage.local.get('formData').then(({ formData }) => {
  if (!formData) return;

  fields.forEach(f => {
    const el = document.getElementById(f);
    if (el && formData[f] !== undefined) {
      el.value = formData[f];
    }
  });
});

// Save data
document.getElementById('save').addEventListener('click', () => {
  const guestType = document.getElementById('guestType').value;

  if (!guestType) {
    alert('Please select a guest pass type.');
    return;
  }

  const formData = {};

  fields.forEach(f => {
    const el = document.getElementById(f);
    if (el) formData[f] = el.value;
  });

  browser.storage.local.set({ formData }).then(() => {
    console.log('[WG] Data saved');
  });
});