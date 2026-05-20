import express, { urlencoded } from 'express';
import {PORT} from '@utils/config.util.js';
import {initJobURLWorker} from '@/utils/bullQ.util.js';
import Scrapper from '@/services/scrapper.service.js'
import {everyHourTask} from '@utils/cron.util.js';

const app = express();
initJobURLWorker();

// middlewares
app.use(express.json())
app.use(urlencoded({ extended: true }))

const scrapper = new Scrapper();
// Schedule the job URL worker to run every hour
everyHourTask(async () => {
    await scrapper.searchJobs(323432,
        "full stack developer OR frontend developer OR backend developer",
        "India",
        "internship,entry level,associate",
        "remote,hybrid,on-site",
        "full-time,internship",
    );
});


app.listen(PORT, ()=>{
    console.log(`Process running at ${PORT}`)
})