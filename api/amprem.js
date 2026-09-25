/**
 * NAMA SCRAPE  : Alight Motion Premium Generator
 * ADMIN UTAMA  : Ariel.html
 * PENCIPTA     : Ariel
 * USAGE        : node amprem.js
 *                Mengirim magic link, memproses verifikasi,
 *                dan meneruskan idToken ke endpoint berikutnya.
 */

const axios = require('axios');

const API_URL = 'https://anita-studio.netlify.app/.netlify/functions/amprem';
const email = 'EMAIL_KAMU';

async function post(action, data) {
  const response = await axios.post(
    API_URL,
    {
      action,
      ...data
    },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
}

async function main() {
  try {
    const magicLink = await post('send-magiclink', {
      email
    });

    console.log(magicLink);

    if (!magicLink.success) {
      throw new Error(magicLink.message || 'Gagal mengirim magic link');
    }

    const rawLink = 'RAW_MAGIC_LINK_KAMU';

    const verification = await post('verify-account', {
      email,
      rawLink
    });

    console.log(verification);

    if (!verification.success) {
      throw new Error(verification.message || 'Verifikasi gagal');
    }

    const idToken =
      verification.idToken ||
      verification.profile?.idToken;

    if (!idToken) {
      throw new Error('idToken tidak ditemukan');
    }

    const premium = await post('apply-premium', {
      email,
      idToken
    });

    console.log(premium);

    if (!premium.success) {
      throw new Error(premium.message || 'Proses gagal');
    }

    console.log(JSON.stringify(premium, null, 2));

  } catch (error) {
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

main();
