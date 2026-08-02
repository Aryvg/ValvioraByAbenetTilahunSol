export async function registerHandler(fields, validateField) {
          const usernameMsg = document.getElementById('email-msg');
          let allValid = true;// means assume everything is correct unless we find a problem
    
          // Validate every field first (username presence only; availability is checked separately)
          fields.forEach(field => {
            const isValid = validateField(field);// check each field using validateFiled function
            if (!isValid) {// if the validField function is invalid, make the form invalid
              allValid = false;
    
              // If empty, show red warning
              const input = document.getElementById(field.id);
              const msg = document.getElementById(field.msg);
              if (input.value.trim() === "") {
                msg.textContent = `❌ Please fill ${field.name}`;
                msg.style.color = 'red';
              }
            }
          });
    
          if (!allValid) return; // Stop submission if any field is invalid
          // Replace create account text with a rotating spinner so user sees progress
          const createBtn = document.querySelector('.js-create-account-button');
          let _origBtnHTML, _origBtnDisabled;
          if (createBtn) {
            _origBtnHTML = createBtn.innerHTML;
            _origBtnDisabled = createBtn.disabled;
            createBtn.disabled = true;
            createBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 50 50" style="vertical-align:middle;margin-right:8px;"><path fill="currentColor" d="M43.935,25.145c0-10.318-8.356-18.686-18.686-18.686c-10.329,0-18.686,8.368-18.686,18.686h4.068c0-8.07,6.548-14.617,14.617-14.617 c8.07,0,14.617,6.547,14.617,14.617H43.935z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite"/></path></svg>Processing...';
          }

          try {
          const username = document.getElementById('email').value.trim();
          const profilePictureFile = document.getElementById('pfpInput').files[0];
          if (!profilePictureFile) {
            const msg = document.getElementById('profile-error');
            if (msg) { msg.textContent = '❌ Please select a profile picture'; msg.style.color = 'red'; }
            return;
          }
          const pwd = document.getElementById('password').value.trim();
          const firstname = document.getElementById('fname').value.trim();
          const lastname = document.getElementById('lname').value.trim();
          const age = document.getElementById('age').value.trim();
          const country = document.getElementById('country').value.trim();
          const confirm = document.getElementById('confirm').value.trim();
    
            // Re-check availability right before submit and block if taken
            try {
              const r = await fetch(`https://valviorabackend2.onrender.com/registered/exists?user=${encodeURIComponent(username)}`);// checks if username exists among finalized registrations
              if (r.ok) {
                const j = await r.json();
                if (j.exists) {// if username exists
                  usernameMsg.textContent = '❌ username already taken';
                  usernameMsg.style.color = 'red';
                  return; // block submission
                }
              }
            } catch (e) {
              console.error('availability check failed', e);
            }
            try {// send data to backend
              const formData = new FormData();
              formData.append('user', username);
              formData.append('pwd', pwd);
              formData.append('profilePicture', profilePictureFile);
              formData.append('firstname', firstname);
              formData.append('lastname', lastname);
              formData.append('age', age);
              formData.append('country', country);
              formData.append('confirm', confirm);

              const res = await fetch('https://valviorabackend2.onrender.com/register', {
              method: 'POST',
              credentials: 'include',// this allows cookies to be stored and sent
              body: formData
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {// if the request or register did not succeed
              const msg = document.getElementById('profile-error');
              if (msg) { msg.textContent = json.message || `Registration failed (${res.status}).`; msg.style.color = 'red'; }
              return;
            }

            // Registration succeeded and the verification email was sent.
            // NOTE: the account only becomes a real, loggable-in account once
            // the code below is verified (it currently lives in the "pending"
            // collection, not Registered) - so there's no point trying to log
            // in yet. Just show the verify-code modal.
            const verifyModal = document.getElementById('verifyModal');
            if (verifyModal) verifyModal.style.display = 'flex';
            const signupForm = document.getElementById('signupForm');
            if (signupForm) signupForm.style.display = 'none';

            return json;
            } catch (err) {
              console.error(err);
            }
          } finally {
            if (createBtn) {
              createBtn.disabled = _origBtnDisabled;
              createBtn.innerHTML = _origBtnHTML;
            }
          }
}
