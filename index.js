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
         var blockedURLs = [
            "https://www.ikea.com/5sI96zHfk_/6kCCCZE4/Y6/O1f9kfOutO/fQEkCFEB/PhoFP/VF8XVsB",
            "https://web-api.ikea.com/episod/inhouseEvent",
            "https://s.yimg.com",
            "https://www.google-analytics.com",
            "https://icsp.ingka.ikea.com",
            "https://favs.oneweb.ingka.com/graphql",
            "https://cm.teads.tv/v2/advertiser",
            "https://cdn.cookielaw.org/scripttemplates/202301.2.0/otBannerSdk.js",
            "https://www.ikea.com/akam/13/pixel_72626eaa",
            "https://cdn.cookielaw.org/consent/0125d2c5-0ef9-4613-a2b3-84d6ed780002/0125d2c5-0ef9-4613-a2b3-84d6ed780002.json",
            "https://geolocation.onetrust.com/cookieconsentpub/v1/geo/location",
            "https://api.ingka.ikea.com/guest/token",
            "https://www.ikea.com/es/es/favs-agent/agent/agent-aacd9324.js",
            "https://www.ikea.com/es/es/product-lists/modal~dropdown-1711.js",
            "https://www.ikea.com/es/es/product-lists/dropdown-1711.js",
            "https://www.ikea.com/es/es/product-lists/modal-1711.js",
            "https://www.ikea.com/es/es/recommendations/panels/rec-add-to-cart.ebdcc721.chunk.js",
            "https://www.ikea.com/es/es/recommendations/panels/rec_non_initial.f65acdd3.chunk.js",
            "https://www.ikea.com/es/es/product-lists/compare-1711.js",
            "https://www.ikea.com/es/es/recommendations/panels/rec-init-mount-panels.8eb7ff4f.chunk.js",
            "https://www.ikea.com/es/es/static/ikea-logo.f7d9229f806b59ec64cb.svg",
            "https://www.ikea.com/es/es/recommendations/panels/rec_vendors.f8ea59e2.chunk.js",
            "https://www.ikea.com/es/es/loyalty/asset-manifest.json",
            "https://www.ikea.com/es/es/recommendations/panels/rec_vendors_preact.9c28c032.chunk.js",
            "https://www.ikea.com/es/es/recommendations/panels/rec_vendors_ingka.d014595b.chunk.js"
          ];
        if(req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font' || blockedURLs.includes(req.url())){
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
        if(req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font' || req.resourceType() === 'script'){
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
