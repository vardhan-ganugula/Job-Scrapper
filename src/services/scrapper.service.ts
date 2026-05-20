import * as cheerio from "cheerio";
import puppeteer, {type Page} from "puppeteer";
import {addURLJobProcess} from "@/utils/bullQ.util.js";
import type { InsertJob } from "@/db/schema.js";
import { getRandomUserAgent } from "@/utils/userAgents.js";

class Scrapper {
    private linkedinURL : string;

  constructor() {
    this.linkedinURL = "https://www.linkedin.com/jobs/search/";
  }

  async searchJobs(
    userId : number,
    keyword : string = "reactjs",
    location : string = "india",
    experienceLevel : string = "",
    remote : string = "",
    jobType : string = "",
    easyApply : boolean = true,
    time : number = 3600
  ) {
    const linkedinURL = this.__makeLinkedinURL(
      keyword,
      location,
      experienceLevel,
      remote,
      jobType,
      easyApply,
      time
    );
    console.log(linkedinURL)
    const { browser, page } = await this.__initBrowser();
    try {
      const linkedinHTML = await this.__gotoAndGetHTML(page, linkedinURL);
      let jobLinks = this.__getJobLinks(linkedinHTML); 
      console.log(`Found ${jobLinks.length} job links. Adding to queue...`);
      for (const link of jobLinks) {
        await addURLJobProcess({ userId, url: link });
      } 

    } finally {
      await browser.close();
    }
  }

  public async getJobDetailsFromLink(link : string) : Promise<Partial<InsertJob>> {
    const { browser, page } = await this.__initBrowser();
    let result : Partial<InsertJob> = {};
    try {
      const normalized = this.__normalizeLinkedinLink(link);
      const html = await this.__gotoAndGetHTML(page, normalized);
      let details = await this.__extractJobDetails(html);
      const {description, jobTitle} = details;
      if(description === '' || jobTitle === '') throw new Error('Failed to extract essential job details');
        result = details;
      } 
    catch (error : unknown) {
      console.error(`Error processing job link ${link}:`, (error as Error)?.message);
    }
    finally {
      await browser.close();
    }
    return result;
  }

  private __makeLinkedinURL(
    keyword = "reactjs",
    location = "india",
    experienceLevel = "",
    remote = "",
    jobType = "",
    easyApply = true,
    time = 3600
  ) {
    let linkedinURL = this.linkedinURL + "?f_TPR=r" + time;

    if (keyword) linkedinURL += `&keywords=${keyword}`;
    if (location) linkedinURL += `&location=${location}`;

    if (experienceLevel !== "") {
      const transformExperience = experienceLevel
        .split(",")
        .map((exp) => {
          switch (exp.trim().toLowerCase()) {
            case "internship":
              return 1;
            case "entry level":
              return 2;
            case "associate":
              return 3;
            case "mid-senior level":
              return 4;
            case "director":
              return 5;
            case "executive":
              return 6;
            default:
              return "";
          }
        })
        .filter(Boolean);

      linkedinURL += `&f_E=${transformExperience.join(",")}`;
    }

    if (remote.length !== 0) {
      const transformedRemote = remote
        .split(",")
        .map((e) => {
          switch (e.trim().toLowerCase()) {
            case "remote":
              return "2";
            case "hybrid":
              return "3";
            case "on-site":
              return "1";
            default:
              return "";
          }
        })
        .filter(Boolean);

      linkedinURL += `&f_WT=${transformedRemote.join(",")}`;
    }

    if (jobType !== "") {
      const transformedJobType = jobType
        .split(",")
        .map((type) => type.trim().charAt(0).toUpperCase());

      linkedinURL += `&f_JT=${transformedJobType.join(",")}`;
    }

    if (easyApply) linkedinURL += `&f_EA=true`;

    return linkedinURL;
  }

  private async __initBrowser() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      getRandomUserAgent()
    );
    return { browser, page };
  }

  private async __gotoAndGetHTML(page : Page, url : string) {
    // console.log("🌐 Navigating to LinkedIn page...");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await this.__delay(500);
// 
    try {
      if (/\/jobs\/search\//.test(url)) {
        await page.waitForSelector('ul.jobs-search__results-list', { timeout: 5000 });
      } else if (/\/jobs\/view\//.test(url)) {
        await page.waitForSelector('.show-more-less-html, .description__text', { timeout: 5000 });
      }
    } catch {}
// 
    // Only scroll on search results page to load more cards
    if (/\/jobs\/search\//.test(url)) {
      try {
        await this.__autoScroll(page);
      } catch {}
    }
    return await page.content();
  }

  private async __autoScroll(page : Page) {
    const maxIterations = 40; // ~6s with 150ms pauses
    let lastHeight = await page.evaluate(() => document.body.scrollHeight);
    for (let i = 0; i < maxIterations; i++) {
      // Scroll step
      await page.evaluate(() => window.scrollBy(0, 600));
      await this.__delay(150);
      // Check height growth
      const newHeight = await page.evaluate(() => document.body.scrollHeight);
      if (newHeight <= lastHeight) {
        break;
      }
      lastHeight = newHeight;
    }
  }

  private __delay(ms : number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private __cleanText(text = ""){
    if (!text) return "";
    return String(text).replace(/\s+/g, " ").trim();
  }
  private __getJobLinks(htmlData : string) : string[]{
    const $ = cheerio.load(htmlData.toString());
    const jobSet = new Set();
    const links : string[] = [];
    $('ul.jobs-search__results-list a.base-card__full-link').each((_, el) => {
      const link = $(el).attr("href") || "";
      if (link.length === 0) return;
      if (jobSet.has(link)) return;
      if (!/linkedin\.com\/jobs\/view\//.test(link)) return;
      jobSet.add(link);
      links.push(link);
    });
    return links;

  }

  private __normalizeLinkedinLink(link = ""){
    if (!link) return link;
    try {
      const url = new URL(link.startsWith("http") ? link : `https://${link}`);
      url.hostname = "www.linkedin.com";
      return url.toString();
    } catch {
      return link;
    }
  }


  private async __extractJobDetails(html : string){
    const $ = cheerio.load(html);
    const companyDetailsDiv = $('.topcard__flavor-row');
    const jobTitle = this.__cleanText($('.top-card-layout__title, h1.topcard__title').first().text());
    const companyName = this.__cleanText(
      companyDetailsDiv.eq(0).find('.topcard__org-name-link, a.topcard__org-name-link').first().text()
    );
    const location = this.__cleanText(
      companyDetailsDiv.eq(0).find('.topcard__flavor-row, .topcard__flavor--bullet').first().text()
    );
    const description = this.__cleanText($('.show-more-less-html, .description__text').first().text());
    const applicants = this.__cleanText(
      companyDetailsDiv.eq(1).find('.num-applicants__caption, .num-applicants__text').first().text()
    );
    const postedTime = this.__cleanText(
      companyDetailsDiv.eq(1).find('.posted-time-ago__text, .posted-time-ago').first().text()
    );

    return {
      jobTitle, companyName, location, description, applicants, postedTime
    }
  }
}

export default Scrapper;