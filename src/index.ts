import express, { urlencoded } from 'express';
import { PORT } from '@utils/config.util.js';
import { initJobURLWorker } from '@/utils/bullQ.util.js';
import Scrapper from '@/services/scrapper.service.js'
import { everyHourTask } from '@utils/cron.util.js';
import { config } from 'dotenv';
import { loadResume } from './utils/tools.util.js';
import puppeteer from 'puppeteer';
config();
const app = express();
initJobURLWorker();

// middlewares
app.use(express.json())
app.use(urlencoded({ extended: true }))

const scrapper = new Scrapper();
// Schedule the job URL worker to run every hour
everyHourTask(async () => {
    await scrapper.searchJobs(323432,
        "full stack developer OR devops",
        "India",
        "internship,entry level",
        "remote,hybrid,on-site",
        "full-time,internship",
    );
});

app.get('/', async (req, res) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--single-process",
            "--no-zygote"
        ]
    });
    const page = await browser.newPage();
    try {
        const result = await page.goto('https://in.linkedin.com/jobs/view/full-stack-engineer-at-bybond-4416120337?position=1&pageNum=0&refId=vKMFnFHfug3p0K5KIA4Y4w%3D%3D&trackingId=kKLHtSSIenG5cy%2BfNiF%2F9g%3D%3D:', {
            waitUntil: 'load'
        })
        
    } catch (error) {
        await page.screenshot({
            path: 'debug.png',
            fullPage: true
        })
    }
    res.send(loadResume())
})

app.listen(PORT, () => {
    console.log(`Process running at ${PORT}`)
})