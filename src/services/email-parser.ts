import * as cheerio from "cheerio";
import { mapEmailDataToBankStatement } from "../types/bank-data";
import type { ParsedEmailData, RawEmailData, ParsedTextData } from "../types/email-parser";

// ============================================================================
// ABSTRACT BASE CLASS
// ============================================================================

/**
 * Abstract base class for bank-specific email parsers
 * Each bank must extend this class and implement the abstract methods
 */
abstract class BankEmailParser {
    /**
     * Bank identifier (e.g., 'BCP', 'INTERBANK')
     */
    abstract readonly bankName: string;

    /**
     * Detect if this parser can handle the given email
     * @param $ - Cheerio instance with loaded HTML
     * @param emailFrom - Email sender address
     * @returns true if this parser can handle the email
     */
    abstract detect($: cheerio.CheerioAPI, emailFrom?: string): boolean;

    /**
     * Parse the email HTML and extract transaction data
     * @param $ - Cheerio instance with loaded HTML
     * @returns Parsed transaction data (without bank and currency)
     */
    abstract parse($: cheerio.CheerioAPI): Omit<RawEmailData, 'bank' | 'currency'>;

    /**
     * Detect currency from email content
     * @param $ - Cheerio instance with loaded HTML
     * @returns Currency code ('SOLES', 'DOLARES') or undefined
     */
    abstract detectCurrency($: cheerio.CheerioAPI): string | undefined;

    /**
     * Parse the complete email and return structured data
     * @param htmlBody - Raw HTML content
     * @param emailFrom - Email sender address
     * @returns Parsed email data with bank statement
     */
    parseEmail(htmlBody: string, emailFrom?: string): ParsedEmailData {
        try {
            const $ = cheerio.load(htmlBody);

            // Parse transaction data
            const parsedData = this.parse($);
            const currency = this.detectCurrency($);

            const rawData: RawEmailData = {
                bank: this.bankName,
                currency,
                ...parsedData
            };

            // Map to BankStatementData
            const bankStatement = mapEmailDataToBankStatement(rawData);

            return {
                rawHtml: htmlBody,
                bank: this.bankName,
                currency,
                bankStatement,
                parsed: rawData,
            };
        } catch (error) {
            console.error(`Error parsing ${this.bankName} email:`, error);
            return {
                rawHtml: htmlBody,
                bank: this.bankName,
                currency: undefined,
                bankStatement: null,
                parsed: null,
            };
        }
    }
}

// ============================================================================
// BCP PARSER IMPLEMENTATION
// ============================================================================

class BCPEmailParser extends BankEmailParser {
    readonly bankName = 'BCP';

    detect($: cheerio.CheerioAPI, emailFrom?: string): boolean {
        // Check email sender
        if (emailFrom?.toLowerCase().includes('bcp')) {
            return true;
        }

        // Check HTML content
        const bodyText = $('body').text();
        return bodyText.includes('BCP') || bodyText.includes('Banco de Crédito');
    }

    detectCurrency($: cheerio.CheerioAPI): string | undefined {
        const bodyText = $('body').text();

        if (bodyText.includes('Soles') || bodyText.includes('S/')) {
            return 'SOLES';
        }

        if (bodyText.includes('Dólares') || bodyText.includes('USD')) {
            return 'DOLARES';
        }

        return undefined;
    }

    parse($: cheerio.CheerioAPI): Omit<RawEmailData, 'bank' | 'currency'> {
        const tables = $('table');

        let fecha = '';
        let cuenta = '';
        let monto = 0;
        let numOperacion = '';
        let beneficiario = '';
        let mensaje = '';

        // Iterate through all table rows to find the data
        tables.each((_, table) => {
            $(table).find('tr').each((_, row) => {
                const cells = $(row).find('td');
                if (cells.length >= 2) {
                    const label = $(cells[1]).text().trim();
                    const value = $(cells[3]).text().trim();

                    switch (label) {
                        case 'Fecha y hora':
                            fecha = value;
                            break;
                        case 'Número de operación':
                            numOperacion = value;
                            break;
                        case 'Cuenta':
                            // First "Cuenta" is from "Datos de origen"
                            if (!cuenta) {
                                cuenta = value;
                            }
                            break;
                        case 'Beneficiario':
                            beneficiario = value;
                            break;
                        case 'Monto':
                            // Extract numeric value from "S/ 300.00"
                            monto = parseFloat(value.replace(/[^\d.]/g, '')) || 0;
                            break;
                        case 'Mensaje':
                            mensaje = value;
                            break;
                    }
                }
            });
        });

        return {
            fecha,
            cuenta,
            monto,
            numOperacion,
            beneficiario,
            mensaje
        };
    }
}

// ============================================================================
// INTERBANK PARSER IMPLEMENTATION (Template)
// ============================================================================

class InterbankEmailParser extends BankEmailParser {
    readonly bankName = 'INTERBANK';

    detect($: cheerio.CheerioAPI, emailFrom?: string): boolean {
        // Check email sender
        if (emailFrom?.toLowerCase().includes('interbank')) {
            return true;
        }

        // Check HTML content (case-insensitive)
        const bodyText = $('body').text().toLowerCase();
        return bodyText.includes('interbank');
    }

