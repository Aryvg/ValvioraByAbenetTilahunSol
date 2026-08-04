import { isStrongPassword } from './CheckPwdStrength.js';
export function validateField(field) {
    const input = document.getElementById(field.id);
    const msg = document.getElementById(field.msg);
    const value = input.value.trim();

    // 👉 IF EMPTY → SHOW NOTHING
    if (value === "") {
        msg.textContent = "";
        return false;// returns invalid
    }

    if (field.id === 'fname') {
        if (value.length > 50) {
            msg.textContent = '❌ First name must be 50 characters or less.';
            msg.style.color = 'red';
            return false;
        }
        msg.textContent = '✅ firstname is valid';
        msg.style.color = 'green';
        return true;
    }

    if (field.id === 'lname') {
        if (value.length > 50) {
            msg.textContent = '❌ Last name must be 50 characters or less.';
            msg.style.color = 'red';
            return false;
        }
        msg.textContent = '✅ lastname is valid';
        msg.style.color = 'green';
        return true;
    }

    if (field.id === 'email') {
        if (value.length > 254) {
            msg.textContent = '❌ Email must be 254 characters or less.';
            msg.style.color = 'red';
            return false;
        }
        if (!value.endsWith('@gmail.com')) {
            msg.textContent = '❌ Email is not valid';
            msg.style.color = 'red';
            return false;
        }
        msg.textContent = '✅ email is valid';
        msg.style.color = 'green';
        return true;
    }

    if (field.id === 'password') {
        if (value.length > 64) {
            msg.textContent = '❌ Password must be 64 characters or less.';
            msg.style.color = 'red';
            return false;
        }
        if (!isStrongPassword(value)) {
            msg.textContent = '❌ Password is not strong. It must be 8 characters';
            msg.style.color = 'red';
            return false;
        }
        msg.textContent = '✅ password is strong';
        msg.style.color = 'green';
        return true;
    }

    if (field.id === 'confirm') {
        const passwordInput = document.getElementById('password');
        if (!passwordInput) {
            msg.textContent = '❌ Password field not found';
            msg.style.color = 'red';
            return false;
        }
        if (value !== passwordInput.value) {
            msg.textContent = '❌ Passwords do not match';
            msg.style.color = 'red';
            return false;
        }
        msg.textContent = '✅ passwords match';
        msg.style.color = 'green';
        return true;
    }
    if (field.id === 'age') {
        if (!/^\d+$/.test(value)) {// means only numbers are allowed
            msg.textContent = '❌ Age must be a number';
            msg.style.color = 'red';
            return false;
        }
        msg.textContent = '✅ age is valid';
        msg.style.color = 'green';
        return true;
    }
    // if field is not special, make it valid
    msg.textContent = `✅ ${field.name} is valid`;
    msg.style.color = 'green';
    return true;
}
