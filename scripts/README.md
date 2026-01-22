# Scripts de Utilidad

## get-sharepoint-ids.ts

Script para identificar el Site ID y Drive ID de SharePoint necesarios para la configuración.

### Uso

**Opción 1: Modo interactivo (recomendado)**
```bash
bun run get-sharepoint-ids
```
El script listará todos los sitios disponibles y te pedirá que ingreses el nombre del sitio.

**Opción 2: Con argumentos**
```bash
bun run get-sharepoint-ids "ASISTENCIA AIC"
bun run get-sharepoint-ids "ASISTENCIA AIC" "Documents"
```

**Parámetros:**
- `[site-name]`: Nombre del sitio de SharePoint (opcional, se pedirá si no se proporciona)
- `[library-name]`: Nombre de la biblioteca de documentos (opcional, por defecto "Documents")

### Qué hace

1. **Lista todos los sitios de SharePoint** disponibles con tu cuenta (numerados)
2. **Solicita el nombre del sitio** si no se proporcionó como argumento
3. **Busca el sitio objetivo** por nombre exacto
4. **Lista todas las bibliotecas de documentos** (drives) del sitio
5. **Muestra los IDs** necesarios para configurar `src/config.ts`

### Configuración

No necesitas editar el script. Puedes:
- Ejecutarlo sin argumentos y seguir las instrucciones interactivas
- Pasar el nombre del sitio como argumento de línea de comandos

Si prefieres configurar valores por defecto, edita las constantes al inicio del script:

```typescript
let TARGET_SITE_NAME = args[0] || ""; // Se pedirá si está vacío
const TARGET_LIBRARY_NAME = args[1] || "Documents";
```

### Salida Esperada

El script mostrará:

```
🔍 Buscando sitios de SharePoint...

✅ Se encontraron 5 sitios

📋 Sitios disponibles:
  1. ASISTENCIA AIC
     ID: contoso.sharepoint.com,abc123,def456
     URL: https://contoso.sharepoint.com/sites/asistencia

  2. Recursos Humanos
     ID: contoso.sharepoint.com,xyz789,uvw012
     URL: https://contoso.sharepoint.com/sites/rrhh

  3. Contabilidad
     ID: contoso.sharepoint.com,mno345,pqr678
     URL: https://contoso.sharepoint.com/sites/contabilidad

======================================================================
Ingresa el nombre del sitio de SharePoint: ASISTENCIA AIC
======================================================================

✅ Sitio encontrado: ASISTENCIA AIC
📌 Site ID: contoso.sharepoint.com,abc123,def456

🔍 Buscando bibliotecas de documentos...

✅ Se encontraron 2 bibliotecas

📋 Bibliotecas disponibles:
  - Documents
    ID: b!xyz789...
    Tipo: documentLibrary
    URL: https://contoso.sharepoint.com/sites/asistencia/Shared Documents

======================================================================
📝 CONFIGURACIÓN PARA src/config.ts
======================================================================

sharepoint: {
    siteId: "contoso.sharepoint.com,abc123,def456",
    driveId: "b!xyz789...",
    basePath: "CONTABILIDAD OPERATIVA/ESTADOS DE CUENTAS BANCARIOS",
    // ... resto de la configuración
}

✅ Script completado exitosamente
```

### Requisitos

- Archivo `.env` configurado con credenciales válidas
- Permisos de Azure AD necesarios:
  - `Sites.Read.All`
  - `Files.Read.All`

### Nota Importante sobre Rutas

**"Documents" es el nombre de la biblioteca de documentos (drive), NO una carpeta.**

Cuando configures `basePath` en `src/config.ts`, NO incluyas "Documents" en la ruta. La ruta debe ser relativa a la raíz del drive.

**Correcto:**
```typescript
basePath: "CONTABILIDAD OPERATIVA/ESTADOS DE CUENTAS BANCARIOS"
```

**Incorrecto:**
```typescript
basePath: "Documents/CONTABILIDAD OPERATIVA/ESTADOS DE CUENTAS BANCARIOS"
```

### Solución de Problemas

**Error 401/403 (No autorizado)**
- Verifica las credenciales en `.env`
- Asegúrate de que la aplicación tenga los permisos correctos en Azure AD
- Verifica que los permisos estén otorgados (Admin Consent)

**No se encuentra el sitio**
- Verifica el nombre exacto del sitio en SharePoint
- El nombre debe coincidir exactamente (case-sensitive)
- Copia y pega el nombre exacto de la lista que muestra el script
- Puedes usar el modo interactivo para ver todos los sitios disponibles

**No se encuentra la biblioteca**
- La biblioteca "Documents" es la predeterminada
- Puedes usar cualquier biblioteca listada en la salida
- Copia el `driveId` de la biblioteca que necesites
