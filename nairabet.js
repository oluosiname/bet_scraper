const nairabetNormaliser = require("./team-normalizers/nairabet-normalizer.json");
const { default: axios } = require("axios");
const CryptoJS = require("crypto-js");
class Nairabet {
  constructor(page, apiUrl) {
    // later fetch from API

    this.page = page;
    this.apiUrl = apiUrl;
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
    for (const { url, competition } of this.urls) {
      const res = await this.scrape(url);
      this.payload.events = [
        ...this.payload.events,
        { competition, data: res },
      ];
    }

    const hash = CryptoJS.HmacSHA256(
      JSON.stringify(this.payload),
      process.env.SHARED_SECRET
    );
    const hashInBase64 = CryptoJS.enc.Base64.stringify(hash);

    try {
      await axios.post(this.apiUrl, this.payload, {
        headers: {
          "X-Authorization-Content-SHA256": hashInBase64,
        },
      });
    } catch (e) {
      console.log(e.response.status, e.response.statusText, "En error occured");
    }
  }

  async scrape(url) {
    await this.page.setViewport({ width: 1366, height: 768 });

    await this.page.goto(url, {
      waitUntil: "networkidle2",
    });
    await this.page.waitForSelector(".eventListLeagueEventsListPartial");

    let data = await this.page.$$eval(
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
            return;
          }
          if (!awayTeam) {
            // team: away,
            //   // message: "Missing translation",
            //   bookmaker: this.payload.bookmaker,
            // send error to sentry
            return;
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
