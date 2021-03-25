const puppeteer = require("puppeteer"); // Development
const chromium = require("chrome-aws-lambda");

class Surfer {
  async launch() {
    if (process.NODE_ENV === "development") {
      return await puppeteer.launch({ headless: false });
    }

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
