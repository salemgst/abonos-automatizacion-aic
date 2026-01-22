import ora from "ora";
import { green, cyan, yellow, magenta } from "ansis";
import { filterByBankAndCurrency } from "../utils/email-filter";
import { loadWorkbook, findMonthlyTab, populateWorksheet, saveWorkbook, getWorkbookBuffer } from "../services/excel";
import { uploadToSharePoint } from "../services/sharepoint";
import { generateFileName, getSharePointPath } from "../config";
import type { BankName, Currency } from "../config";
import type { ParsedEmailData } from "../services/email-parser";

/**
 * Process a single bank-currency combination
 */
export async function processBankCurrency(
    bank: BankName,
    currency: Currency,
    year: number,
    month: number,
    validParsedData: ParsedEmailData[],
    debugMode: boolean
): Promise<string | null> {
    const spinner = ora();
    
    console.log(magenta(`\n▶ Procesando: ${bank} - ${currency}`));

    // Filter data for this bank and currency
    spinner.start(`Filtrando datos para ${bank} ${currency}...`);
    const filteredData = filterByBankAndCurrency(validParsedData, bank, currency);
    spinner.succeed(green(`✅ ${filteredData.length} correos para ${bank} ${currency}`));

    // Extract bank statements from filtered data
    const bankStatements = filteredData
        .map(item => item.bankStatement)
        .filter(statement => statement !== null && statement !== undefined);

    // Skip if no valid bank statements for this combination
    if (bankStatements.length === 0) {
        console.log(yellow(`  ⚠️  Sin datos válidos para ${bank} ${currency}, omitiendo...`));
        return null;
    }

    console.log(cyan(`  📄 ${bankStatements.length} estados de cuenta procesados`));

    // Get SharePoint path for this bank-currency-year combination
    const sharePointPath = getSharePointPath(bank, currency, year);
    console.log(cyan(`  📁 Ruta SharePoint: ${sharePointPath}`));

    // Load workbook (from SharePoint, local, or template)
    spinner.start(`Cargando workbook...`);
    const workbook = await loadWorkbook(bank, currency, year, sharePointPath, debugMode);
    spinner.succeed(green(`✅ Workbook cargado`));

    // Find monthly tab
    spinner.start("Buscando pestaña del mes...");
    const worksheet = await findMonthlyTab(workbook, year, month, bank, currency);
    spinner.succeed(green(`✅ Pestaña "${worksheet.name}" lista`));

    // Populate data
    spinner.start("Poblando datos...");
    populateWorksheet(worksheet, bankStatements);
    spinner.succeed(green("✅ Datos poblados"));

    // Generate file name
    const fileName = generateFileName(bank, currency, year);

    // Save file (location depends on debug mode)
    if (debugMode) {
        // Save to debug directory
        spinner.start("Guardando en debug-output...");
        const outputPath = await saveWorkbook(workbook, fileName, true);
        spinner.succeed(green(`✅ Guardado: ${outputPath}`));
        return outputPath;
    } else {
        // Save local backup
        spinner.start("Guardando backup local...");
        const localPath = await saveWorkbook(workbook, fileName, false);
        spinner.succeed(green(`✅ Guardado: ${localPath}`));

        // Upload to SharePoint
        spinner.start("Subiendo a SharePoint...");
        const buffer = await getWorkbookBuffer(workbook);
        await uploadToSharePoint(sharePointPath, fileName, buffer);
        spinner.succeed(green("✅ Subido a SharePoint"));
        
        return localPath;
    }
}
