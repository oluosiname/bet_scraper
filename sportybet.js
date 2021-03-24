const normaliser = require("./team-normalizers/sportybet-normalizer.json");
const post = require("./post");

class Sportybet {
  constructor(page) {
    this.page = page;
    // later fetch from API
    this.urls = [
      {
        competition: "premier league",
        url:
          "https://www.sportybet.com/ng/sport/football/sr:category:1/sr:tournament:17",
      },
      {
        competition: "la liga",
        url:
          "https://www.sportybet.com/ng/sport/football/sr:category:32/sr:tournament:8",
      },
      {
        competition: "serie a",
        url:
          "https://www.sportybet.com/ng/sport/football/sr:category:31/sr:tournament:23",
      },
      {
        competition: "bundesliga",
        url:
          "https://www.sportybet.com/ng/sport/football/sr:category:30/sr:tournament:35",
      },
      {
        competition: "ligue 1",
        url:
          "https://www.sportybet.com/ng/sport/football/sr:category:7/sr:tournament:34",
      },
    ];

    this.payload = { bookmaker: "sportybet", events: [] };
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

    await this.page.waitForSelector(".match-table");

    let data = await this.page.$$eval(
      ".match-table .m-table-row",
      (elements, normalizer) => {
        let date;
        let arr = [];
        elements.forEach((el) => {
          if (el.classList.contains("date-row")) {
            date = `${
              el.querySelector(".date").textContent.split(" ")[0]
            } ${new Date().getFullYear()}`;
            cDate = date;
          } else {
            const time = el.querySelector(".clock-time").textContent.trim();
            const home = el.querySelector(".home-team").textContent.trim();
            const away = el.querySelector(".away-team").textContent.trim();
            const [
              home_odds_el,
              draw_odds_el,
              away_odds_el,
            ] = el.querySelectorAll(".m-outcome-odds");
            const home_odds = home_odds_el.textContent;
            const draw_odds = draw_odds_el.textContent;
            const away_odds = away_odds_el.textContent;

            homeTeam = normalizer[home] || "none";
            awayTeam = normalizer[away] || "test";
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
            arr = [
              ...arr,
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
        return arr;
      },
      normaliser
    );

    return data;
  }
}

module.exports = Sportybet;