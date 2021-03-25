// const puppeteer = require("puppeteer"); // Development
const chromium = require("chrome-aws-lambda");

class Surfer {
  async launch() {
    return await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
  }
}

module.exports = new Surfer();
