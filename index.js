const surfer = require("./surfer");
const config = require("./config.json");
const dotenv = require("dotenv");

dotenv.config();

// const BOOKMAKERS = ["sportybet", "bet9ja", "nairabet", "betking"];
const BOOKMAKERS = ["bet9ja", "nairabet"];

const run = async () => {
  try {
    const browser = await surfer.launch();
    const page = await browser.newPage();

    for (const bookmaker of BOOKMAKERS) {
      const Bookmaker = require(`./${bookmaker}`);
      let bookmakerScraper = new Bookmaker(page);
      await bookmakerScraper.run();
    }
  } catch (error) {
    const response = { statusCode: 422, body: JSON.stringify("Shit happens!") };
    return response;
  } finally {
    if (browser !== null) {
      await browser.close();
    }

    const response = {
      statusCode: 200,
      body: JSON.stringify("Hello from Lambda!"),
    };
    return response;
  }
};

run();
