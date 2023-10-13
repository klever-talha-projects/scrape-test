const puppeteer = require("puppeteer");
const express = require("express")
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

let app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.post("/api/scrape", async function (req, res) {

    let articleNum = req.body.article;

    const scrapedLink = await linkScrape(articleNum);
    const scrapedData = await Scrape(scrapedLink);
    res.json(scrapedData);

})

let browser;

async function linkScrape(articleNum) {

    browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
    
    const page = await browser.newPage();
    await page.goto("https://www.ikea.com/es/es/search/?q=" + articleNum)

    const data = await page.evaluate(function () {
        let link = document.querySelector(".link").getAttribute("href")
        return link
    })

    return data

}

async function Scrape(data) {
    const page = await browser.newPage();
    await page.goto(data)

    const scrape = await page.evaluate(function () {
        let image = document.querySelector(".pip-image")?.getAttribute("src")
        let name = document.querySelector(".pip-header-section__title--big")?.innerText
        let price = document.querySelector(".pip-temp-price__sr-text")?.innerText
        let desc = document.querySelector(".pip-header-section__description")?.innerText

        let array = [];

        // Push the values into the array
        array.push({
            image,
            name,
            price,
            desc
        });

        return array
    });

    await browser.close();
    return scrape
}



app.listen();
