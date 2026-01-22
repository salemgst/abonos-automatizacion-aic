# Project Context

## Purpose
Sistema automatizado de procesamiento de estados de cuenta bancarios que:
- Procesa correos electrónicos de notificaciones bancarias (BCP, Interbank)
- Extrae información de movimientos bancarios del HTML de los correos
- Genera reportes Excel mensuales organizados por banco y moneda
- Integra con SharePoint para almacenamiento centralizado y versionado
- Mantiene estructura de carpetas organizada por banco, moneda y año

## Tech Stack
- **Runtime**: Bun v1.3.6 (JavaScript runtime rápido y compatible)
- **Language**: TypeScript 5+ (strict mode, sin tipos `any`)
- **Cloud Platform**: Microsoft Azure + SharePoint Online
- **APIs**: Microsoft Graph API v1.0
- **Authentication**: Azure Identity (Client Secret Credential)
- **Key Libraries**:
  - `@microsoft/msgraph-sdk` - SDK principal de Microsoft Graph
  - `@microsoft/msgraph-sdk-users` - Gestión de correos
  - `@microsoft/msgraph-sdk-sites` - SharePoint sites
  - `@microsoft/msgraph-sdk-drives` - SharePoint drives/document libraries
  - `@microsoft/microsoft-graph-types` - Tipos TypeScript para Graph API
  - `exceljs` - Generación y manipulación de archivos Excel
  - `cheerio` - Parsing de HTML (selectores CSS)
  - `date-fns` - Manipulación de fechas
  - `commander` - CLI con argumentos
  - `ora` - Spinners de terminal
  - `ansis` - Colores en terminal
  - `unpdf` - Extracción de texto de PDFs (preparado para uso futuro)

## Project Conventions

### Code Style
- **Formatter**: oxfmt para formateo de código
- **TypeScript Config**: 
  - Strict mode completo habilitado
  - Sin tipos `any` (excepto casos documentados de incompatibilidad SDK)
  - Todos los tipos explícitos
- **Module System**: ESM (ES Modules) con `"type": "module"`
- **Naming Conventions**:
  - Archivos: kebab-case (e.g., `email-parser.ts`, `process-bank-currency.ts`)
  - Funciones: camelCase descriptivo (e.g., `parseEmailHtml`, `ensureFolderExists`)
  - Constantes exportadas: UPPER_SNAKE_CASE para constantes globales
  - Tipos/Interfaces: PascalCase (e.g., `BankStatementData`, `ParsedEmailData`)

### Architecture Patterns

#### Estructura de carpetas
```
src/
├── config.ts              # Configuración centralizada (bancos, SharePoint, rutas)
├── index.ts               # CLI principal con Commander
├── msgraph.ts             # Cliente singleton de Microsoft Graph
├── services/              # Servicios que interactúan con APIs externas
│   ├── ms.ts              # Servicios de correo (filtrado, paginación)
│   ├── email-parser.ts    # Parsers por banco (OOP con herencia)
│   ├── excel.ts           # Operaciones Excel (load, populate, save)
│   ├── excel-monthly-tab.ts # Búsqueda y reemplazo de placeholders
│   ├── sharepoint.ts      # Upload/download SharePoint (HTTP directo)
│   └── pdf.ts             # Extracción PDF (preparado para futuro)
├── types/                 # Definiciones de tipos TypeScript
│   ├── bank-data.ts       # Tipos de datos bancarios
│   └── email-parser.ts    # Tipos de parsers
├── utils/                 # Utilidades reutilizables
│   ├── email-filter.ts    # Filtros de correos (por banco, moneda, monto)
│   ├── logger.ts          # Funciones de logging consistentes
│   └── validation.ts      # Validaciones (mes, directorios)
├── workflows/             # Workflows de alto nivel
│   ├── process-emails.ts  # Workflow de procesamiento de correos
│   └── process-bank-currency.ts # Workflow por banco-moneda
└── mappers/               # Transformadores de datos
    └── ms-email-to-simple-emal.ts # Mapeo de tipos MS Graph
```

#### Patrones de diseño
- **Singleton Pattern**: Cliente de Microsoft Graph inicializado una vez
- **Strategy Pattern**: Parsers de email por banco con clase base abstracta
- **Registry Pattern**: `BankParserRegistry` para gestionar múltiples parsers
- **Workflow Pattern**: Separación de lógica en workflows reutilizables
- **Separation of Concerns**: 
  - Services: Interacción con APIs
  - Utils: Lógica reutilizable
  - Workflows: Orquestación de procesos
  - Types: Definiciones de tipos

### Data Flow

1. **Entrada**: CLI con argumentos (año, mes, modo debug)
2. **Obtención de correos**: 
   - Filtrado por fecha (mes específico)
   - Filtrado por remitente (allowedSenders)
   - Paginación automática (sin límite)
