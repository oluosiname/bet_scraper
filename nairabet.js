const puppeteer = require("puppeteer");
const nairabetNormaliser = require("./team-normalizers/nairabet-normalizer.json");
const { default: axios } = require("axios");
class Nairabet {
  constructor() {
    // later fetch from API
    this.urls = [
      {
        competition: "premier league",
        url: "https://nairabet.com/categories/18871",
      },
      {
        competition: "la liga",
        url: "https://nairabet.com/categories/18726",
      },
      {
        competition: "serie a",
        url: "https://nairabet.com/categories/18759",
      },
      {
        competition: "bundesliga",
        url: "https://nairabet.com/categories/18767",
      },
      {
        competition: "ligue 1",
        url: "https://nairabet.com/categories/18883",
      },
    ];

    this.payload = { bookmaker: "nairabet", events: [] };
  }

  async run() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    for (const { url, competition } of this.urls) {
      const res = await this.scrape(url, page);
      this.payload.events = [
        ...this.payload.events,
        { competition, data: res },
      ];
    }

    try {
      await axios.post(
        "http://localhost:3001/v1/webhooks/events",
        this.payload
      );
    } catch (e) {
      console.log(e, "could not send date");
    }
    await browser.close();
  }

  async scrape(url, page) {
    await page.setViewport({ width: 1366, height: 768 });

    await page.goto(url, {
      waitUntil: "networkidle2",
    });
    await page.waitForSelector(".eventListLeagueEventsListPartial");

    let data = await page.$$eval(
      ".single-event",
      (events, normalizer) => {
        return events.map((el) => {
          const e = {};
          const dateTime = el.querySelector(
            ".eventListPeriodItemPartial .date-time"
          ).textContent;

          [date, time] = dateTime.trim().replace(/ +/g, " ").split(" ");

          let [home, away] = el
            .querySelector(".eventListPeriodItemPartial .event-name")
            .textContent.split(" - ");

          homeTeam = normalizer[home];
          awayTeam = normalizer[away];
          if (!homeTeam) {
            // send error to sentry
            return {};
          }
          if (!awayTeam) {
            // team: away,
            //   // message: "Missing translation",
            //   bookmaker: this.payload.bookmaker,
            // send error to sentry
            return {};
          }

          const [home_odds, draw_odds, away_odds] = el
            .querySelector(".eventListPeriodItemPartial .game")
            .textContent.trim()
            .replace(/ +/g, " ")
            .split(" ");
          return {
            date,
            time,
            home_team: homeTeam,
            away_team: awayTeam,
            outcomes: {
              home_odds,
              draw_odds,
              away_odds,
            },
          };
        });
      },
      nairabetNormaliser
    );

    return data;
  }
}

module.exports = Nairabet;
