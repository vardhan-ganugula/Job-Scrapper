import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadResume(): string {
    const filePath = path.join(__dirname, "../resume.txt");

    const text = fs.readFileSync(filePath, "utf-8");

    return text;
}