3. **Parsing**: 
   - Detección automática de banco por remitente
   - Parser específico por banco (BCP, Interbank)
   - Detección de moneda por palabras clave
   - Extracción de datos con Cheerio (selectores CSS)
4. **Filtrado**: 
   - Validación de datos parseados
   - Exclusión de correos con monto = 0
5. **Agrupación**: Por banco y moneda (BCP SOLES, BCP DOLARES, INTERBANK SOLES)
6. **Generación Excel**:
   - Descarga de SharePoint (si existe)
   - Carga de archivo local (si existe)
   - Uso de plantilla (si no existe)
   - Búsqueda de pestaña mensual (ENERO-DICIEMBRE)
   - Reemplazo de placeholders ({MES}, {AÑO}, {BANK}, {CURRENCY})
   - Inserción de datos ordenados por fecha
7. **Almacenamiento**:
   - Backup local en `./output` o `./debug-output`
   - Upload a SharePoint (solo en modo producción)
   - Creación automática de estructura de carpetas

### Testing Strategy
- No hay tests automatizados actualmente
- Testing manual con modo debug (`--debug` flag)
- Modo debug:
  - No interactúa con SharePoint
  - Guarda archivos en `./debug-output`
  - Permite verificar generación de Excel sin afectar producción

### Git Workflow
- Proyecto privado (`"private": true`)
- `.gitignore` configurado para excluir:
  - `node_modules`
  - Archivos `.env` (credenciales sensibles)
  - `output/` y `debug-output/` (archivos generados)
  - Caches y builds
  - Logs

## Domain Context

### Dominio
Procesamiento automatizado de estados de cuenta bancarios para contabilidad operativa.

### Bancos soportados
- **BCP** (Banco de Crédito del Perú)
  - Monedas: Soles, Dólares
  - Remitente: `notificaciones@notificacionesbcp.com.pe`
  - Parser: `BCPEmailParser` con selectores CSS específicos
  
- **Interbank**
  - Monedas: Soles (Dólares preparado pero sin datos)
  - Remitente: `bancaporinternet@empresas.interbank.pe`
  - Parser: `InterbankEmailParser` con selectores CSS específicos

### Estructura de datos

#### Email parseado
```typescript
{
  banco: "BCP" | "INTERBANK",
  moneda: "SOLES" | "DOLARES",
  bankStatement: {
    fecha: "dd/mm/yyyy",
    detalle: string,      // Cuenta
    cargos: number,       // Monto
    numOp: string,        // Número de operación
    observacion: string,  // Beneficiario
    documento: string,    // Mensaje/Concepto
    movements: [...]
  }
}
```

#### Estructura SharePoint
```
CONTABILIDAD OPERATIVA/
└── ESTADOS DE CUENTAS BANCARIOS/
    ├── BCP SOLES/
    │   ├── 2025/
    │   │   └── MOVIMIENTOS DE BANCO BCP SOLES 2025.xlsx
    │   └── 2026/
    ├── BCP DOLARES/
    │   ├── 2025/
    │   └── 2026/
    └── INTERBANK/
        ├── 2025/
        └── 2026/
```

### Flujo principal

1. **CLI**: Usuario ejecuta con año y mes específico
2. **Autenticación**: Azure AD Client Credentials
3. **Obtención de correos**: Microsoft Graph API con filtros
4. **Parsing**: Extracción de datos con parsers específicos
5. **Validación**: Filtrado de datos inválidos o con monto 0
6. **Agrupación**: Por banco-moneda
7. **Generación Excel**: 
   - Descarga archivo existente de SharePoint
   - Actualiza pestaña del mes
   - Ordena por fecha
8. **Almacenamiento**: 
   - Backup local
   - Upload a SharePoint con estructura de carpetas

## Important Constraints

### Autenticación
- **Requiere**: Credenciales de Azure AD (Tenant ID, Client ID, Client Secret)
- **Flujo**: OAuth 2.0 Client Credentials Flow
- **Scope**: `https://graph.microsoft.com/.default`

### Permisos de Microsoft Graph requeridos
- `Mail.Read` o `Mail.Read.All` - Lectura de correos
- `Sites.ReadWrite.All` - Acceso a SharePoint sites
- `Files.ReadWrite.All` - Subida/descarga de archivos

### Variables de entorno requeridas
```env
MICROSOFT_TENANT_ID=tu-tenant-id
MICROSOFT_CLIENT_ID=tu-client-id
MICROSOFT_CLIENT_SECRET=tu-client-secret
```

### Configuración SharePoint
- **siteId**: ID del sitio SharePoint (obtener con script)
- **driveId**: ID de la biblioteca de documentos (obtener con script)
- **basePath**: Ruta relativa a la raíz del drive (SIN "Documents")
- **paths**: Rutas específicas por banco-moneda

