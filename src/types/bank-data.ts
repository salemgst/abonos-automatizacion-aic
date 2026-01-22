import type { RawEmailData } from "./email-parser";

// Types for bank movement data

export interface BankMovement {
    fecha: string;           // Fecha del movimiento (del correo: "Fecha y hora")
    detalle: string;         // Cuenta de origen (del correo: "Cuenta" en Datos de origen)
    cargos: number | null;   // Monto de cargo (del correo: "Monto")
    abonos: number | null;   // Monto de abono (no se usa por ahora, null)
    saldos: number | null;   // Saldo (no se usa por ahora, null)
    numOp: string;           // Número de operación (del correo: "Número de operación")
    observacion: string;     // Beneficiario (del correo: "Beneficiario" en Datos de destino)
    documento: string;       // Mensaje (del correo: "Mensaje")
}

export interface BankStatementData {
    bank: string;            // BCP, INTERBANK, etc.
    currency: string;        // SOLES, DOLARES
    accountNumber: string;   // Número de cuenta
    month: string;           // Mes (e.g., "ENERO")
    year: number;            // Año
    saldoInicial: number;    // Saldo inicial del mes
    movements: BankMovement[]; // Lista de movimientos
}

/**
 * Extract date in dd/mm/yyyy format from datetime string
 * Examples:
 * - "13/01/2026 - 10:35 a. m." -> "13/01/2026"
 * - "21/01/2026 - 11:16 a. m." -> "21/01/2026"
 */
function extractDateOnly(dateTimeString: string): string {
    // Extract date part before the dash
    const match = dateTimeString.match(/^(\d{1,2}\/\d{1,2}\/\d{4})/);
    return match ? match[1] : dateTimeString;
}

/**
 * Map parsed email data to BankStatementData structure
 * 
 * Cada correo = 1 movimiento bancario
 * Se crean los 6 campos que van al Excel
 */
export function mapEmailDataToBankStatement(parsedEmail: RawEmailData): BankStatementData | null {
    try {
        // Crear UN movimiento por correo
        const movement: BankMovement = {
            fecha: extractDateOnly(parsedEmail.fecha || ''),  // "13/01/2026"
            detalle: parsedEmail.cuenta || '',        // "194-XXXXXX4-0-19"
            cargos: parsedEmail.monto || null,        // 218.30
            abonos: null,                             // No se usa
            saldos: null,                             // No se usa
            numOp: parsedEmail.numOperacion || '',    // "00061864"
            observacion: parsedEmail.beneficiario || '', // "PULSO CORPORACION..."
            documento: parsedEmail.mensaje || ''      // "PAGO DE EMO..."
        };

        // TODO: Detectar mes y año del correo (por ahora usa fecha actual)
        const now = new Date();
        const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
            'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
        const monthName = monthNames[now.getMonth()];

        if (!monthName) {
            throw new Error('Invalid month index');
        }

        return {
            bank: parsedEmail.bank || 'BCP',
            currency: parsedEmail.currency || 'SOLES',
            accountNumber: parsedEmail.cuenta || '',
            month: monthName,
            year: now.getFullYear(),
            saldoInicial: 0,  // No se extrae del correo
            movements: [movement] // Array con UN solo movimiento
        };
    } catch (error) {
        console.error("Error mapping email data:", error);
        return null;
    }
}
