const surfer = require("./surfer");
const config = require("./config.json");
const dotenv = require("dotenv");
const { default: rollbar } = require("./rollbar");

dotenv.config();

const BOOKMAKERS = ["sportybet", "bet9ja", "nairabet", "betking"];

exports.handler = async (event, context, callback) => {
  try {
    const browser = await surfer.launch();
    const page = await browser.newPage();

    for (const bookmaker of BOOKMAKERS) {
      const Bookmaker = require(`./${bookmaker}`);
      let bookmakerScraper = new Bookmaker(page);
      await bookmakerScraper.run();
    }

    if (browser && browser !== null) {
      browser.close();
    }

    const response = {
      statusCode: 200,
      body: JSON.stringify("Successful"),
    };
    return response;
  } catch (error) {
    rollbar.error(error);
    const response = { statusCode: 422, body: JSON.stringify("Shit happens!") };
    return response;
  }
};