### Plantilla Excel
- **Ubicación**: `./plantilla/plantilla.xlsx`
- **Estructura**: 12 hojas pre-creadas (ENERO-DICIEMBRE)
- **Placeholders**: {MES}, {AÑO}, {BANK}, {CURRENCY}
- **Formato**: Fila 2 = título, Fila 3 = subtítulo, Fila 7+ = datos

### Limitaciones técnicas
- **Runtime específico**: Diseñado para Bun (compatible con Node.js con ajustes)
- **Tamaño de archivo**: Máximo 4MB para upload simple (>4MB requiere upload session)
- **Paginación**: Máximo 999 correos por página (paginación automática)
- **Buffer compatibility**: Diferencias entre Buffer de Bun y Node.js (manejadas con conversiones)

## External Dependencies

### Microsoft Graph API
- **Endpoint**: `https://graph.microsoft.com/v1.0`
- **Autenticación**: OAuth 2.0 Client Credentials
- **APIs usadas**:
  - `/users/{userId}/messages` - Obtención de correos
  - `/drives/{driveId}/items/{itemId}` - Operaciones con archivos
  - `/drives/{driveId}/items/root:/{path}:` - Acceso por ruta

### Azure Active Directory
- Gestión de identidad y autenticación
- Registro de aplicación con permisos

### SharePoint Online
- Almacenamiento de archivos Excel
- Versionado automático de archivos
- Estructura de carpetas organizacional

## Security Considerations

### Operaciones de solo lectura en correos
- ✅ Lee correos (no modifica, no elimina, no marca como leído)
- ✅ Extrae datos del HTML
- ❌ NO modifica el buzón de correo

### Manejo de credenciales
- Credenciales en archivo `.env` (excluido de Git)
- No se almacenan credenciales en código
- Token de acceso gestionado por Azure Identity SDK

### Datos sensibles
- Información bancaria procesada localmente
- Archivos Excel con datos financieros
- Backup local y SharePoint con permisos controlados

## Performance Considerations

### Optimizaciones implementadas
- **Paginación automática**: Maneja cualquier cantidad de correos
- **Filtrado en memoria**: Reduce llamadas a API
- **Reutilización de workbooks**: Descarga archivo existente de SharePoint
- **Creación incremental de carpetas**: Solo crea lo que no existe
- **HTTP directo para uploads**: Evita limitaciones del SDK

### Puntos de mejora futuros
- Implementar upload session para archivos >4MB
- Cache de tokens de autenticación
- Procesamiento paralelo de múltiples bancos
- Retry logic para llamadas a API

## Future Enhancements

### Preparado para
- ✅ Extracción de PDFs adjuntos (librería `unpdf` instalada)
- ✅ Más bancos (arquitectura extensible con Registry Pattern)
- ✅ Más monedas (configuración por banco)

### Posibles mejoras
- Tests automatizados (unit, integration)
- Logging estructurado (Winston, Pino)
- Monitoreo y alertas
- Dashboard web para visualización
- API REST para integración con otros sistemas
- Procesamiento de PDFs adjuntos
- Detección automática de formato de correo
- Machine learning para extracción de datos

## Troubleshooting

### Errores comunes

**"The resource could not be found"**
- Verificar que las carpetas existan o que el sistema tenga permisos para crearlas
- Verificar sintaxis de rutas en SharePoint (`root:/path:` para carpetas)

**"Entity only allows writes with a JSON Content-Type header"**
- Usar HTTP directo en lugar del SDK para uploads binarios
- Usar `Content-Type: application/octet-stream`

**"InefficientFilter"**
- Simplificar filtros de Microsoft Graph
- Mover filtros complejos a procesamiento en memoria

**Buffer type incompatibility**
- Convertir Buffer a ArrayBuffer para compatibilidad
- Usar type assertions documentadas cuando sea necesario

### Debug mode
```bash
bun run dev --year 2025 --month 11
```
- No interactúa con SharePoint
- Guarda en `./debug-output`
- Útil para desarrollo y testing

### Scripts de utilidad
```bash
bun run get-sharepoint-ids  # Obtener IDs de SharePoint
```

## Maintenance Notes

### Actualización de parsers
- Ubicación: `src/services/email-parser.ts`
- Agregar nuevo parser: Extender `BankEmailParser` y registrar en `BankParserRegistry`
- Actualizar selectores CSS si cambia formato de correos

### Actualización de plantilla
- Ubicación: `./plantilla/plantilla.xlsx`
- Mantener 12 hojas (ENERO-DICIEMBRE)
- Mantener placeholders: {MES}, {AÑO}, {BANK}, {CURRENCY}
- Datos empiezan en fila 7

### Actualización de configuración
- Ubicación: `src/config.ts`
- Agregar nuevos bancos en `BANKS` constant
- Actualizar rutas de SharePoint en `sharepoint.paths`
- Actualizar remitentes en `email.allowedSenders`