    detectCurrency($: cheerio.CheerioAPI): string | undefined {
        // TODO: Implement Interbank-specific currency detection
        const bodyText = $('body').text();

        if (bodyText.includes('Soles') || bodyText.includes('S/')) {
            return 'SOLES';
        }

        if (bodyText.includes('Dólares') || bodyText.includes('USD')) {
            return 'DOLARES';
        }

        return undefined;
    }

    parse($: cheerio.CheerioAPI): Omit<RawEmailData, 'bank' | 'currency'> {
        let fecha = '';
        let cuenta = '';
        let monto = 0;
        let numOperacion = '';
        let beneficiario = '';
        let mensaje = '';

        // Extract "Número de solicitud" and "Fecha/Hora" from the centered section
        const centerText = $('.content div[style*="text-align:center"]').text();

        // Extract operation number
        const numSolicitudMatch = centerText.match(/Número de solicitud:\s*(\d+)/);
        if (numSolicitudMatch) {
            numOperacion = numSolicitudMatch[1];
        }

        // Extract date and time
        const fechaMatch = centerText.match(/Fecha:\s*([\d\/]+)\s+Hora:\s*([\d:]+\s*[AP]\.M\.)/);
        if (fechaMatch) {
            fecha = `${fechaMatch[1]} - ${fechaMatch[2]}`;
        }

        // Parse the detail table
        const detailTable = $('table.detail');
        detailTable.find('tr').each((_, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 2) {
                const label = $(cells[0]).text().trim().replace(/\s+/g, ' ');
                const value = $(cells[1]).text().trim();

                if (label.includes('Cuenta de cargo')) {
                    // Extract account number from "Corriente Soles **********2540"
                    const cuentaMatch = value.match(/\*+(\d+)/);
                    if (cuentaMatch) {
                        cuenta = `**********${cuentaMatch[1]}`;
                    } else {
                        cuenta = value;
                    }
                } else if (label.includes('Para')) {
                    // Beneficiary name
                    beneficiario = value;
                } else if (label.includes('Monto')) {
                    // Extract numeric value from "S/ 10,592.00"
                    monto = parseFloat(value.replace(/[^\d.]/g, '')) || 0;
                }
            }
        });

        // Interbank doesn't have a "Mensaje" field in this format
        mensaje = '';

        return {
            fecha,
            cuenta,
            monto,
            numOperacion,
            beneficiario,
            mensaje
        };
    }
}

// ============================================================================
// PARSER REGISTRY
// ============================================================================

/**
 * Registry of all available bank parsers
 * Add new parsers here to support additional banks
 */
class BankParserRegistry {
    private parsers: BankEmailParser[] = [];

    constructor() {
        // Register all available parsers
        this.register(new BCPEmailParser());
        this.register(new InterbankEmailParser());
        // Add more parsers here as needed
    }

    /**
     * Register a new bank parser
     */
    register(parser: BankEmailParser): void {
        this.parsers.push(parser);
    }

    /**
     * Find the appropriate parser for the given email
     */
    findParser($: cheerio.CheerioAPI, emailFrom?: string): BankEmailParser | undefined {
        return this.parsers.find(parser => parser.detect($, emailFrom));
    }

    /**
     * Get all registered parsers
     */
    getAllParsers(): readonly BankEmailParser[] {
        return this.parsers;
    }
}

// ============================================================================
// MAIN PARSER FUNCTIONS
// ============================================================================

// Singleton instance of the parser registry
const parserRegistry = new BankParserRegistry();

/**
 * Parse email HTML body using bank-specific parsers
 * 
 * Cada correo contiene UNA SOLA operación bancaria.
 * Se extraen 6 campos del correo:
 * 1. Fecha y hora
 * 2. Cuenta (origen)
 * 3. Monto
 * 4. Número de operación
 * 5. Beneficiario
 * 6. Mensaje
 */
export function parseEmailHtml(htmlBody: string, emailFrom?: string): ParsedEmailData {
    try {
        const $ = cheerio.load(htmlBody);

        // Find appropriate parser
        const parser = parserRegistry.findParser($, emailFrom);

        if (!parser) {
            console.warn('Could not detect bank from email');
            return {
                rawHtml: htmlBody,
                bank: undefined,
                currency: undefined,
                bankStatement: null,
                parsed: null,
            };
        }

        // Parse using bank-specific parser
        return parser.parseEmail(htmlBody, emailFrom);

    } catch (error) {
        console.error("Error parsing HTML:", error);
        return {
            rawHtml: htmlBody,
            bank: undefined,
            currency: undefined,
            bankStatement: null,
            parsed: null,
        };
    }
}

/**
 * Parse plain text email body
 * Fallback for emails without HTML
 */
export function parseEmailText(textBody: string): ParsedTextData {
    try {
        // TODO: Implement text parsing logic if needed
        return {
            rawText: textBody,
            parsed: null,
        };
    } catch (error) {
        console.error("Error parsing text:", error);
        return {
            rawText: textBody,
            parsed: null,
        };
    }
}

// Export types and classes for external use
export type { ParsedEmailData, RawEmailData, ParsedTextData };
export { BankEmailParser, BankParserRegistry, BCPEmailParser, InterbankEmailParser };
