import type { ParsedEmailData } from "../services/email-parser";

/**
 * Filter out emails with invalid or zero amounts
 */
export function filterValidEmails(parsedData: ParsedEmailData[]): ParsedEmailData[] {
    return parsedData.filter(item => {
        // Skip if no parsed data
        if (!item.parsed) return false;
        
        // Skip if amount is 0 or invalid
        const amount = item.parsed.monto;
        if (amount === 0 || amount === null || amount === undefined) {
            return false;
        }
        
        return true;
    });
}

/**
 * Filter emails by bank and currency
 */
export function filterByBankAndCurrency(
    parsedData: ParsedEmailData[],
    bank: string,
    currency: string
): ParsedEmailData[] {
    return parsedData.filter(item => {
        const matchesBank = !item.bank || item.bank === bank;
        const matchesCurrency = !item.currency || item.currency === currency;
        return matchesBank && matchesCurrency;
    });
}
