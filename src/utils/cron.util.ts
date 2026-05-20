import nodeCron from "node-cron";
import {CRON_EXPRESSION} from "@utils/config.util.js";

export const scheduleTasks = (cronExpression: string, task: () => void) => {
    nodeCron.schedule(cronExpression, task);
}


export const everyHourTask = (task: () => void) => {
    console.log('Scheduling task to run every hour');
    scheduleTasks(CRON_EXPRESSION, task);
}