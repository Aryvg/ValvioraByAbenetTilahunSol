import { registerHandler } from './registerHandler.js';
import { validateField } from './validateField.js';
import './checkUsernameAvailability.js';
import './checkLogin.js';
import './checkAuthOnLoad.js';
import { isStrongPassword } from './CheckPwdStrength.js';
import { setAccessToken, clearAccessToken } from '../authToken.js';





const countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
    "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin",
    "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
    "Burkina Faso", "Burundi",
    "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile",
    "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus",
    "Czech Republic",
    "Denmark", "Djibouti", "Dominica", "Dominican Republic",
    "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini",
    "Ethiopia",
    "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala",
    "Guinea", "Guinea-Bissau", "Guyana",
    "Haiti", "Honduras", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
    "Jamaica", "Japan", "Jordan",
    "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
    "Luxembourg",
    "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
    "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia",
    "Montenegro", "Morocco", "Mozambique", "Myanmar",
    "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria",
    "North Korea", "North Macedonia", "Norway",
    "Oman",
    "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines",
    "Poland", "Portugal",
    "Qatar",
    "Romania", "Russia", "Rwanda",
    "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa",
    "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
    "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
    "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname",
    "Sweden", "Switzerland", "Syria",
    "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga",
    "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
    "Uzbekistan",
    "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
    "Yemen",
    "Zambia", "Zimbabwe"
];
const countrySelect = document.getElementById("country");// this finds the select 

countries.forEach(country => {
    const option = document.createElement("option");// means create <option></option> in select button.
    option.value = country;// makes the value in the option country which is what we looped so that it can be <option value="Ethiopia"></option>
    option.textContent = country;// makes it <option value="Ethiopia">Ethiopia</option>
    countrySelect.appendChild(option);// this means add it to the select button
});

const fields = [
    { id: 'pfpInput', msg: 'profile-error', name: 'your profile picture' },
    { id: 'fname', msg: 'first-msg', name: 'firstname' },
    { id: 'lname', msg: 'last-msg', name: 'lastname' },
    { id: 'age', msg: 'age-msg', name: 'age' },
    { id: 'country', msg: 'country-msg', name: 'country' },
    { id: 'email', msg: 'email-msg', name: 'email' },
    { id: 'password', msg: 'password-msg', name: 'password' },
    { id: 'confirm', msg: 'confirm-msg', name: 'confirm' }
];

fields.forEach(field => {
    const input = document.getElementById(field.id);
    input.addEventListener('input', () => validateField(field));// live check while typing
    input.addEventListener('change', () => validateField(field));
    //check again when the user leaves field
});

// stops here
const authCard = document.getElementById('authCard');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

function toggleView(view) {
    if (view === 'signup') {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        authCard.classList.add('signup-mode');
        document.getElementById('formTitle').innerText = 'Join Youtube';
    } else {
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
        authCard.classList.remove('signup-mode');
        document.getElementById('formTitle').innerText = 'Sign in';
    }
}

// Remove inline onclicks and add event listeners
document.addEventListener('DOMContentLoaded', () => {
    const createAccountBtn = document.getElementById('createAccountBtn');
    if (createAccountBtn) {
        createAccountBtn.addEventListener('click', () => toggleView('signup'));
    }
    const signInInsteadBtn = document.getElementById('signInInsteadBtn');
    if (signInInsteadBtn) {
        signInInsteadBtn.addEventListener('click', () => toggleView('login'));
    }
    const completeRegistrationBtn = document.querySelector('.completeRegistrationBtn') || document.getElementById('completeRegistrationBtn');
    if (completeRegistrationBtn) {
        completeRegistrationBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const btn = completeRegistrationBtn;
            const origHTML = btn.innerHTML;
            const origDisabled = btn.disabled;
            btn.disabled = true;
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 50 50" style="vertical-align:middle;margin-right:8px;"><path fill="currentColor" d="M43.935,25.145c0-10.318-8.356-18.686-18.686-18.686c-10.329,0-18.686,8.368-18.686,18.686h4.068c0-8.07,6.548-14.617,14.617-14.617 c8.07,0,14.617,6.547,14.617,14.617H43.935z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite"/></path></svg>Processing...';
            try {
                await finishSignup();
            } finally {
                // restore only if element still exists in DOM
                if (btn && btn.parentNode) {
                    btn.disabled = origDisabled;
                    btn.innerHTML = origHTML;
                }
            }
        });
    }
});

