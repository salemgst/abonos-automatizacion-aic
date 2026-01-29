import ExcelJS from "exceljs";
import { config } from "../config";
import type { BankStatementData, BankMovement } from "../types/bank-data";
import * as fs from "node:fs";
import * as path from "path";
import { downloadFromSharePoint } from "./sharepoint";

/**
 * Load workbook from SharePoint, local debug file, or template
 *
 * Priority in production mode: SharePoint > Template
 * Priority in debug mode: Local debug file > Template
 *
 * @param bank - Bank name
 * @param currency - Currency
 * @param year - Year
 * @param sharePointPath - Full SharePoint folder path
 * @param debugMode - Debug mode flag
 * @returns ExcelJS Workbook
 */
export async function loadWorkbook(
    bank: string,
    currency: string,
    year: number,
    sharePointPath: string,
    debugMode: boolean = false
): Promise<ExcelJS.Workbook> {
    const templatePath = config.excel.templatePath;
    const fileName = `MOVIMIENTOS DE BANCO ${bank} ${currency} ${year}.xlsx`;
    const workbook = new ExcelJS.Workbook();

    if (debugMode) {
        // Debug mode: check local debug file first
        const localPath = path.join(config.debug.outputDir, fileName);

        if (fs.existsSync(localPath)) {
            console.log(`  📂 Cargando archivo local existente: ${fileName}`);
            await workbook.xlsx.readFile(localPath);
            return workbook;
        }
    } else {
        // Production mode: try to download from SharePoint
        console.log(`  🔍 Buscando archivo en SharePoint...`);
        const sharePointBuffer = await downloadFromSharePoint(sharePointPath, fileName);

        if (sharePointBuffer) {
            console.log(`  📂 Cargando archivo existente de SharePoint`);
            // ExcelJS expects Node.js Buffer type, but Bun's Buffer is compatible at runtime
            // @ts-expect-error - Bun Buffer is compatible with Node Buffer at runtime
            await workbook.xlsx.load(sharePointBuffer);
            return workbook;
        }
    }

    // If no existing file found, load fresh template
    if (!fs.existsSync(templatePath)) {
        throw new Error(`❌ Template file not found: ${templatePath}\nPlease ensure the template file exists.`);
    }

    console.log(`  📄 Cargando plantilla nueva para año ${year}`);
    await workbook.xlsx.readFile(templatePath);
    return workbook;
}

/**
 * Populate worksheet with bank statement data
 * Inserts data starting from row 7 (data rows)
 * Data is sorted by date in ascending order
 */
export function populateWorksheet(worksheet: ExcelJS.Worksheet, data: BankStatementData[]): void {
    if (data.length === 0) {
        console.log("⚠️  No hay datos para insertar");
        return;
    }

    // Aggregate all movements from all statements
    const allMovements: BankMovement[] = data.flatMap(item => item.movements || []);

    if (allMovements.length === 0) {
        console.log("⚠️  No hay movimientos para insertar");
        return;
    }

    // Sort movements by date (ascending order)
    const sortedMovements = allMovements.sort((a, b) => {
        // Parse dates in dd/mm/yyyy format
        const parseDate = (dateStr: string): Date => {
            const [day, month, year] = dateStr.split('/').map(Number);
            return new Date(year, month - 1, day);
        };

        const dateA = parseDate(a.fecha);
        const dateB = parseDate(b.fecha);

        return dateA.getTime() - dateB.getTime(); // Ascending order
    });

    console.log(`  📅 Movimientos ordenados por fecha (ascendente)`);

    // Insert movements starting from row 7
    let currentRow = 7;
    sortedMovements.forEach(movement => {
        const row = worksheet.getRow(currentRow);

        row.getCell(1).value = movement.fecha;           // A: FECHA
        row.getCell(2).value = movement.detalle;         // B: DETALLE (Cuenta)
        row.getCell(3).value = movement.cargos;          // C: CARGOS (Monto)
        // D: ABONOS - left empty
        // E: SALDOS - left empty
        
        // F: NUM OP - Convert to number if possible
        const numOpValue = movement.numOp ? parseFloat(movement.numOp) : movement.numOp;
        row.getCell(6).value = isNaN(numOpValue as number) ? movement.numOp : numOpValue;
        
        row.getCell(7).value = movement.observacion;     // G: OBSERVACIÓN (Beneficiario)
        row.getCell(8).value = movement.documento;       // H: DOCUMENTO (Mensaje)

        row.commit();
        currentRow++;
    });

    console.log(`  ✅ ${sortedMovements.length} movimientos insertados`);
}

/**
 * Save workbook to debug output directory
 * Only used in debug mode - production mode uploads directly to SharePoint
 */
export async function saveWorkbook(
    workbook: ExcelJS.Workbook,
    fileName: string
): Promise<string> {
    const outputDir = config.debug.outputDir;

    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, fileName);
    await workbook.xlsx.writeFile(filePath);

    return filePath;
}

/**
 * Get workbook as buffer for SharePoint upload
 */
export async function getWorkbookBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}

// Re-export from monthly tab module
export { findMonthlyTab } from "./excel-monthly-tab";
