const betkingNormaliser = require("./team-normalizers/betking-normalizer.json");
const post = require("./post");

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
      // {
      //   competition: "bundesliga",
      //   url:
      //     "https://www.betking.com/sports/s/event/p/soccer/germany/ger-bundesliga/0/0",
      // },
      // {
      //   competition: "ligue 1",
      //   url:
      //     "https://www.betking.com/sports/s/event/p/soccer/france/fra-ligue-1/0/0",
      // },
    ];

    this.payload = { bookmaker: "betking", events: [] };
  }

  async run() {
    for (const { url, competition } of this.urls) {
      const res = await this.scrape(url);

      this.payload.events = [
        ...this.payload.events,
        { competition, data: res },
      ];
    }

    try {
      post(this.payload);
    } catch (e) {
      console.log(e);
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

            const oddsElements = r.querySelectorAll(".oddItem");

            const home_odds = oddsElements[0].textContent.trim();
            const draw_odds = oddsElements[1].textContent.trim();
            const away_odds = oddsElements[2].textContent.trim();

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
          });

          // return {
          //   date,
          //   time,
          //   home_team: homeTeam,
          //   away_team: awayTeam,
          //   outcomes: {
          //     home_odds,
          //     draw_odds,
          //     away_odds,
          //   },
          // };
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
