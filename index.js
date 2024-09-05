const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

class Product {
  constructor(name, priceStr, url) {
    this.name = this.cleanName(name);
    this.priceGb = this.cleanPrice(priceStr);
    this.priceUsd = this.convertPriceToUsd(this.priceGb);
    this.url = this.createAbsoluteUrl(url);
  }

  cleanName(name) {
    if (name == " " || name == "" || name == null) {
      return "missing";
    }
    return name.trim();
  }

  cleanPrice(priceStr) {
    // priceStr = priceStr.trim();
    // priceStr = priceStr.replace("Sale price£", "");
    // priceStr = priceStr.replace("Sale priceFrom £", "");
    if (priceStr == "") {
      return 0.0;
    }
    return parseFloat(priceStr);
  }

  convertPriceToUsd(priceGb) {
    return priceGb * 1.29;
  }

  createAbsoluteUrl(url) {
    if (url == "" || url == null) {
      return "missing";
    }
    return "https://www.chocolate.co.uk" + url;
  }
}

class ProductDataPipeline {
  constructor(csvFilename = "", storageQueueLimit = 5) {
    this.seenProducts = new Set();
    this.storageQueue = [];
    this.csvFilename = csvFilename;
    this.csvFileOpen = false;
    this.storageQueueLimit = storageQueueLimit;
  }

  saveToCsv() {
    this.csvFileOpen = true;
    const fileExists = fs.existsSync(this.csvFilename);
    const file = fs.createWriteStream(this.csvFilename, { flags: "a" });
    if (!fileExists) {
      file.write("name,priceGb,priceUsd,url\n");
    }
    for (const product of this.storageQueue) {
      file.write(
        `${product.name},${product.priceGb},${product.priceUsd},${product.url}\n`
      );
    }
    file.end();
    this.storageQueue = [];
    this.csvFileOpen = false;
  }

  cleanRawProduct(rawProduct) {
    return new Product(rawProduct.name, rawProduct.price, rawProduct.url);
  }

  isDuplicateProduct(product) {
    if (!this.seenProducts.has(product.url)) {
      this.seenProducts.add(product.url);
      return false;
    }
    return true;
  }

  addProduct(rawProduct) {
    const product = this.cleanRawProduct(rawProduct);
    if (!this.isDuplicateProduct(product)) {
      this.storageQueue.push(product);
      if (
        this.storageQueue.length >= this.storageQueueLimit &&
        !this.csvFileOpen
      ) {
        this.saveToCsv();
      }
    }
  }

  async close() {
    while (this.csvFileOpen) {
      // Wait for the file to be written
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (this.storageQueue.length > 0) {
      this.saveToCsv();
    }
  }
}

const listOfUrls = [
  "https://www.amazon.com/Sahale-Snacks-Berry-Macaroon-Almond/dp/B0733NQLX2/ref=sims_dp_d_dex_popular_subs_t2_v5_d_sccl_1_3/140-3678608-8286431?pd_rd_w=7FDWN&content-id=amzn1.sym.39c2fa5d-21ed-4da7-bd6d-b080e3e496a1&pf_rd_p=39c2fa5d-21ed-4da7-bd6d-b080e3e496a1&pf_rd_r=0M5VB3XAC6M2EA26N410&pd_rd_wg=y7iIL&pd_rd_r=6f3ec311-d026-4291-b44e-013eef163f3e&pd_rd_i=B0733NQLX2&th=1",
];

async function scrape() {
  const pipeline = new ProductDataPipeline("chocolate.csv", 5);
  for (const url of listOfUrls) {
    const response = await axios.get(url);

    if (response.status == 200) {
      const html = response.data;
      const $ = cheerio.load(html);

      const title = $("#productTitle").text();

      const price = $(".a-price[data-a-color=base]")
        .text()
        .split("$")
        .filter((_, index) => index == 1)
        .join("");
      const discount = $(".savingPriceOverride").text();
      console.log(price, discount);

      const url = $(".product-item-meta__title").attr("href");

      pipeline.addProduct({ name: title, price: price, url: url });

      const nextPage = $("a[rel='next']").attr("href");
      if (nextPage) {
        listOfUrls.push("https://www.chocolate.co.uk" + nextPage);
      }
    }
  }
  await pipeline.close();
}

(async () => {
  await scrape();
})();
