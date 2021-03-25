const { default: axios } = require("axios");
const CryptoJS = require("crypto-js");
const config = require("./config.json");
const { default: rollbar } = require("./rollbar");

const API_URL = `${config[process.env.NODE_ENV]["apiUrl"]}/webhooks/events`;

const post = async (payload) => {
  const SHARED_SECRET = process.env.SHARED_SECRET;

  const hash = CryptoJS.HmacSHA256(JSON.stringify(payload), SHARED_SECRET);
  const hashInBase64 = CryptoJS.enc.Base64.stringify(hash);

  try {
    await axios.post(API_URL, payload, {
      headers: {
        "X-Authorization-Content-SHA256": hashInBase64,
      },
    });
  } catch (e) {
    rollbar.error(e);
    throw e;
  }
};

module.exports = post;
