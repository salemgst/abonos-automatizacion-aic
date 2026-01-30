import type { RawEmailData } from "./email-parser";
import { parse, format, getYear, isValid } from "date-fns";
import { es } from "date-fns/locale";

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
 */
function extractDateOnly(dateTimeString: string): string {
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
        // Extraer solo la fecha (sin hora) del correo
        const fechaStr = extractDateOnly(parsedEmail.fecha || '');
        
        // Si no hay fecha, retornar null (correo inválido)
        if (!fechaStr) {
            return null;
        }
        
        // Parsear la fecha a objeto Date para extraer mes y año
        const parsedDate = parse(fechaStr, "dd/MM/yyyy", new Date());
        
        // Si la fecha es inválida, retornar null
        if (!isValid(parsedDate)) {
            console.warn(`  ⚠️  Fecha inválida: "${fechaStr}"`);
            return null;
        }
        
        const date = parsedDate;

        // Crear UN movimiento por correo
        const movement: BankMovement = {
            fecha: fechaStr,
            detalle: parsedEmail.cuenta || '',
            cargos: parsedEmail.monto || null,
            abonos: null,
            saldos: null,
            numOp: parsedEmail.numOperacion || '',
            observacion: parsedEmail.beneficiario || '',
            documento: parsedEmail.mensaje || ''
        };

        return {
            bank: parsedEmail.bank || 'BCP',
            currency: parsedEmail.currency || 'SOLES',
            accountNumber: parsedEmail.cuenta || '',
            month: format(date, "MMMM", { locale: es }).toUpperCase(),  // "enero" -> "ENERO"
            year: getYear(date),                                        // Extraer año de la fecha del correo
            saldoInicial: 0,
            movements: [movement]
        };
    } catch (error) {
        console.error("Error mapping email data:", error);
        return null;
    }
}
