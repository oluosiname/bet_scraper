const nairabetNormaliser = require("./team-normalizers/nairabet-normalizer.json");
const post = require("./post");
const { default: rollbar } = require("./rollbar");

class Nairabet {
  constructor(page) {
    // later fetch from API

    this.page = page;
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
        { competition, data: res.filter((r) => !r.missingTranslations) },
      ];
    }

    if (this.missingTranslations.length > 0) {
      rollbar.warn("Translation Missing", {
        bookmaker: "nairabet",
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
    await this.page.waitForSelector(".eventListLeagueEventsListPartial");

    let data = await this.page.$$eval(
      ".single-event",
      (events, normalizer) => {
        return events.map((el) => {
          let missingTranslations = [];
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
