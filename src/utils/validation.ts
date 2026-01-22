import { red } from "ansis";

/**
 * Validate month parameter
 */
export function validateMonth(month: number): void {
    if (month < 1 || month > 12) {
        console.error(red("❌ Error: El mes debe estar entre 1 y 12"));
        process.exit(1);
    }
}

/**
 * Ensure directory exists
 */
export function ensureDirectoryExists(dirPath: string): void {
    const fs = require("fs");
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
