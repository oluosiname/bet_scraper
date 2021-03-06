const normaliser = require("./team-normalizers/bet9ja-normalizer.json");
const { default: axios } = require("axios");
const CryptoJS = require("crypto-js");

class Bet9ja {
  constructor(page, apiUrl) {
    this.page = page;
    this.apiUrl = apiUrl;
    // later fetch from API
    this.urls = [
      {
        competition: "premier league",
        url: "https://web.bet9ja.com/Sport/Odds?EventID=170880",
      },
      {
        competition: "la liga",
        url: "https://web.bet9ja.com/Sport/Odds?EventID=180928",
      },
      {
        competition: "serie a",
        url: "https://web.bet9ja.com/Sport/Odds?EventID=167856",
      },
      {
        competition: "bundesliga",
        url: "https://web.bet9ja.com/Sport/Odds?EventID=180923",
      },
      {
        competition: "ligue 1",
        url: "https://web.bet9ja.com/Sport/Odds?EventID=950503",
      },
    ];

    this.payload = { bookmaker: "bet9ja", events: [] };
  }

  async run() {
    for (const { url, competition } of this.urls) {
      const res = await this.scrape(url);
      this.payload.events = [
        ...this.payload.events,
        { competition, data: res },
      ];
    }

    const SHARED_SECRET =
      process.env.NODE_ENV === "production"
        ? process.env.SHARED_SECRET_PRODUCTION
        : process.env.SHARED_SECRET;

    const hash = CryptoJS.HmacSHA256(
      JSON.stringify(this.payload),
      SHARED_SECRET
    );
    const hashInBase64 = CryptoJS.enc.Base64.stringify(hash);

    try {
      await axios.post(this.apiUrl, this.payload, {
        headers: {
          "X-Authorization-Content-SHA256": hashInBase64,
        },
      });
    } catch (e) {
      console.log(e, "could not send date");
    }
  }

  async scrape(url) {
    await this.page.setViewport({ width: 1366, height: 768 });

    await this.page.goto(url, {
      waitUntil: "networkidle2",
    });
    await this.page.waitForSelector(".SEs");

    let data = await this.page.$$eval(
      ".item",
      (events, normalizer) => {
        return events.map((el) => {
          const dateTime = el.querySelector(".Time").textContent;
          const [time, ...date] = dateTime
            .replace(/\n/g, "")
            .trim()
            .replace(/ +/g, " ")
            .split(" ");

          let [home, away] = el
            .querySelector(".Event")
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

          const [
            home_odds_element,
            draw_odds_element,
            away_odds_element,
          ] = el.querySelectorAll(".odds .odd div:last-child");
          home_odds = home_odds_element.textContent;
          draw_odds = draw_odds_element.textContent;
          away_odds = away_odds_element.textContent;

          return {
            date: date.join(" "),
            time: time,
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
      normaliser
    );

    return data;
  }
}

module.exports = Bet9ja;
