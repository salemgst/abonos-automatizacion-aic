import { cyan, yellow, green, magenta } from "ansis";
import { Table } from "console-table-printer";
import type { ParsedEmailData } from "../services/email-parser";

/**
 * Log parsed emails in a table format
 */
export function logParsedEmailsTable(parsedData: ParsedEmailData[]): void {
    const table = new Table({
        title: "📧 Correos Procesados",
        columns: [
            { name: "index", title: "#", alignment: "right" },
            { name: "banco", title: "Banco", alignment: "left" },
            { name: "moneda", title: "Moneda", alignment: "left" },
            { name: "monto", title: "Monto", alignment: "right" },
            { name: "beneficiario", title: "Beneficiario", alignment: "left" },
        ],
    });

    parsedData.forEach((parsed, index) => {
        table.addRow({
            index: index + 1,
            banco: parsed.bank || "NO DETECTADO",
            moneda: parsed.currency || "NO DETECTADO",
            monto: parsed.parsed?.monto || "0",
            beneficiario: parsed.parsed?.beneficiario?.substring(0, 35) || "N/A",
        });
    });

    table.printTable();
}

/**
 * Log parsed email details in debug mode (individual)
 */
export function logParsedEmail(
    parsed: ParsedEmailData,
    emailFrom: string,
    index: number
): void {
    console.log(cyan(`📧 Email ${index + 1}:`));
    console.log(`  De: ${emailFrom}`);
    console.log(`  Banco: ${parsed.bank || 'NO DETECTADO'}`);
    console.log(`  Moneda: ${parsed.currency || 'NO DETECTADO'}`);
    if (parsed.parsed) {
        console.log(`  Monto: ${parsed.parsed.monto}`);
        console.log(`  Beneficiario: ${parsed.parsed.beneficiario}`);
    }
}

/**
 * Log debug banner
 */
export function logDebugBanner(debugDir: string): void {
    console.log(yellow("\n🐛 MODO DEBUG ACTIVADO"));
    console.log(yellow("━".repeat(50)));
    console.log(yellow("• Los archivos se guardarán en ./debug-output"));
    console.log(yellow("• NO se subirá nada a SharePoint"));
    console.log(yellow("• Logging verbose habilitado"));
    console.log(yellow("━".repeat(50) + "\n"));
}

/**
 * Log no emails warning
 */
export function logNoEmailsWarning(): void {
    console.log(yellow("\n⚠️  No se encontraron correos para procesar"));
    console.log(yellow("\n💡 Verifica:"));
    console.log(yellow("   • Los remitentes en config.ts"));
    console.log(yellow("   • El buzón de correo"));
    console.log(yellow("   • El rango de fechas\n"));
}

/**
 * Log completion summary with table
 */
export function logCompletionSummary(
    generatedFiles: string[],
    debugMode: boolean
): void {
    if (generatedFiles.length === 0) {
        console.log(yellow("\n⚠️  No se generaron archivos\n"));
        return;
    }

    const table = new Table({
        title: "📁 Archivos Generados",
        columns: [
            { name: "index", title: "#", alignment: "right" },
            { name: "archivo", title: "Archivo", alignment: "left" },
            { name: "ubicacion", title: "Ubicación", alignment: "left" },
        ],
    });

    generatedFiles.forEach((file, index) => {
        const fileName = file.split(/[\\/]/).pop() || file;
        const location = debugMode ? "debug-output" : "SharePoint";
        
        table.addRow({
            index: index + 1,
            archivo: fileName,
            ubicacion: location,
        });
    });

    table.printTable();

    if (debugMode) {
        console.log(yellow("\n💡 Los archivos NO fueron subidos a SharePoint (modo debug)"));
        console.log(yellow("💡 Para ejecutar en producción, omite el flag --debug\n"));
    }
}

/**
 * Log bank-currency processing summary
 */
export function logBankCurrencySummary(
    bank: string,
    currency: string,
    emailCount: number,
    existingOps: number,
    emptyRows: number,
    newMovements: number,
    skipped: number
): void {
    const table = new Table({
        title: `${bank} - ${currency}`,
        columns: [
            { name: "concepto", title: "Concepto", alignment: "left" },
            { name: "cantidad", title: "Cantidad", alignment: "right", color: "cyan" },
        ],
    });

    table.addRows([
        { concepto: "Correos procesados", cantidad: emailCount },
        { concepto: "Operaciones existentes", cantidad: existingOps },
        { concepto: "Filas vacías disponibles", cantidad: emptyRows },
        { concepto: "Movimientos nuevos", cantidad: newMovements, color: "green" },
        { concepto: "Movimientos omitidos", cantidad: skipped, color: "yellow" },
    ]);

    table.printTable();
}
