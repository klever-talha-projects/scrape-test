const puppeteer = require("puppeteer");
const express = require("express")
const bodyParser = require("body-parser");
const cors = require("cors");

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

let browser

async function browserRun(){
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
}
    

async function linkScrape(articleNum) {
    
    await browserRun() 
    const page = await browser.newPage();
    await page.setViewport({ width: 350, height: 800 });
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if(req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font'){
            req.abort();
        }
        else {
            req.continue();
        }})
    await page.goto("https://www.ikea.com/es/es/search/?q=" + articleNum)

    const data = await page.evaluate(function () {
        let link = document.querySelector(".link").getAttribute("href")
        return link
    })

    return data

}

async function Scrape(data) {
    const page = await browser.newPage();
    await page.setViewport({ width: 350, height: 800 });
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if(req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font'){
            req.abort();
        }
        else {
            req.continue();
        }})
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

    browser.close();
    return scrape
}


const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
