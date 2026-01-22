// Types for email parsing

/**
 * Raw data extracted from email HTML
 * Contains the 6 fields extracted from each email
 */
export interface RawEmailData {
    bank?: string;           // Banco detectado
    currency?: string;       // Moneda detectada
    fecha: string;           // "Fecha y hora" del correo
    cuenta: string;          // "Cuenta" de origen
    monto: number;           // "Monto" de la operación
    numOperacion: string;    // "Número de operación"
    beneficiario: string;    // "Beneficiario"
    mensaje: string;         // "Mensaje"
}

/**
 * Parsed email data with structured information
 */
export interface ParsedEmailData {
    rawHtml: string;
    bank?: string;
    currency?: string;
    bankStatement: import('./bank-data').BankStatementData | null;
    parsed: RawEmailData | null;
}

/**
 * Plain text email parsing result
 */
export interface ParsedTextData {
    rawText: string;
    parsed: null;
}
