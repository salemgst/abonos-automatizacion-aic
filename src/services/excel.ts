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
 * - Reads existing operation numbers from column F to avoid duplicates
 * - Fills empty rows first, then appends at the end
 * - Preserves leading zeros in operation numbers by storing as text
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

    // Scan worksheet to find existing operations and empty rows
    const { existingOperations, emptyRows, lastRowWithData } = scanWorksheet(worksheet);

    console.log(`  📊 ${existingOperations.size} operaciones existentes`);
    console.log(`  📍 ${emptyRows.length} filas vacías disponibles`);

    // Filter out duplicates (both from Excel and within the batch)
    const newMovements = filterDuplicates(allMovements, existingOperations);

    if (newMovements.length === 0) {
        console.log("  ⚠️  Todos los movimientos ya están registrados");
        return;
    }

    const skippedCount = allMovements.length - newMovements.length;
    if (skippedCount > 0) {
        console.log(`  ⏭️  ${skippedCount} movimientos omitidos (duplicados)`);
    }

    // Sort by date (ascending)
    const sortedMovements = sortMovementsByDate(newMovements);

    // Insert movements into worksheet
    insertMovements(worksheet, sortedMovements, emptyRows, lastRowWithData);
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

/**
 * Scan worksheet to find existing operations and empty rows
 */
function scanWorksheet(worksheet: ExcelJS.Worksheet) {
    const existingOperations = new Set<string>();
    const emptyRows: number[] = [];
    let lastRowWithData = 6;

    for (let rowNum = 7; rowNum <= worksheet.rowCount; rowNum++) {
        const cell = worksheet.getRow(rowNum).getCell(6); // Column F (NUM OP)
        const value = cell.value;

        if (value !== null && value !== undefined && value !== "") {
            existingOperations.add(String(value).trim());
            lastRowWithData = rowNum;
        } else {
            emptyRows.push(rowNum);
        }
    }

    return { existingOperations, emptyRows, lastRowWithData };
}

/**
 * Filter out duplicate movements
 * Removes movements that already exist in Excel or are duplicated in the batch
 */
function filterDuplicates(
    movements: BankMovement[],
    existingOperations: Set<string>
): BankMovement[] {
    const seenInBatch = new Set<string>();

    return movements.filter(movement => {
        const numOp = movement.numOp ? String(movement.numOp).trim() : "";

        if (!numOp) return false;

        // Skip if already exists in Excel or in current batch
        if (existingOperations.has(numOp) || seenInBatch.has(numOp)) {
            return false;
        }

        seenInBatch.add(numOp);
        return true;
    });
}

/**
 * Sort movements by date (ascending)
 */
function sortMovementsByDate(movements: BankMovement[]): BankMovement[] {
    return movements.sort((a, b) => {
        const parseDate = (dateStr: string): Date => {
            const [day, month, year] = dateStr.split('/').map(Number);
            return new Date(year, month - 1, day);
        };

        return parseDate(a.fecha).getTime() - parseDate(b.fecha).getTime();
    });
}

/**
 * Insert movements into worksheet
 * Uses empty rows first, then appends at the end
 */
function insertMovements(
    worksheet: ExcelJS.Worksheet,
    movements: BankMovement[],
    emptyRows: number[],
    lastRowWithData: number
): void {
    let emptyRowIndex = 0;
    let currentLastRow = lastRowWithData;

    movements.forEach(movement => {
        // Use empty row if available, otherwise append at the end
        const targetRow = emptyRowIndex < emptyRows.length
            ? emptyRows[emptyRowIndex++]
            : ++currentLastRow;

        const row = worksheet.getRow(targetRow);

        row.getCell(1).value = movement.fecha;
        row.getCell(2).value = movement.detalle;
        row.getCell(3).value = movement.cargos;

        // NUM OP - Store as text to preserve leading zeros
        const numOpValue = movement.numOp ? String(movement.numOp).trim() : "";
        row.getCell(6).value = numOpValue;
        row.getCell(6).numFmt = '@'; // Text format

        row.getCell(7).value = movement.observacion;
        row.getCell(8).value = movement.documento;

        row.commit();
    });

    const inEmptyRows = Math.min(emptyRowIndex, movements.length);
    const atEnd = movements.length - inEmptyRows;

    console.log(`  ✅ ${movements.length} movimientos insertados (${inEmptyRows} en filas vacías, ${atEnd} al final)`);
}
