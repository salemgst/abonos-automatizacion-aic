# Plantilla Excel

## Instrucciones

Coloca tu archivo de plantilla Excel aquí con el nombre `plantilla.xlsx`.

### Estructura esperada

El sistema copiará la primera hoja de la plantilla para crear las pestañas mensuales.

**Características:**
- La primera hoja se usa como plantilla base
- Se copiará toda la estructura (formato, fórmulas, estilos)
- Los datos se limpiarán pero la estructura se mantendrá
- El nombre de la pestaña será: `{Mes} {Año}` (ej: "Enero 2025")

### Ejemplo de estructura

```
Hoja 1: "Plantilla" o cualquier nombre
├── Fila 1: Headers (se mantienen)
├── Fila 2+: Datos (se limpian y repoblan)
└── Formato, fórmulas, estilos (se copian)
```

### Notas

- Si no existe la plantilla, el sistema creará un Excel básico
- Puedes tener múltiples hojas en la plantilla, solo la primera se usa
- Los datos se poblarán desde la fila 2 en adelante (asumiendo headers en fila 1)

## Configuración

La ruta de la plantilla se configura en `src/config.ts`:

```typescript
excel: {
  templatePath: "./plantilla/plantilla.xlsx",
  // ...
}
```
