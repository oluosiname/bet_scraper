const puppeteer = require("puppeteer");

class Surfer {
  async launch() {
    return await puppeteer.launch({ headless: false });
  }
}

module.exports = new Surfer();
