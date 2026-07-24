import { userHasChannelBool } from '../channelApi.js';
import { uploadEmployee } from './postRequest.js';

(async () => {
   try {
      if (await userHasChannelBool()) location.replace('dashboard.html');
   } catch (e) {}
})();

function showError(el, msg) {
   let next = el.nextElementSibling;
   if (!next || !next.classList || !next.classList.contains('cc-error')) {
      next = document.createElement('div');
      next.className = 'cc-error';
      next.style.color = '#c0392b';
      next.style.fontSize = '13px';
      next.style.marginTop = '6px';
      el.parentNode.insertBefore(next, el.nextSibling);
   }
   next.textContent = msg;
}

function clearError(el) {
   const next = el.nextElementSibling;
   if (next && next.classList && next.classList.contains('cc-error')) next.textContent = '';
}

function validateInputs() {
   const name = document.getElementById('cName');
   const type = document.getElementById('cType');
   const desc = document.getElementById('cDesc');
   const pfp = document.getElementById('cPfp');
   const banner = document.getElementById('cBanner');
   const contact = document.getElementById('cContact');

   let ok = true;
   // clear previous errors
   [name, type, desc, pfp, banner, contact].forEach(el => el && clearError(el));

   if (!name || !name.value.trim()) { showError(name, 'Fill this input'); ok = false; }
   if (!type || !type.value.trim()) { showError(type, 'Fill this input'); ok = false; }
   if (!desc || !desc.value.trim()) { showError(desc, 'Fill this input'); ok = false; }
   if (!pfp || !pfp.files || !pfp.files[0]) { showError(pfp, 'Select a profile picture'); ok = false; }
   if (!banner || !banner.files || !banner.files[0]) { showError(banner, 'Select a channel banner'); ok = false; }
   if (!contact || !contact.value.trim()) { showError(contact, 'Fill this input'); ok = false; }
   else {
      const email = contact.value.trim().toLowerCase();
      if (!email.endsWith('@gmail.com')) { showError(contact, 'Email must end with @gmail.com'); ok = false; }
   }

   // length validations
   try {
      if (name && name.value && name.value.trim().length > 50) { showError(name, 'Must not be more than 50 characters'); ok = false; }
      if (type && type.value && type.value.trim().length > 50) { showError(type, 'Must not be more than 50 characters'); ok = false; }
      if (desc && desc.value && desc.value.trim().length > 200) { showError(desc, 'Must not be more than 200 characters'); ok = false; }
      if (contact && contact.value && contact.value.trim().length > 70) { showError(contact, 'Must not be more than 70 characters'); ok = false; }
   } catch (e) {}

   return ok;
}

const createBtn = document.querySelector('.js-create-channel');
if (createBtn) {
   createBtn.addEventListener('click', async (e) => {
      if (!validateInputs()) return;
      const original = createBtn.innerHTML;
      createBtn.disabled = true;
      createBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 50 50" style="vertical-align:middle;margin-right:8px"><path fill="#fff" d="M43.935,25.145c0-10.318-8.364-18.682-18.682-18.682c-10.318,0-18.682,8.364-18.682,18.682h4.068c0-8.064,6.55-14.614,14.614-14.614c8.064,0,14.614,6.55,14.614,14.614H43.935z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite"/></path></svg>Creating...';
      try {
         await uploadEmployee();
      } finally {
         createBtn.disabled = false;
         createBtn.innerHTML = original;
      }
   });
}

// If there's a separate account-creation button elsewhere, validate email domain on click
const acctBtn = document.querySelector('.js-create-account-button');
if (acctBtn) {
   acctBtn.addEventListener('click', (e)=>{
      const contact = document.getElementById('cContact');
      if (!contact) return;
      clearError(contact);
      const val = contact.value && contact.value.trim();
      if (!val) { showError(contact, 'Fill this input'); return; }
      if (!val.toLowerCase().endsWith('@gmail.com')) { showError(contact, 'Email must end with @gmail.com'); return; }
   });
}

// add live validation clearing and length checks
['cName','cType','cDesc','cPfp','cBanner','cContact'].forEach(id=>{
   const el = document.getElementById(id);
   if (!el) return;
   const evt = el.tagName === 'INPUT' && el.type === 'file' ? 'change' : 'input';
   el.addEventListener(evt, ()=>{
      clearError(el);
      // determine max length either from data-maxlen or maxlength property
      const maxAttr = el.dataset && el.dataset.maxlen ? parseInt(el.dataset.maxlen,10) : (el.maxLength || -1);
      const maxLen = Number.isFinite(maxAttr) ? maxAttr : -1;
      if (maxLen > 0) {
         const val = el.tagName === 'SELECT' ? (el.value || '') : (el.value || '').trim();
         if (val.length > maxLen) showError(el, `Must not be more than ${maxLen} characters`);
      }
   });
});