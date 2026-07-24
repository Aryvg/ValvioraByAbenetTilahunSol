let storedAccessToken = null;

export async function loadChannel() {

    try {
      
      let token = null;// we store login token here
      try {
        const r = await fetch('https://valviorabackend2.onrender.com/refresh', { credentials: 'include' });// here we send refreshToken to the backend since we have logged in and in response, it sends us accessToken
        if (r.ok) {// if it sends us accessToken
          const d = await r.json();// put the accessToken in d converting it into json
          token = d?.accessToken || null;// if accessToken exists in d, put this accessToken in token variable.
          if (token) storedAccessToken = token;// if the token exists, store the accessToken in memory as storedAccessToken
        }
      } catch (e) {// if refresh fails as a result of it expiring
        console.warn('Refresh failed, falling back to local token', e);
      }

      // Fallback to any token already stored
      if (!token) token = storedAccessToken;// if there is no token as a result of refresh token expiring, take the access token that is stored in memory and this accessToken will be used as long as it is not expiring but when it expires, it will be useless since there is no refreshToken to make it again

      const headers = token ? { 'Authorization': 'Bearer ' + token } : {};// means if token exists, send this token to the backend and if it does not exist, send empty headers-this is how backend know we are logged in. the sending is conducted below by headers

      const response = await fetch('https://valviorabackend2.onrender.com/channelApi', { headers });// we send request to the backend that says 'give me employee data' and the backend sends response if headers contains an access token that shows that we are logged in.

      if (!response.ok) {
        alert('Failed to load channel data. Please try again later.'); // alert the user if the response is not ok
        return;
      }


    const data = await response.json();
    // Backend returns an array of channels; use the first item when present
    const channel = Array.isArray(data) ? data[0] : data;
    let id;
    if (channel) {
      id = channel.channelId || Date.now();
      const nameEl = document.getElementById('dashName'); if (nameEl) nameEl.innerText = channel.channelname || 'Channel Name';
      const descEl = document.getElementById('dashDesc'); if (descEl) descEl.innerText = channel.Description || 'Welcome to my channel!';
      const contactEl = document.getElementById('dashContact'); if (contactEl) contactEl.innerText = channel.contactEmail || '';
      if (channel.profilePicture) {
        const pfpEl = document.getElementById('dashPfp'); if (pfpEl) pfpEl.style.backgroundImage = `url(${channel.profilePicture})`;
        const headerPfp = document.getElementById('headerPfp'); if (headerPfp) headerPfp.style.backgroundImage = `url(${channel.profilePicture})`;
      }
      if (channel.channelBanner) {
        const bannerEl = document.getElementById('dashBanner'); if (bannerEl) bannerEl.style.backgroundImage = `url(${channel.channelBanner})`;
      }
    } else {
      id = Date.now();
      const defaultChan = { id, channelname: "New Creator", contactEmail: "admin@nile.com", Description: '' };
      localStorage.setItem('myChannel', JSON.stringify(defaultChan));
      const nameEl = document.getElementById('dashName'); if (nameEl) nameEl.innerText = defaultChan.channelname;
      const contactEl = document.getElementById('dashContact'); if (contactEl) contactEl.innerText = defaultChan.contactEmail;
    }
    return id;

    } catch (error) {
       alert('An error occurred while loading channel data. Please try again later.'); // alert the user if there is an error during the fetch process
       console.error('Error loading channel data:', error);
    }

}