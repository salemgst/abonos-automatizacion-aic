import ora from "ora";
import { green, cyan } from "ansis";
import { parseEmailHtml } from "../services/email-parser";
import { filterValidEmails } from "../utils/email-filter";
import { logParsedEmail } from "../utils/logger";
import { config } from "../config";
import type { Message } from "@microsoft/microsoft-graph-types";
import type { ParsedEmailData } from "../services/email-parser";

/**
 * Parse and filter emails
 */
export async function parseAndFilterEmails(
    emails: Message[],
    debugMode: boolean
): Promise<ParsedEmailData[]> {
    const spinner = ora();
    
    // Parse emails
    spinner.start("Parseando contenido HTML de correos...");
    const parsedData = emails.map((email, index) => {
        const htmlBody = email.body?.content || "";
        const emailFrom = email.from?.emailAddress?.address || "";
        const parsed = parseEmailHtml(htmlBody, emailFrom);

        // Debug: Log each parsed email
        if (debugMode && config.debug.verboseLogging) {
            logParsedEmail(parsed, emailFrom, index);
        }

        return parsed;
    });
    
    // Filter out invalid emails (zero amounts, etc.)
    const validParsedData = filterValidEmails(parsedData);
    const ignoredCount = parsedData.length - validParsedData.length;
    
    spinner.succeed(
        green(`✅ ${validParsedData.length} correos válidos (${ignoredCount} ignorados por monto 0)`)
    );

    return validParsedData;
}
