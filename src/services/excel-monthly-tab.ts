import ExcelJS from "exceljs";
import { MONTH_NAMES } from "../config";

/**
 * Find and prepare the monthly tab from the workbook
 * The template should have all 12 months pre-created (ENERO, FEBRERO, ..., DICIEMBRE)
 */
export async function findMonthlyTab(
    workbook: ExcelJS.Workbook,
    year: number,
    month: number,
    bank: string,
    currency: string
): Promise<ExcelJS.Worksheet> {
    const monthName = MONTH_NAMES[month - 1];
    if (!monthName) {
        throw new Error(`Invalid month: ${month}. Must be between 1 and 12.`);
    }

    // Find the worksheet for this month
    const worksheet = workbook.worksheets.find(
        ws => ws.name.toLowerCase() === monthName.toLowerCase()
    );
    
    if (!worksheet) {
        throw new Error(
            `No se encontró la pestaña "${monthName}" en el workbook. ` +
            `La plantilla debe tener las 12 pestañas de meses (ENERO, FEBRERO, ..., DICIEMBRE).`
        );
    }

    console.log(`  📋 Pestaña encontrada: ${worksheet.name}`);
    
    // Replace placeholders in the worksheet
    replacePlaceholders(worksheet, monthName, year, bank, currency);
    
    return worksheet;
}

/**
 * Replace placeholders in worksheet cells
 * Supports: {MES}, {AÑO}, {BANK}, {CURRENCY}
 */
function replacePlaceholders(
    worksheet: ExcelJS.Worksheet,
    monthName: string,
    year: number,
    bank: string,
    currency: string
): void {
    worksheet.eachRow({ includeEmpty: true }, (row) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
            const cellValue = cell.value;
            
            // Handle simple string values
            if (typeof cellValue === 'string') {
                cell.value = cellValue
                    .replace(/{MES}/g, monthName)
                    .replace(/{AÑO}/g, year.toString())
                    .replace(/{BANK}/g, bank)
                    .replace(/{CURRENCY}/g, currency);
            }
            // Handle rich text (formatted text)
            else if (cellValue && typeof cellValue === 'object' && 'richText' in cellValue) {
                const richTextValue = cellValue as ExcelJS.CellRichTextValue;
                if (Array.isArray(richTextValue.richText)) {
                    const newRichText: ExcelJS.RichText[] = richTextValue.richText.map((segment) => {
                        if (segment.text && typeof segment.text === 'string') {
                            return {
                                ...segment,
                                text: segment.text
                                    .replace(/{MES}/g, monthName)
                                    .replace(/{AÑO}/g, year.toString())
                                    .replace(/{BANK}/g, bank)
                                    .replace(/{CURRENCY}/g, currency)
                            };
                        }
                        return segment;
                    });
                    cell.value = { richText: newRichText };
                }
            }
        });
        row.commit();
    });
}
