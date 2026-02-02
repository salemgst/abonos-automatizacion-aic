import type { BankName, Currency } from "../config";

/**
 * Represents a file that failed to process
 */
export type FailedFile = {
  bank: BankName;
  currency: Currency;
};
