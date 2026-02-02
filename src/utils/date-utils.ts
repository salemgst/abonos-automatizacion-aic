import { format } from "date-fns";
import { es } from "date-fns/locale";

export function getMonthName(month: number, formatStr: string = "MMMM"): string {
  const date = new Date(2000, month - 1, 1);
  return format(date, formatStr, { locale: es }).toUpperCase();
}
