import { drizzle } from "drizzle-orm/neon-http";
import { dbURL } from "@utils/config.util.js";

export const db = drizzle(dbURL);