# Design: Email PDF Excel Processor

## Context
Sistema que procesa correos electrónicos de remitentes específicos, extrae información de PDFs adjuntos, y genera reportes Excel organizados por mes. El sistema debe ser flexible para depuración y permitir búsquedas por fechas específicas.

## Goals / Non-Goals

### Goals
- Filtrar correos por remitente configurable
- Extraer datos de PDFs usando unpdf
- Generar Excel en memoria con múltiples pestañas mensuales
- CLI flexible con opciones de fecha
- Modo de depuración para desarrollo

### Non-Goals
- Procesamiento de otros formatos de archivo (solo PDF)
- Almacenamiento persistente de Excel (solo en memoria/archivo)
- Interfaz gráfica de usuario

## Decisions

### Decision: Use Cheerio for HTML parsing
**Why**: Librería jQuery-like para parsear y extraer datos del HTML del cuerpo de correos
**Alternatives considered**: 
- jsdom: Más pesado, simula DOM completo (innecesario)
- node-html-parser: Menos features y comunidad

### Decision: Use unpdf for PDF extraction
**Why**: Librería moderna y ligera para extracción de texto de PDFs en Node.js/Bun
**Status**: Implementada como función auxiliar para uso futuro, no en flujo principal actual
**Alternatives considered**: 
- pdf-parse: Más pesada, dependencias nativas
- pdfjs-dist: Más compleja de configurar

### Decision: Use exceljs for Excel generation
**Why**: Soporte completo para manipulación de Excel en memoria, sin dependencias de Office
**Alternatives considered**:
- xlsx: Menos features para manipulación avanzada
- node-xlsx: API más limitada

### Decision: Use Microsoft Graph for SharePoint upload
**Why**: Ya tenemos el SDK configurado, permite subir archivos a SharePoint Document Libraries
**Implementation**: Usar drives API para subir/actualizar archivos
**Alternatives considered**:
- SharePoint REST API: Más complejo, requiere autenticación adicional
- Manual FTP/WebDAV: No integrado con Microsoft 365

### Decision: Use Commander for CLI
**Why**: Estándar de facto para CLIs en Node.js, sintaxis declarativa
**Alternatives considered**:
- yargs: Más verboso
- minimist: Demasiado básico

### Decision: Date filtering defaults to current month
**Why**: Caso de uso más común es procesar el mes actual
**Implementation**: Usar date-fns para cálculos de fecha

### Decision: Config-based sender filtering
**Why**: Permite cambiar remitentes sin modificar código
**Implementation**: Array de emails en config.ts

## Architecture

```
┌─────────────┐
│   CLI       │ (Commander)
│  index.ts   │
└──────┬──────┘
       │
       ├──────────────────────────────────┐
       │                                  │
       ▼                                  ▼
┌─────────────┐                    ┌─────────────┐
│   Config    │                    │   MS Graph  │
│  config.ts  │                    │ services/ms │
└─────────────┘                    └──────┬──────┘
                                          │
                                          ▼
                                   ┌─────────────┐
                                   │ Email Parser│ (Flujo principal)
                                   │services/    │
                                   │email-parser │
                                   └──────┬──────┘
                                          │
                                          ▼
                                   ┌─────────────┐
                                   │Excel Generate│
                                   │services/excel│
                                   └──────┬──────┘
                                          │
                                          ▼
                                   ┌─────────────┐
                                   │  SharePoint │
                                   │   Upload    │
                                   │services/    │
                                   │ sharepoint  │
                                   └─────────────┘

                                   ┌─────────────┐
                                   │ PDF Extract │ (Uso futuro)
                                   │services/pdf │
                                   └─────────────┘
```

## Data Flow

1. **CLI Input**: Usuario ejecuta comando con --year/--month o usa defaults
2. **Config Load**: Cargar remitentes permitidos, SharePoint config y flags de debug
3. **Email Fetch**: Obtener correos del mes especificado filtrados por remitente
4. **Email HTML Parse**: Extraer datos del cuerpo HTML usando Cheerio (flujo principal)
5. **Excel Build**: 
   - Crear workbook en memoria
   - Crear pestaña base
   - Copiar y modificar para cada mes
   - Limpiar y nombrar pestañas
   - Poblar con datos extraídos del HTML
