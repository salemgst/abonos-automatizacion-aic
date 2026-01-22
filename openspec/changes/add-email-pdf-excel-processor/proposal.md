# Change: Add Email PDF Excel Processor

## Why
El sistema necesita procesar correos electrónicos específicos que contienen PDFs con información de abonos, extraer datos de esos PDFs, y generar reportes en Excel organizados por mes con múltiples pestañas.

## What Changes
- Filtrado de correos por remitente configurable
- Extracción de datos del cuerpo HTML de correos usando Cheerio (flujo principal)
- Función preparada para extracción de PDFs usando unpdf (uso futuro)
- Generación de archivos Excel en memoria con exceljs
- Gestión de pestañas mensuales en Excel
- Subida automática del Excel a biblioteca de documentos de SharePoint
- CLI con Commander para especificar año/mes o usar fecha actual
- Modo de depuración manual configurable

## Impact
- Affected specs: email-processing, email-html-parsing, pdf-extraction (future use), excel-generation, sharepoint-upload, cli-interface
- Affected code: 
  - `src/config.ts` - Nueva configuración (SharePoint site, library)
  - `src/services/ms.ts` - Nuevas funciones de filtrado
  - `src/services/email-parser.ts` - Extracción de HTML con Cheerio (flujo principal)
  - `src/services/pdf.ts` - Función preparada para uso futuro
  - `src/services/excel.ts` - Nueva generación de Excel
  - `src/services/sharepoint.ts` - Subida de archivos a SharePoint
  - `src/index.ts` - Nueva CLI con Commander
