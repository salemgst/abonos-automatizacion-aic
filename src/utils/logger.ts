import { cyan, yellow } from "ansis";
import type { ParsedEmailData } from "../services/email-parser";

/**
 * Log parsed email details in debug mode
 */
export function logParsedEmail(
    parsed: ParsedEmailData,
    emailFrom: string,
    index: number
): void {
    console.log(cyan(`\n  📧 Email ${index + 1}:`));
    console.log(`     De: ${emailFrom}`);
    console.log(`     Banco: ${parsed.bank || 'NO DETECTADO'}`);
    console.log(`     Moneda: ${parsed.currency || 'NO DETECTADO'}`);
    if (parsed.parsed) {
        console.log(`     Monto: ${parsed.parsed.monto}`);
        console.log(`     Beneficiario: ${parsed.parsed.beneficiario}`);
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
 * Log completion summary
 */
export function logCompletionSummary(
    generatedFiles: string[],
    debugMode: boolean
): void {
    console.log(cyan(`\n📁 Archivos generados:`));
    generatedFiles.forEach(file => {
        const fileName = file.split(/[\\/]/).pop() || file;
        console.log(`   ✓ ${fileName}`);
    });
    console.log();

    if (debugMode) {
        console.log(yellow("💡 Los archivos NO fueron subidos a SharePoint (modo debug)"));
        console.log(yellow("💡 Para ejecutar en producción, omite el flag --debug\n"));
    }
}
