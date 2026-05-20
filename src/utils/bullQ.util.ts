import { Queue, Worker } from "bullmq";
import { EMAIL, redisHost, redisPassword, redisPort, redisUser } from "@utils/config.util.js";
import Scrapper from "@/services/scrapper.service.js";
import { db } from "@db/index.js";
import { jobs, type InsertJob } from "@db/schema.js";
import AI from "@/services/ai.service.js";
import { prepareEmailBody, sendEmail } from "@/services/mail.service.js";


const redisConnection = {
    host: redisHost || 'localhost',
    port: redisPort || 6379,
    username: redisUser || undefined,
    password: redisPassword || undefined
};

const jobQueue = new Queue('job_links', { connection: redisConnection });
// Interfaces 

const suggestionQueue = new Queue('suggestions', { connection: redisConnection });

const scrapper = new Scrapper();

export interface JobLinkData {
    userId: number
    url: string
    jobTitle?: string
    companyName?: string
    location?: string
    description?: string
    applicants?: string
    postedTime?: string
}

const ai = new AI();

export async function initJobURLWorker() {
    const jobURLWorkder = new Worker<JobLinkData>('job_links', async (job) => {
        console.info(`Processing job ${job.id} with data:`);
        const data: JobLinkData = job.data;
        console.info(job.data);
        try {
            const url = data?.url;
            if (!url) {
                throw new Error('Missing url in job data');
            }
            console.info(`Processing URL: ${url}`);
            const result = await scrapper.getJobDetailsFromLink(url);
            result.url = url;
            const res = await ai.compareJOBDescriptions(result.description ?? "No description provided");
            const emailBody = prepareEmailBody(res, result);
            console.info('Email: ', EMAIL)
            const insertData: InsertJob = {
                jobTitle: result.jobTitle ?? "Unknown",
                companyName: result.companyName ?? "Unknown",
                location: result.location ?? "Unknown",
                description: result.description ?? "No description available",
                applicants: result.applicants ?? "0",
                postedTime: result.postedTime ?? new Date().toISOString(),
                url: result.url ?? "",
                unqURL: (data.url ?? "").split('?')[0] || '',            
            };
            
            const inserted = await db
                .insert(jobs)
                .values(insertData)
                .onConflictDoNothing({
                    target: jobs.unqURL,
                })
                .returning();
            if(inserted.length === 0){
                console.info(`Job with URL ${data.url} already exists in the database. Skipping insertion.`);
                return { success: false, message: "Job already exists." };
            } 
            sendEmail(EMAIL, `New Job Processed: ${result.jobTitle ?? "Unknown Position"}`, emailBody);
                
            return {
                success: true,
            };
        } catch (error) {
            console.error(`Error processing job ${job.id}:`);
            throw error;
        }

    }, {
        connection: redisConnection, removeOnComplete: {
            count: 0
        }, removeOnFail: {
            count: 0
        },
        concurrency: 1,
        limiter: {
            max: 1,
            duration: 300000,
        },
        runRetryDelay: 300000
    });

    // Event listeners
    jobURLWorkder.on('completed', async (job) => {

            console.info(`Job ${job.id} completed successfully.`);

    });

    jobURLWorkder.on('failed', (job, err) => {
        console.error(`Job ${job?.id} failed with error:`, err?.message);
    });

    jobURLWorkder.on('error', (err) => {
        console.error('Worker error:', err);
    });

    console.log('Job URL worker initialized');
    return jobURLWorkder;
}

export async function addURLJobProcess(data: JobLinkData) {
    const result = await jobQueue.add('job_links', data, {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 300000, // 5 minutes
        },
        removeOnComplete: {
            count: 0
        },
        removeOnFail: {
            count: 0
        }
    });
}

export async function addSuggestionJobProcess(data: JobLinkData) {
    const result = await suggestionQueue.add('suggestions', data);
}

export async function initSuggestionWorker() {
    const suggestionWorker = new Worker<{ userId: number, job: InsertJob }>('suggestions', async (job) => {
        const data = job.data;
        console.info(`Processing suggestion for user ${data.userId} and job ${data.job.jobTitle}`);
        // Process the suggestion (e.g., generate AI-based suggestions)
        return { success: true };
    }, { connection: redisConnection });

    suggestionWorker.on('completed', (job) => {
        console.info(`Suggestion job ${job.id} completed successfully.`);
    });

    suggestionWorker.on('failed', (job, err) => {
        console.error(`Suggestion job ${job?.id} failed with error:`, err?.message);
    });

    suggestionWorker.on('error', (err) => {
        console.error('Suggestion worker error:', err);
    });

    console.log('Suggestion worker initialized');
    return suggestionWorker;
}