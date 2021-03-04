const BOOKMAKERS = ["nairabet"];

const run = () => {
  BOOKMAKERS.forEach((bookmaker) => {
    const Bookmaker = require(`./${bookmaker}`);
    bookmakerScraper = new Bookmaker();
    bookmakerScraper.run();
  });
};

run();
