const surfer = require("./surfer");
const config = require("./config.json");
const dotenv = require("dotenv");

dotenv.config();

const BOOKMAKERS = ["sportybet", "bet9ja", "nairabet", "betking"];

const run = async () => {
  const browser = await surfer.launch();
  const page = await browser.newPage();

  for (const bookmaker of BOOKMAKERS) {
    const Bookmaker = require(`./${bookmaker}`);
    let bookmakerScraper = new Bookmaker(page);
    await bookmakerScraper.run();
  }

  await browser.close();
};

run();