document.getElementById('pfpInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('pfpPreview').innerHTML = `<img src="${event.target.result}">`;
        };
        reader.readAsDataURL(file);
    }
});

function validate(input) {
    const error = input.nextElementSibling;
    if (!input.value.trim()) {
        error.style.display = 'flex';
        input.style.borderColor = 'var(--error-red)';
        return false;
    } else {
        error.style.display = 'none';
        input.style.borderColor = 'var(--border-color)';
        return true;
    }
}

signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    let isValid = true;
    const values = signupForm.querySelectorAll('input:not([type="file"]), select');

    values.forEach(f => { if (!validate(f)) isValid = false; });

    if (!isValid) {
        return;
    }

    try {
        await registerHandler(fields, validateField);
    } catch (err) {
        console.error('Registration submit failed', err);
    }
});

// Password recovery flow (send reset code and verify) handled here
let _recoveryEmailCached = null;
document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgotPasswordForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('recoveryEmail');
            const email = emailInput ? emailInput.value.trim() : '';
            // Client-side length check (enforced again on server)
            if (email.length > 50) {
                const err = emailInput.parentElement.querySelector('.error-msg');
                if (err) { err.textContent = 'the email should not be more than 50 characters'; err.style.display = 'flex'; }
                const btn = forgotForm.querySelector('.js-send-link-btn'); if (btn) btn.disabled = true;
                return;
            }
            if (!email) {
                const err = emailInput.parentElement.querySelector('.error-msg');
                if (err) { err.textContent = 'Enter a valid email address'; err.style.display = 'flex'; }
                const btn = forgotForm.querySelector('.js-send-link-btn'); if (btn) btn.disabled = true;
                return;
            }
            // enforce @gmail.com domain (case-insensitive)
            if (!String(email).toLowerCase().endsWith('@gmail.com')) {
                const err = emailInput.parentElement.querySelector('.error-msg');
                if (err) { err.textContent = 'the email is not valid'; err.style.display = 'flex'; }
                const btn = forgotForm.querySelector('.js-send-link-btn'); if (btn) btn.disabled = true;
                return;
            }

            const btn = forgotForm.querySelector('.js-send-link-btn');
            const origText = btn ? btn.innerHTML : null;
            try {
                if (btn) { btn.disabled = true; btn.innerHTML = 'Sending...'; }
                const res = await fetch('https://valviorabackend2.onrender.com/registered/reset-request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const json = await res.json().catch(() => ({}));
                if (res.ok) {
                    _recoveryEmailCached = email;
                    const modal = document.getElementById('resetVerifyModal');
                    if (modal) modal.style.display = 'flex';
                } else {
                    const err = json.message || 'Failed to send code.';
                    alert(err);
                }
            } catch (err) {
                console.error(err);
                alert('Network error.');
            } finally {
                if (btn) { btn.disabled = false; if (origText) btn.innerHTML = origText; }
            }
        });

        // Live validation: limit length to 50, enforce domain and show explicit message
        const recoveryInput = document.getElementById('recoveryEmail');
        const sendBtnLive = forgotForm.querySelector('.js-send-link-btn');
        if (recoveryInput) {
            const errEl = recoveryInput.parentElement.querySelector('.error-msg');
            const applyState = (v) => {
                const trimmed = String(v || '').trim();
                const lower = String(trimmed).toLowerCase();
                if (trimmed.length > 50) {
                    if (errEl) { errEl.textContent = 'the email should not be more than 50 characters'; errEl.style.display = 'flex'; }
                    if (sendBtnLive) sendBtnLive.disabled = true;
                } else if (trimmed.length === 0) {
                    if (errEl) { errEl.textContent = 'Enter a valid email address'; errEl.style.display = 'flex'; }
                    if (sendBtnLive) sendBtnLive.disabled = true;
                } else if (!lower.endsWith('@gmail.com')) {
                    if (errEl) { errEl.textContent = 'the email is not valid'; errEl.style.display = 'flex'; }
                    if (sendBtnLive) sendBtnLive.disabled = true;
                } else {
                    if (errEl) { errEl.textContent = 'Enter a valid email address'; errEl.style.display = 'none'; }
                    if (sendBtnLive) sendBtnLive.disabled = false;
                }
            };
            recoveryInput.addEventListener('input', () => applyState(recoveryInput.value));
            applyState(recoveryInput.value);
        }
    }

    const cancelReset = document.getElementById('cancelResetVerifyBtn');
    if (cancelReset) cancelReset.addEventListener('click', () => {
        const modal = document.getElementById('resetVerifyModal');
        if (modal) modal.style.display = 'none';
    });

    const confirmReset = document.getElementById('confirmResetCodeBtn');
    const resetCodeInput = document.getElementById('resetVerifyCode');
    const resetModalErrorEl = document.getElementById('resetModalError');

    // Re-enable the button and hide error when the user edits the code
    if (resetCodeInput) {
        resetCodeInput.addEventListener('input', () => {
            if (resetModalErrorEl) resetModalErrorEl.style.display = 'none';
            if (confirmReset) confirmReset.disabled = false;
        });
    }

    if (confirmReset) confirmReset.addEventListener('click', async () => {
        const code = resetCodeInput ? resetCodeInput.value.trim() : '';
        if (!code || !_recoveryEmailCached) {
            if (resetModalErrorEl) {
                resetModalErrorEl.textContent = 'Please enter the code';
                resetModalErrorEl.style.display = 'flex';
            }
            return;
        }

        // show processing state
        const origHTML = confirmReset ? confirmReset.innerHTML : null;
        const origDisabled = confirmReset ? confirmReset.disabled : false;
        if (confirmReset) {
            confirmReset.disabled = true;
            confirmReset.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 50 50" style="vertical-align:middle;margin-right:8px;"><path fill="currentColor" d="M43.935,25.145c0-10.318-8.356-18.686-18.686-18.686c-10.329,0-18.686,8.368-18.686,18.686h4.068c0-8.07,6.548-14.617,14.617-14.617 c8.07,0,14.617,6.547,14.617,14.617H43.935z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite"/></path></svg>Processing...';
        }

        try {
            const res = await fetch('https://valviorabackend2.onrender.com/registered/reset-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: _recoveryEmailCached, code })
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                // hide modal and show reset form (ensure forgot form is hidden so it doesn't overlap)
                const resetVerifyModal = document.getElementById('resetVerifyModal');
                const resetPasswordFormEl = document.getElementById('resetPasswordForm');
                const forgotFormEl = document.getElementById('forgotPasswordForm');
                if (resetVerifyModal) resetVerifyModal.style.display = 'none';
                
                if (forgotFormEl) forgotFormEl.style.display = 'none';
                if (resetPasswordFormEl) resetPasswordFormEl.style.display = 'block';
                // update titles to match reset flow
                try { document.getElementById('formTitle').innerText = 'Reset Password'; } catch (e) {}
                try { document.getElementById('formSubTitle').innerText = 'Create a strong, new password'; } catch (e) {}
                try { sessionStorage.setItem('passwordResetEmail', _recoveryEmailCached); } catch (e) {}
                // focus the first password field for usability
                try { const np = document.getElementById('newPass'); if (np) np.focus(); } catch (e) {}
            } else {
                // Keep button disabled until user edits the code to retry
                if (resetModalErrorEl) {
                    resetModalErrorEl.textContent = json.message || 'The verification code does not match.';
                    resetModalErrorEl.style.display = 'flex';
                }
                if (confirmReset) {
                    confirmReset.disabled = true;
                    if (origHTML !== null) confirmReset.innerHTML = origHTML;
                }
            }
        } catch (err) {
            console.error(err);
            if (resetModalErrorEl) {
                resetModalErrorEl.textContent = 'Network error.';
                resetModalErrorEl.style.display = 'flex';
            }
            // on network error allow user to try again
            if (confirmReset) {
                confirmReset.disabled = false;
                if (origHTML !== null) confirmReset.innerHTML = origHTML;
            }
        }
        // restore original innerHTML if it wasn't already restored by branches
        try {
            if (confirmReset && origHTML !== null && confirmReset.innerHTML.indexOf('Processing') !== -1) {
                confirmReset.innerHTML = origHTML;
                confirmReset.disabled = origDisabled;
            }
        } catch (e) {}
    });

    // Reset password form: live-match check and submission guard
    const resetFormEl = document.getElementById('resetPasswordForm');
    if (resetFormEl) {
        // Show a modern success modal; callback invoked after dismiss
        const showSuccessModal = (message, onClose) => {
            try {
                const overlay = document.getElementById('successModal');
                const desc = document.getElementById('successModalDesc');
                const closeBtn = document.getElementById('successModalCloseBtn');
                if (!overlay) return typeof onClose === 'function' && onClose();
                if (desc) desc.textContent = message || 'You have successfully reset your password.';
                overlay.classList.add('show');
                overlay.setAttribute('aria-hidden', 'false');

                const hide = () => {
                    overlay.classList.remove('show');
                    overlay.setAttribute('aria-hidden', 'true');
                    overlay.removeEventListener('click', overlayHandler);
                    if (closeBtn) closeBtn.removeEventListener('click', closeHandler);
                    if (typeof onClose === 'function') onClose();
                };

                const overlayHandler = (e) => {
                    if (e.target === overlay) hide();
                };
                const closeHandler = () => hide();

                overlay.addEventListener('click', overlayHandler);
                if (closeBtn) closeBtn.addEventListener('click', closeHandler);
                // auto-dismiss after 3.2s to keep UX snappy (optional)
                setTimeout(hide, 3200);
            } catch (e) { if (typeof onClose === 'function') onClose(); }
        };
        const newPassInput = document.getElementById('newPass');
        const confirmNewPassInput = document.getElementById('confirmNewPass');
        const resetBtn = resetFormEl.querySelector('button[type="submit"]');
        const confirmErrEl = confirmNewPassInput && confirmNewPassInput.parentElement ? confirmNewPassInput.parentElement.querySelector('.error-msg') : null;

        // hide any existing message by default
        if (confirmErrEl) { confirmErrEl.style.display = 'none'; }

        // updateState decides whether to show the mismatch message; pass true
        // when the change event originated from the confirm input so the
        // message appears only while typing in confirm.
        const updateState = (showMessageOnlyWhenFromConfirm = false) => {
            const a = newPassInput ? newPassInput.value : '';
            const b = confirmNewPassInput ? confirmNewPassInput.value : '';
            const strong = isStrongPassword(String(a));
            const match = a === b && a.length > 0;
            const maxLen = 12;

            // length checks
            const newTooLong = a.length > maxLen;
            const confirmTooLong = b.length > maxLen;

            // disable button if mismatch or either too long
            if (resetBtn) resetBtn.disabled = !match || newTooLong || confirmTooLong || !strong;

            // show length error under new password if too long
            const newErrEl = newPassInput && newPassInput.parentElement ? newPassInput.parentElement.querySelector('.error-msg') : null;
            if (newErrEl) {
                if (newTooLong) {
                    newErrEl.textContent = `Password must be ${maxLen} characters or less`;
                    newErrEl.style.display = 'flex';
                } else if (!strong && a.length > 0) {
                    newErrEl.textContent = 'Password is not strong';
                    newErrEl.style.display = 'flex';
                } else {
                    newErrEl.style.display = 'none';
                }
            }

            // show message under confirm: length error has higher priority, otherwise mismatch shown only when typing in confirm
            if (confirmErrEl) {
                if (confirmTooLong) {
                    confirmErrEl.textContent = `Password must be ${maxLen} characters or less`;
                    confirmErrEl.style.display = 'flex';
                } else if (!match && b.length > 0 && showMessageOnlyWhenFromConfirm) {
                    confirmErrEl.textContent = 'Passwords do not match';
                    confirmErrEl.style.display = 'flex';
                } else {
                    confirmErrEl.style.display = 'none';
                }
            }
        };

        if (newPassInput) newPassInput.addEventListener('input', () => updateState(false));
        if (confirmNewPassInput) confirmNewPassInput.addEventListener('input', () => updateState(true));

        // Handle form submission: validate and send password update to server
        resetFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const a = newPassInput ? newPassInput.value : '';
            const b = confirmNewPassInput ? confirmNewPassInput.value : '';
            const strong = isStrongPassword(String(a));
            const maxLen = 12;
            if (a !== b) {
                if (confirmErrEl) { confirmErrEl.textContent = 'Passwords do not match'; confirmErrEl.style.display = 'flex'; }
                if (resetBtn) resetBtn.disabled = true;
                return;
            }
            if (!strong) {
                const newErrEl = newPassInput && newPassInput.parentElement ? newPassInput.parentElement.querySelector('.error-msg') : null;
                if (newErrEl) { newErrEl.textContent = 'Password is not strong'; newErrEl.style.display = 'flex'; }
                if (resetBtn) resetBtn.disabled = true;
                return;
            }
            if (String(a).length > maxLen || String(b).length > maxLen) {
                if (confirmErrEl) { confirmErrEl.textContent = `Password must be ${maxLen} characters or less`; confirmErrEl.style.display = 'flex'; }
                if (resetBtn) resetBtn.disabled = true;
                return;
            }

            // identify account email from reset flow (sessionStorage set earlier)
            const email = (function(){ try { return sessionStorage.getItem('passwordResetEmail') || _recoveryEmailCached || null } catch(e){ return _recoveryEmailCached || null }})();
            if (!email) {
                alert('No account email found for password reset. Please re-request a reset.');
                return;
            }

            if (resetBtn) {
                resetBtn.disabled = true;
                var origHTML = resetBtn.innerHTML;
                resetBtn.innerHTML = 'Processing...';
            }

            try {
                const res = await fetch('https://valviorabackend2.onrender.com/registered', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: String(email), password: String(a) })
                });
                const json = await res.json().catch(() => ({}));
                if (res.ok) {
                    const msg = json.message || 'You have successfully reset your password.';
                    showSuccessModal(msg, () => {
                        try { document.getElementById('formTitle').innerText = 'Sign in'; } catch(e){}
                        try { document.getElementById('formSubTitle').innerText = 'to continue to Youtube'; } catch(e){}
                        try { resetFormEl.style.display = 'none'; loginForm.style.display = 'block'; } catch(e){}
                        try { sessionStorage.removeItem('passwordResetEmail'); } catch(e){}
                    });
                    return;
                } else {
                    const msg = json.message || 'Failed to update password.';
                    alert(msg);
                }
            } catch (err) {
                console.error(err);
                alert('Network error.');
            } finally {
                if (resetBtn) { resetBtn.disabled = false; resetBtn.innerHTML = origHTML; }
            }
        });

        // initialize state (no message shown)
        updateState(false);
    }
});

loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const u = document.getElementById('loginUser');
    const p = document.getElementById('loginPass');
    if (validate(u) && validate(p)) {
        const loginBtn = document.querySelector('.js-login-button');
        if (loginBtn) loginBtn.click();
    }
});

async function finishSignup() {
    const code = document.getElementById('verifyCode').value.trim();
    const emailInput = document.getElementById('email');
    const email = emailInput ? emailInput.value.trim() : null;
    if (!code || code.length < 4) {
        document.getElementById('modalError').style.display = 'flex';
        return;
    }
    if (!email) {
        document.getElementById('modalError').textContent = 'Missing email.';
        document.getElementById('modalError').style.display = 'flex';
        return;
    }

    try {
        const res = await fetch('https://valviorabackend2.onrender.com/register/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ user: email, code })
        });
        const j = await res.json().catch(() => ({}));
        if (res.ok) {
                if (j.accessToken) {
                    try { setAccessToken(j.accessToken); } catch (e) {}
                }
            window.location.replace('Velviora.html');
            return;
        } else {
            document.getElementById('modalError').textContent = j.message || 'Verification failed.';
            document.getElementById('modalError').style.display = 'flex';
            return;
        }
    } catch (err) {
        console.error(err);
        document.getElementById('modalError').textContent = 'Network error.';
        document.getElementById('modalError').style.display = 'flex';
        return;
    }
}
