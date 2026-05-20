import {config} from 'dotenv';
config();

export const PORT : Number = Number(process.env.PORT) || 3000;
export const telegramBotToken : string = process.env.TELEGRAM_TOKEN || '';
export const openaiApiKey : string = process.env.OPENAI_API_KEY || '';
export const redisUrl : string = process.env.REDIS_URL || 'redis://localhost:6379';
export const redisUser : string = process.env.REDIS_USER || '';
export const redisPassword : string = process.env.REDIS_PASSWORD || '';
export const redisHost : string = process.env.REDIS_HOST || 'localhost';
export const redisPort : number = Number(process.env.REDIS_PORT) || 6379;
export const dbURL : string = process.env.DATABASE_URL || '';
export const email : string = process.env.EMAIL_USER || '';
export const emailPass : string = process.env.EMAIL_PASS || '';
export const EMAIL : string = process.env.EMAIL_RECEIVER || "keyon38493@hidevak.com";
export const CRON_EXPRESSION : string = process.env.CRON_EXPRESSION || "0 * * * *";