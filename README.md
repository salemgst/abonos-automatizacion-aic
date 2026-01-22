# abonos-aic

Sistema de procesamiento de correos electrónicos y generación de reportes Excel con integración a SharePoint.

## Instalación

```bash
bun install
```

## Configuración

### 1. Variables de entorno (.env)

Crea un archivo `.env` con tus credenciales de Azure:

```env
MICROSOFT_TENANT_ID=tu-tenant-id
MICROSOFT_CLIENT_ID=tu-client-id
MICROSOFT_CLIENT_SECRET=tu-client-secret
```

### 2. Plantilla Excel

**IMPORTANTE**: Coloca tu archivo de plantilla Excel en `plantilla/plantilla.xlsx`

El sistema:
- Cargará la plantilla automáticamente
- Copiará la primera hoja como base para las pestañas mensuales
- Mantendrá todo el formato, fórmulas y estilos
- Limpiará los datos pero preservará la estructura

Si no existe la plantilla, creará un Excel básico (no recomendado).

### 3. Configuración del sistema (src/config.ts)

Modifica `src/config.ts` con tus valores específicos:

```typescript
export const config = {
  email: {
    // Buzón de correo objetivo
    targetUserId: "proveedores@aic.pe",
    
    // Correos de remitentes permitidos
    allowedSenders: [
      "notificaciones@notificacionesbcp.com.pe",
      "bancaporinternet@empresas.interbank.pe",
    ],
  },
  
  sharepoint: {
    // IDs de SharePoint (obtener con: bun run get-sharepoint-ids)
    siteId: "tu-site-id",
    driveId: "tu-drive-id",
    
    // Ruta base (relativa a la raíz del drive, SIN incluir "Documents")
    basePath: "CONTABILIDAD OPERATIVA/ESTADOS DE CUENTAS BANCARIOS",
    
    // Rutas específicas por banco-moneda
    paths: {
      BCP: {
        SOLES: "BCP SOLES",
        DOLARES: "BCP DOLARES"
      },
      INTERBANK: {
        SOLES: "INTERBANK"  // Sin moneda en el nombre
      }
    }
  },
  
  excel: {
    templatePath: "./plantilla/plantilla.xlsx",
    outputPath: "./output",
  },
  
  debug: {
    verboseLogging: true,
    outputDir: "./debug-output",
  },
};
```

**Nota importante sobre SharePoint:**
- "Documents" es el nombre de la biblioteca de documentos (drive), NO una carpeta
- El `driveId` ya apunta a esa biblioteca
- Las rutas en `basePath` son relativas a la raíz del drive
- El sistema crea automáticamente las carpetas si no existen

### 4. Obtener IDs de SharePoint

Usa el script incluido para obtener los IDs necesarios:

```bash
# Modo interactivo (recomendado)
bun run get-sharepoint-ids

# Con argumentos
bun run get-sharepoint-ids "ASISTENCIA AIC"
```

El script te mostrará:
- Todos los sitios de SharePoint disponibles
- Las bibliotecas de documentos (drives) del sitio
- Los IDs necesarios para configurar `src/config.ts`

Ver `scripts/README.md` para más detalles.

### 5. Implementar lógica de parsing (Ya implementado)

El sistema ya incluye parsers para:
- **BCP**: Extrae datos de correos de notificaciones BCP
- **Interbank**: Extrae datos de correos de Interbank

Los parsers están en `src/services/email-parser.ts` y usan:
- Detección automática de banco por remitente
- Detección de moneda (Soles/Dólares) por palabras clave
- Extracción de datos con Cheerio (selectores CSS)

## Uso

### Modo producción (sube a SharePoint)

```bash
# Procesar mes actual
bun start

# Procesar mes y año específico
bun start --year 2025 --month 11
```

### Modo debug (NO sube a SharePoint)

```bash
# Guarda archivos en ./debug-output sin subir a SharePoint
bun run dev

# Con mes y año específico
bun run dev --year 2025 --month 11
```

### Opciones CLI

- `-y, --year <year>` - Año específico (default: año actual)
- `-m, --month <month>` - Mes específico 1-12 (default: mes actual)
- `--debug` - Modo debug (no sube a SharePoint)
- `-h, --help` - Mostrar ayuda

## Flujo de trabajo

1. **Filtrado de correos**: Obtiene correos del mes especificado de remitentes configurados
2. **Parsing HTML**: Extrae datos del cuerpo HTML usando parsers específicos por banco
3. **Filtrado por monto**: Ignora correos con monto = 0
4. **Agrupación**: Agrupa por banco y moneda (BCP SOLES, BCP DOLARES, INTERBANK SOLES)
5. **Carga workbook**: 
   - Intenta descargar de SharePoint (si existe)
   - Si no existe, usa archivo local (si existe)
   - Si no existe, usa plantilla nueva
6. **Busca pestaña mensual**: Encuentra la pestaña del mes (ENERO, FEBRERO, etc.)
7. **Reemplaza placeholders**: {MES}, {AÑO}, {BANK}, {CURRENCY}
8. **Población de datos**: Inserta movimientos ordenados por fecha (ascendente)
9. **Backup local**: Guarda copia en `./output`
10. **Upload SharePoint**: 
    - Crea estructura de carpetas si no existe
    - Sube archivo a la ruta específica del banco-moneda-año
    - Actualiza si ya existe (SharePoint mantiene versiones)

