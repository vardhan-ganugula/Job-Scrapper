import nodeCron from "node-cron";
import { CRON_EXPRESSION } from "@utils/config.util.js";

export const scheduleTasks = async (
    cronExpression: string,
    task: () => void
) => {

    console.log("Scheduling cron:", cronExpression);

    nodeCron.schedule(cronExpression, async () => {
        console.log("task is running");

        try {
            await task();
        } catch (error) {
            console.error("Cron error:", error);
        }
    });
};

export const everyHourTask = (task: () => void) => {
    scheduleTasks("1 * * * *", task);
};