const surfer = require("./surfer");
const config = require("./config.json");
const dotenv = require("dotenv");

dotenv.config();

const BOOKMAKERS = ["bet9ja", "nairabet"];

const API_URL = `${config[process.env.NODE_ENV]["apiUrl"]}/webhooks/events`;

const run = async () => {
  const browser = await surfer.launch();
  const page = await browser.newPage();

  for (const bookmaker of BOOKMAKERS) {
    const Bookmaker = require(`./${bookmaker}`);
    let bookmakerScraper = new Bookmaker(page, API_URL);
    await bookmakerScraper.run();
  }

  await browser.close();
};

run();
