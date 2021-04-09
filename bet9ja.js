const normaliser = require("./team-normalizers/bet9ja-normalizer.json");
const post = require("./post");
const { default: rollbar } = require("./rollbar");

class Bet9ja {
  constructor(page) {
    this.page = page;
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
      {
        competition: "champions league",
        url: "https://web.bet9ja.com/Sport/Odds?EventID=1185641",
      },
      {
        competition: "europa league",
        url: "https://web.bet9ja.com/Sport/Odds?EventID=1185689",
      },
      {
        competition: "eredivisie",
        url: "https://web.bet9ja.com/Sport/Odds?EventID=1016657",
      },
      {
        competition: "primeira liga",
        url: "https://web.bet9ja.com/Sport/Odds?EventID=180967",
      },

      {
        competition: "belgium first division a",
        url: "https://web.bet9ja.com/Sport/Odds?EventID=958370",
      },
      {
        competition: "russia premier league",
        url: "https://web.bet9ja.com/Sport/Odds?EventID=192011",
      },
      {
        competition: "scotland premiership",
        url: "https://web.bet9ja.com/Sport/Odds?EventID=1382919",
      },
      {
        competition: "scotland premiership",
        url: "https://web.bet9ja.com/Sport/Odds?EventID=1382919",
      },
    ];

    this.payload = { bookmaker: "bet9ja", events: [] };
    this.missingTranslations = [];
  }

  async run() {
    for (const { url, competition } of this.urls) {
      const res = await this.scrape(url);
      const missing = res
        .filter((r) => r.missingTranslations)
        .map((m) => m.missingTranslations.join(" "));
      this.missingTranslations = [...this.missingTranslations, ...missing];

      this.payload.events = [
        ...this.payload.events,
        { competition, data: res },
      ];
    }

    if (this.missingTranslations.length > 0) {
      rollbar.warn("Translation Missing", {
        bookmaker: "bet9ja",
        teams: this.missingTranslations,
      });
    }

    try {
      post(this.payload);
    } catch (e) {
      rollbar.error(e);
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
          let missingTranslations = [];
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
            missingTranslations = [...missingTranslations, home];
          }
          if (!awayTeam) {
            missingTranslations = [...missingTranslations, away];
          }

          if (!awayTeam || !homeTeam) {
            return {
              missingTranslations,
            };
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