## Modo Debug

Para desarrollo y pruebas:

```bash
bun run dev --year 2025 --month 11
```

En modo debug:
- ✅ Procesa correos normalmente
- ✅ Genera archivos Excel
- ✅ Guarda en `./debug-output`
- ❌ NO descarga de SharePoint
- ❌ NO sube a SharePoint

Útil para:
- Probar cambios sin afectar SharePoint
- Desarrollo local
- Verificar formato de archivos Excel

## Permisos requeridos en Azure AD

**IMPORTANTE**: El sistema es de **SOLO LECTURA** para correos. No elimina, modifica ni mueve correos.

### Permisos Mínimos (Recomendado)

- `Mail.Read` - Lectura de correos (si usas `targetUserId: "me"`)
- `Mail.Read.All` - Lectura de correos de cualquier usuario (si usas email específico)
- `Sites.ReadWrite.All` - Acceso a SharePoint
- `Files.ReadWrite.All` - Subida de archivos

### Operaciones que realiza

✅ **Solo lectura de correos** - No modifica el buzón
✅ **Genera archivos Excel** - Guardados localmente y en SharePoint
✅ **Sube a SharePoint** - Crea o actualiza archivos (preserva versiones)

❌ **NO elimina correos**
❌ **NO modifica correos**
❌ **NO marca como leído**

Ver `SECURITY_AND_PERMISSIONS.md` para más detalles.

## Estructura del proyecto

```
plantilla/
└── plantilla.xlsx         # Plantilla con 12 hojas (ENERO-DICIEMBRE)

scripts/
├── get-sharepoint-ids.ts  # Script para obtener IDs de SharePoint
└── README.md              # Documentación de scripts

src/
├── config.ts              # Configuración (bancos, SharePoint, rutas)
├── index.ts               # CLI principal
├── msgraph.ts             # Cliente Microsoft Graph
├── services/
│   ├── ms.ts              # Servicios de correo (con paginación)
│   ├── email-parser.ts    # Parsers por banco (BCP, Interbank)
│   ├── excel.ts           # Operaciones Excel
│   ├── excel-monthly-tab.ts # Búsqueda y reemplazo de placeholders
│   ├── pdf.ts             # Extracción PDF (preparado para uso futuro)
│   └── sharepoint.ts      # Upload/download SharePoint
├── types/
│   ├── bank-data.ts       # Tipos de datos bancarios
│   └── email-parser.ts    # Tipos de parsers
├── utils/
│   ├── email-filter.ts    # Filtros de correos
│   ├── logger.ts          # Funciones de logging
│   └── validation.ts      # Validaciones
├── workflows/
│   ├── process-emails.ts  # Workflow de procesamiento de correos
│   └── process-bank-currency.ts # Workflow por banco-moneda
└── mappers/
    └── ms-email-to-simple-emal.ts # Mapeo de tipos MS Graph

output/                    # Archivos generados (modo producción)
debug-output/              # Archivos generados (modo debug)
```

## TODOs para implementación

1. ✅ Configurar credenciales en `.env`
2. ✅ Colocar plantilla en `plantilla/plantilla.xlsx` con 12 hojas mensuales
3. ✅ Obtener IDs de SharePoint con `bun run get-sharepoint-ids`
4. ✅ Modificar `config.ts` con tus valores (siteId, driveId, rutas)
5. ✅ Parsers implementados para BCP e Interbank
6. ✅ Sistema de filtrado por monto (ignora monto = 0)
7. ✅ Integración completa con SharePoint (descarga/subida)
8. ✅ Creación automática de estructura de carpetas
9. ✅ Ordenamiento de datos por fecha
10. ✅ Modo debug para desarrollo

## Scripts disponibles

```bash
# Producción
bun start                          # Procesar mes actual
bun start --year 2025 --month 11  # Mes específico

# Debug
bun run dev                        # Modo debug mes actual
bun run dev --year 2025 --month 11 # Modo debug mes específico

# Utilidades
bun run get-sharepoint-ids         # Obtener IDs de SharePoint
```

## Características

- ✅ Procesamiento automático de correos por mes
- ✅ Parsers específicos por banco (BCP, Interbank)
- ✅ Detección automática de moneda (Soles/Dólares)
- ✅ Filtrado de correos con monto = 0
- ✅ Paginación automática (sin límite de correos)
- ✅ Plantilla Excel con 12 hojas pre-creadas
- ✅ Reemplazo de placeholders ({MES}, {AÑO}, {BANK}, {CURRENCY})
- ✅ Ordenamiento por fecha ascendente
- ✅ Integración completa con SharePoint
- ✅ Creación automática de carpetas
- ✅ Descarga de archivos existentes de SharePoint
- ✅ Backup local automático
- ✅ Modo debug sin afectar SharePoint
- ✅ Código completamente tipado (TypeScript)
- ✅ Sin uso de `any` types

---

Creado con [Bun](https://bun.com) v1.3.6
