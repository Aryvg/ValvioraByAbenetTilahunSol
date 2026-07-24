// Real-time username availability check (debounced)
function debounce(fn, delay = 300) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
    };
}// wait until the user stops typing before running a function. the request gets sent 300 mili second after the user stops typing. That is what debounce does.

const usernameInput = document.getElementById('email');
const usernameMsg = document.getElementById('email-msg');

async function checkAvailability(value) {
    //value is what the person types in the input 
    try {
        const res = await fetch(`https://valviorabackend2.onrender.com/registered/exists?user=${encodeURIComponent(value)}`, { cache: 'no-store' });
        // catch: no store logs the error in the console if the fetch fails like if there is no internet and stuff
        if (!res.ok) return false;// if it fails fails, sto function
        const json = await res.json();// change server response into js object
        return !!json.exists;// means if the username exists, return true, otherwise return false
    } catch (e) {
        console.error('availability check failed', e);
        return false;
    }
}

const checkUsername = debounce(async () => {
    const val = usernameInput.value.trim();
    if (!val) {
        usernameMsg.textContent = '';
        return;
    }
    // Email validity check first
    if (!val.endsWith('@gmail.com')) {
        usernameMsg.textContent = '❌ Email is not valid';
        usernameMsg.style.color = 'red';
        return;
    }
    usernameMsg.textContent = 'checking...';
    const exists = await checkAvailability(val);
    if (exists) {
        usernameMsg.textContent = '❌ email already taken';
        usernameMsg.style.color = 'red';
    } else {
        usernameMsg.textContent = '✅ email available';
        usernameMsg.style.color = 'green';
    }
}, 300);

if (usernameInput) {// if this input exists in html
    usernameInput.addEventListener('input', checkUsername);// checkUsername function runs while typing
    usernameInput.addEventListener('change', checkUsername);//// checkUsername function runs when the user leaves field
}
