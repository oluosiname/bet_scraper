const betkingNormaliser = require("./team-normalizers/betking-normalizer.json");
const post = require("./post");
const { default: rollbar } = require("./rollbar");

class Betking {
  constructor(page) {
    // later fetch from API

    this.page = page;
    this.urls = [
      {
        competition: "premier league",
        url:
          "https://www.betking.com/sports/s/event/p/soccer/england/eng-premier-league/0/0",
      },
      {
        competition: "la liga",
        url:
          "https://www.betking.com/sports/s/event/p/soccer/spain/esp-laliga/0/0",
      },
      {
        competition: "serie a",
        url:
          "https://www.betking.com/sports/s/event/p/soccer/italy/ita-serie-a/0/0",
      },
      {
        competition: "bundesliga",
        url:
          "https://www.betking.com/sports/s/event/p/soccer/germany/ger-bundesliga/0/0",
      },
      {
        competition: "ligue 1",
        url:
          "https://www.betking.com/sports/s/event/p/soccer/france/fra-ligue-1/0/0",
      },
      {
        competition: "champions league",
        url:
          "https://www.betking.com/sports/s/event/p/soccer/champions-l/uefa-champions-league/0/0",
      },
      {
        competition: "europa league",
        url:
          "https://www.betking.com/sports/s/event/p/soccer/europa-l/uefa-europa-league/0/0",
      },
      {
        competition: "eredivisie",
        url:
          "https://www.betking.com/sports/s/event/p/soccer/netherlands/ned-eredivisie/0/0",
      },
      {
        competition: "primeira liga",
        url:
          "https://www.betking.com/sports/s/event/p/soccer/portugal/por-primeira-liga/0/0",
      },
      // {
      //   competition: "belgium first division a",
      //   url:
      //     "https://www.betking.com/sports/s/event/p/soccer/belgium/bel-first-division-a/0/0",
      // },
      {
        competition: "belgium first division a",
        url:
          "https://www.betking.com/sports/s/event/p/soccer/belgium/bel-first-division-a-championship-round/0/0",
      },
      {
        competition: "belgium first division a",
        url:
          "https://www.betking.com/sports/s/event/p/soccer/belgium/bel-first-division-a-conference-league-playoffs/0/0",
      },
      {
        competition: "russia premier league",
        url:
          "https://www.betking.com/sports/s/event/p/soccer/russia/rus-premier-league/0/0",
      },
      {
        competition: "scotland premiership",
        url:
          "https://www.betking.com/sports/s/event/p/soccer/scotland/sco-premiership-championship-round/0/0",
      },
      {
        competition: "scotland premiership",
        url:
          "https://www.betking.com/sports/s/event/p/soccer/scotland/sco-premiership-relegation-round/0/0",
      },
      {
        competition: "turkey super lig",
        url:
          "https://www.betking.com/sports/s/event/p/soccer/turkey/tur-s-per-lig/0/0",
      },
    ];

    this.payload = { bookmaker: "betking", events: [] };
    this.missingTranslations = [];
  }

  async run() {
    for (const { url, competition } of this.urls) {
      let res;
      try {
        res = await this.scrape(url);
      } catch (e) {
        rollbar.error(`ScrapingError::Betking" ${e.message} ${competition}`);
        continue;
      }

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
        bookmaker: "betking",
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

    await this.page.waitForSelector(".oddsTable");

    let [firstDate] = await this.page.$$eval("thead", (elements) => {
      return elements.map((el) => {
        const dateTime = el.querySelector(".selectionHeader th.dateRow")
          .textContent;

        return dateTime;
      });
    });

    let data = await this.page.$$eval(
      "tbody",
      (elements, normalizer, firstDate) => {
        let a = [];
        elements.forEach((el) => {
          let date;
          let missingTranslations = [];
          const dateElement = el.querySelector("tr .dateRow");
          if (dateElement) {
            date = dateElement.textContent;
          } else {
            date = firstDate;
          }

          const events = el.querySelectorAll(".trOddsSection");
          events.forEach((r) => {
            const time = r.querySelector(".eventDate").textContent;
            const [home, away] = r
              .querySelector(".matchName")
              .textContent.split(" - ")
              .map((t) => t.trim());

            homeTeam = normalizer[home];
            awayTeam = normalizer[away];
            if (!homeTeam) {
              missingTranslations = [...missingTranslations, home];
            }
            if (!awayTeam) {
              missingTranslations = [...missingTranslations, away];
            }

            const oddsElements = r.querySelectorAll(".oddItem");

            const home_odds = oddsElements[0].textContent.trim();
            const draw_odds = oddsElements[1].textContent.trim();
            const away_odds = oddsElements[2].textContent.trim();

            if (!awayTeam || !homeTeam) {
              a = [...a, { missingTranslations }];
            } else {
              a = [
                ...a,
                {
                  date,
                  time,
                  home_team: homeTeam,
                  away_team: awayTeam,
                  outcomes: {
                    home_odds,
                    draw_odds,
                    away_odds,
                  },
                },
              ];
            }
          });
        });
        return a;
      },
      betkingNormaliser,
      firstDate
    );

    return data;
  }
}

module.exports = Betking;
