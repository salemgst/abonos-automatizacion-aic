// Configuration file - Modify these values according to your needs

// Bank and currency configuration
export const BANKS = {
    BCP: {
        name: "BCP",
        currencies: ["SOLES", "DOLARES"],
        enabled: true,
    },
    INTERBANK: {
        name: "INTERBANK",
        currencies: ["SOLES"], // Can add "DOLARES" later
        enabled: true,
    },
    // CONTINENTAL: {
    //   name: "CONTINENTAL",
    //   currencies: ["SOLES", "DOLARES"],
    //   enabled: false, // Not implemented yet
    // },
} as const;

export type BankName = keyof typeof BANKS;
export type Currency = "SOLES" | "DOLARES";

// SharePoint paths - not all banks have all currencies
type SharePointPaths = Record<BankName, Partial<Record<Currency, string>>>;

export const config = {
    // Email filtering configuration
    email: {
        // Target mailbox user ID
        targetUserId: "proveedores@aic.pe",

        // List of allowed sender email addresses to filter
        allowedSenders: [
            "notificaciones@notificacionesbcp.com.pe",
            "bancaporinternet@empresas.interbank.pe",
        ] as string[],
    },

    // SharePoint upload configuration
    sharepoint: {
        // SharePoint site ID (get from SharePoint site settings)
        siteId: "jaicoscorp.sharepoint.com,4b6d8adb-9d5f-4eee-b1c3-8132c0bca293,cb3eca56-27d4-482b-a259-4f16904d1b46",

        // Document library drive ID (get from SharePoint library settings)
        driveId: "b!24ptS1-d7k6xw4EywLyik1bKPsvUJytIollPFpBNG0a2S5YJ2mUUTYF0kr5FeM1Z",

        // Base path for all bank statements (relative to the drive root, NOT including "Documents")
        // "Documents" is the name of the document library (drive), not a folder
        basePath: "CONTABILIDAD OPERATIVA/ESTADOS DE CUENTAS BANCARIOS",

        // Specific paths for each bank-currency combination
        // Pattern: basePath + "/" + path + "/" + year + "/" + filename
        paths: {
            BCP: {
                SOLES: "BCP SOLES",
                DOLARES: "BCP DOLARES"
            },
            INTERBANK: {
                SOLES: "INTERBANK"
            }
        } as SharePointPaths
    },

    // Excel generation configuration
    excel: {
        // Path to template file
        templatePath: "./plantilla/plantilla.xlsx",
    },

    // Debug and development flags
    debug: {
        // If true, enables verbose logging
        verboseLogging: true,

        // Local output directory for debug files
        outputDir: "./debug-output",
    },
};

// Helper to get month name in Spanish (uppercase)
export const MONTH_NAMES = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];

/**
 * Generate Excel file name for bank and currency
 * Format: "MOVIMIENTOS DE BANCO [BANK] [CURRENCY] [YEAR].xlsx"
 * 
 * Examples:
 * - "MOVIMIENTOS DE BANCO BCP SOLES 2025.xlsx"
 * - "MOVIMIENTOS DE BANCO BCP DOLARES 2025.xlsx"
 * - "MOVIMIENTOS DE BANCO INTERBANK SOLES 2025.xlsx"
 */
export function generateFileName(bank: BankName, currency: Currency, year: number): string {
    return `MOVIMIENTOS DE BANCO ${bank} ${currency} ${year}.xlsx`;
}

/**
 * Get all enabled bank-currency combinations
 */
export function getEnabledBankCurrencies(): Array<{ bank: BankName; currency: Currency }> {
    const combinations: Array<{ bank: BankName; currency: Currency }> = [];

    for (const [bankKey, bankConfig] of Object.entries(BANKS)) {
        if (bankConfig.enabled) {
            for (const currency of bankConfig.currencies) {
                combinations.push({
                    bank: bankKey as BankName,
                    currency: currency as Currency,
                });
            }
        }
    }

    return combinations;
}

/**
 * Get SharePoint folder path for a specific bank-currency-year combination
 * 
 * Note: The path is relative to the drive root. "Documents" is the drive name, not a folder.
 * 
 * Examples:
 * - BCP SOLES 2025: "CONTABILIDAD OPERATIVA/ESTADOS DE CUENTAS BANCARIOS/BCP SOLES/2025"
 * - BCP DOLARES 2025: "CONTABILIDAD OPERATIVA/ESTADOS DE CUENTAS BANCARIOS/BCP DOLARES/2025"
 * - INTERBANK SOLES 2025: "CONTABILIDAD OPERATIVA/ESTADOS DE CUENTAS BANCARIOS/INTERBANK/2025"
 */
export function getSharePointPath(bank: BankName, currency: Currency, year: number): string {
    const bankPaths = config.sharepoint.paths[bank];
    if (!bankPaths) {
        throw new Error(`No SharePoint path configured for bank: ${bank}`);
    }

    const folderName = bankPaths[currency];
    if (!folderName) {
        throw new Error(`No SharePoint path configured for ${bank} ${currency}`);
    }

    return `${config.sharepoint.basePath}/${folderName}/${year}`;
}
