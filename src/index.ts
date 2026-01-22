import { Command } from "commander";
import ora from "ora";
import { bold, green, red, cyan } from "ansis";
import { config, MONTH_NAMES, getEnabledBankCurrencies } from "./config";
import { getFilteredEmails } from "./services/ms";
import { parseAndFilterEmails } from "./workflows/process-emails";
import { processBankCurrency } from "./workflows/process-bank-currency";
import { validateMonth, ensureDirectoryExists } from "./utils/validation";
import { logDebugBanner, logNoEmailsWarning, logCompletionSummary } from "./utils/logger";

const program = new Command();

program
    .name("abonos-aic")
    .description("Sistema de procesamiento de correos y generación de reportes Excel")
    .version("1.0.0");

program
    .option("-y, --year <year>", "Año específico (default: año actual)")
    .option("-m, --month <month>", "Mes específico 1-12 (default: mes actual)")
    .option("-d, --debug", "Modo debug: no sube a SharePoint, guarda en ./debug-output")
    .action(async (options) => {
        const spinner = ora();
        const debugMode = options.debug || false;

        try {
            // Setup debug mode
            if (debugMode) {
                const debugDir = config.debug.outputDir || "./debug-output";
                logDebugBanner(debugDir);
                ensureDirectoryExists(debugDir);
                console.log(cyan(`📁 Directorio creado: ${debugDir}\n`));
            }

            // Determine year and month
            const now = new Date();
            const year = options.year ? parseInt(options.year) : now.getFullYear();
            const month = options.month ? parseInt(options.month) : now.getMonth() + 1;

            // Validate month
            validateMonth(month);

            const monthName = MONTH_NAMES[month - 1];
            console.log(bold(cyan(`\n📧 Procesando correos de ${monthName} ${year}`)));
            console.log(cyan(`📬 Buzón: ${config.email.targetUserId}`));
            if (debugMode) {
                console.log(cyan(`� Remitentes: ${config.email.allowedSenders.join(", ")}`));
            }
            console.log();

            // Step 1: Fetch emails
            spinner.start("Obteniendo correos filtrados...");
            const emails = await getFilteredEmails(
                config.email.allowedSenders,
                year,
                month,
                config.email.targetUserId
            );
            spinner.succeed(green(`✅ ${emails.length} correos encontrados`));

            if (emails.length === 0) {
                if (debugMode) {
                    logNoEmailsWarning();
                } else {
                    console.log(cyan("\n⚠️  No se encontraron correos para procesar\n"));
                }
                return;
            }

            // Step 2: Parse and filter emails
            const validParsedData = await parseAndFilterEmails(emails, debugMode);

            if (validParsedData.length === 0) {
                console.log(cyan("\n⚠️  No hay correos válidos para procesar\n"));
                return;
            }

            // Step 3: Get enabled bank-currency combinations
            const bankCurrencies = getEnabledBankCurrencies();
            console.log(cyan(`\n📊 Generando ${bankCurrencies.length} archivos Excel:\n`));

            // Step 4: Process each bank-currency combination
            const generatedFiles: string[] = [];
            for (const { bank, currency } of bankCurrencies) {
                const filePath = await processBankCurrency(
                    bank,
                    currency,
                    year,
                    month,
                    validParsedData,
                    debugMode
                );
                
                if (filePath) {
                    generatedFiles.push(filePath);
                }
            }

            // Step 5: Show completion summary
            console.log(bold(green("\n✨ Proceso completado exitosamente\n")));
            logCompletionSummary(generatedFiles, debugMode);

        } catch (error) {
            spinner.fail(red("❌ Error en el proceso"));

            if (error instanceof Error) {
                console.error(red(`\nError: ${error.message}`));
                if (config.debug.verboseLogging || debugMode) {
                    console.error(red("\nStack trace:"));
                    console.error(error.stack);
                }
            } else {
                console.error(red("\nError desconocido"));
                console.error(error);
            }

            process.exit(1);
        }
    });

program.parse();