6. **SharePoint Upload**: Subir Excel a biblioteca de documentos (actualiza si existe)
7. **Output**: Confirmar subida exitosa

**Nota**: La función de extracción de PDFs está disponible pero no se usa en el flujo principal actual.

## Configuration Schema

```typescript
// config.ts
export const config = {
  email: {
    allowedSenders: string[],  // ["sender1@example.com", "sender2@example.com"]
  },
  sharepoint: {
    siteId: string,           // ID del sitio de SharePoint
    driveId: string,          // ID de la biblioteca de documentos
    folderPath: string,       // Ruta de carpeta dentro de la biblioteca
    fileName: string,         // Nombre del archivo Excel (puede incluir fecha)
  },
  debug: {
    manualExcelCreation: boolean,  // true = crear Excel manualmente para debug
    skipUpload: boolean,           // true = no subir a SharePoint (solo local)
  },
  excel: {
    outputPath: string,  // Ruta de salida local del archivo (backup)
  }
}
```

## Risks / Trade-offs

### Risk: PDF parsing failures
**Mitigation**: 
- Validar formato de PDF antes de procesar
- Logging detallado de errores
- Continuar procesamiento con otros PDFs si uno falla

### Risk: Memory usage with large Excel files
**Mitigation**:
- Procesar en lotes si hay muchos correos
- Modo debug para limitar cantidad de datos

### Trade-off: In-memory vs streaming Excel
**Decision**: In-memory para simplicidad
**Rationale**: Casos de uso esperados no exceden límites de memoria

## Migration Plan

No aplica - nueva funcionalidad.

## Implementation Strategy

### Extensibility Points

El código debe estar estructurado con puntos de extensión claros para que la lógica específica de negocio pueda ser implementada posteriormente:

1. **Email HTML Parsing**: Función stub con Cheerio que retorna datos crudos del HTML, lista para ser extendida con selectores específicos (FLUJO PRINCIPAL)
2. **PDF Data Extraction**: Función preparada para uso futuro si se necesita procesar PDFs
3. **Excel Template**: Estructura base del Excel con headers y formato, lista para ser poblada
4. **Data Mapping**: Función placeholder para mapear datos de email a formato Excel
5. **Tab Update Logic**: Función preparada para recibir datos y actualizar celdas específicas

### Code Structure for Extension

```typescript
// services/email-parser.ts (FLUJO PRINCIPAL)
export function parseEmailHtml(htmlBody: string) {
  const $ = cheerio.load(htmlBody);
  // TODO: Implementar selectores específicos aquí
  return { rawHtml: htmlBody, parsed: null };
}

// services/pdf.ts (USO FUTURO)
export async function extractPdfData(pdfBuffer: Buffer) {
  const text = await extractText(pdfBuffer);
  // TODO: Implementar parsing específico aquí si se necesita en el futuro
  return { rawText: text, parsed: null };
}

// services/excel.ts
export function createBaseTemplate(worksheet: Worksheet) {
  // TODO: Definir estructura de columnas y headers
  worksheet.columns = [
    { header: 'Campo1', key: 'campo1', width: 15 },
    // Agregar más columnas según necesidad
  ];
}

export function populateTabWithData(worksheet: Worksheet, data: any[]) {
  // TODO: Implementar lógica de población de datos
  data.forEach(item => {
    worksheet.addRow(item);
  });
}
```

## Open Questions

Estas preguntas se responderán durante la implementación:
1. ¿Qué campos específicos se deben extraer de los PDFs? → Stub preparado en extractPdfData()
2. ¿Cuál es el formato esperado de las pestañas de Excel? → Template base en createBaseTemplate()
3. ¿Se necesita validación de datos extraídos? → Punto de extensión en data mapping
4. ¿Qué hacer con correos sin adjuntos PDF? → Skip con logging (ya especificado)
