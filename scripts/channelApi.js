import { getAccessToken } from './auth.js';

const API = 'https://valviorabackend2.onrender.com/channelApi/exists';

export async function userHasChannel() {
  const token = await getAccessToken();
  if (!token) return { exists: false };
  try {
    const res = await fetch(API, { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) return { exists: false };
    return await res.json();
  } catch (e) {
    console.error('channel check failed', e);
    return { exists: false };
  }
}

export async function userHasChannelBool() {
  const r = await userHasChannel();
  return !!(r && r.exists);
}
