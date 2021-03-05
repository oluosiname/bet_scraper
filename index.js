const surfer = require("./surfer");
const BOOKMAKERS = ["bet9ja", "nairabet"];

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
