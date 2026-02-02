import ora from "ora";
import { green, cyan, magenta, yellow } from "ansis";
import { filterByBankAndCurrency } from "../utils/email-filter";
import {
  loadWorkbook,
  findMonthlyTab,
  populateWorksheet,
  saveWorkbook,
  getWorkbookBuffer,
} from "../services/excel";
import { uploadToSharePoint } from "../services/sharepoint";
import { generateFileName, getSharePointPath } from "../config";
import { logBankCurrencySummary } from "../utils/logger";
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
    .map((item) => item.bankStatement)
    .filter((statement) => statement !== null && statement !== undefined);

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
  const stats = populateWorksheet(worksheet, bankStatements);
  spinner.succeed(green("✅ Datos poblados"));

  // Show summary table
  logBankCurrencySummary(
    bank,
    currency,
    filteredData.length,
    stats.existingOps,
    stats.emptyRows,
    stats.newMovements,
    stats.skipped
  );

  // Generate file name
  const fileName = generateFileName(bank, currency, year);

  // Save file (location depends on debug mode)
  if (debugMode) {
    // Debug mode: save to local debug directory only
    spinner.start("Guardando en debug-output...");
    const outputPath = await saveWorkbook(workbook, fileName);
    spinner.succeed(green(`✅ Guardado: ${outputPath}`));
    return outputPath;
  } else {
    // Production mode: upload to SharePoint only (no local backup)
    spinner.start("Subiendo a SharePoint...");
    try {
      const buffer = await getWorkbookBuffer(workbook);
      await uploadToSharePoint(sharePointPath, fileName, buffer);
      spinner.succeed(green("✅ Subido a SharePoint"));
      return `SharePoint: ${sharePointPath}/${fileName}`;
    } catch (error) {
      // Handle specific SharePoint errors gracefully
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if it's a locked file error (HTTP 423)
      if (
        errorMessage.includes("423") ||
        errorMessage.includes("locked") ||
        errorMessage.includes("resourceLocked")
      ) {
        spinner.warn(yellow(`⚠️  Archivo bloqueado (alguien lo tiene abierto)`));
        console.log(
          yellow(`  ℹ️  Cierra el archivo Excel y vuelve a ejecutar para ${bank} ${currency}`)
        );
        return null; // Skip this file but continue with others
      }

      // Check for other common SharePoint errors
      if (errorMessage.includes("401") || errorMessage.includes("403")) {
        spinner.warn(yellow(`⚠️  Error de permisos en SharePoint`));
        console.log(yellow(`  ℹ️  Verifica los permisos para ${bank} ${currency}`));
        return null;
      }

      if (errorMessage.includes("404")) {
        spinner.warn(yellow(`⚠️  Carpeta o archivo no encontrado`));
        console.log(yellow(`  ℹ️  Verifica la ruta: ${sharePointPath}`));
        return null;
      }

      // For other errors, show warning but continue
      spinner.warn(yellow(`⚠️  Error al subir a SharePoint`));
      console.log(yellow(`  ℹ️  ${errorMessage.substring(0, 100)}...`));
      return null;
    }
  }
}
