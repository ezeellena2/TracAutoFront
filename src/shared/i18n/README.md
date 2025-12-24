# Sistema de Internacionalización (i18n)

## Arquitectura

El sistema de i18n está basado en `react-i18next` y está organizado de forma escalable y profesional.

### Estructura de Traducciones

Las traducciones están organizadas por **módulo/feature** en archivos JSON:

```
src/shared/i18n/locales/
├── es.json  (Español - idioma por defecto)
├── en.json  (Inglés)
└── [futuro: pt.json, fr.json, etc.]
```

### Organización de Keys

Las keys están organizadas jerárquicamente por feature:

```json
{
  "common": { ... },           // Textos comunes reutilizables
  "header": { ... },           // Header/Navbar
  "sidebar": { ... },          // Sidebar navigation
  "dashboard": { ... },        // Dashboard page
  "vehicles": { ... },         // Vehicles feature
  "devices": { ... },          // Devices feature
  "users": { ... },            // Users feature
  "replay": { ... },           // Replay feature
  "map": { ... },              // Map feature
  "auth": { ... },             // Authentication
  "organization": { ... }      // Organization settings
}
```

### Uso en Componentes

#### Hook `useTranslation`

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('vehicles.title')}</h1>
      <p>{t('vehicles.subtitle')}</p>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

#### Con Interpolación

```tsx
{t('dashboard.ofTotal', { total: 10 })}
// Resultado: "de 10 totales" (ES) o "of 10 total" (EN)
```

#### Con Pluralización

```tsx
{t('common.results', { count: 1 })}
// Resultado: "1 resultado" (ES) o "1 result" (EN)

{t('common.results_plural', { count: 5 })}
// Resultado: "5 resultados" (ES) o "5 results" (EN)
```

### Agregar Nuevas Traducciones

1. **Identificar el módulo**: ¿Es común, vehicles, devices, etc.?

2. **Agregar la key en ambos idiomas**:
   - `src/shared/i18n/locales/es.json`
   - `src/shared/i18n/locales/en.json`

3. **Usar en el componente**:
   ```tsx
   {t('vehicles.newKey')}
   ```

### Convenciones

1. **Nombres descriptivos**: Usar nombres que describan el contexto
   - ✅ `vehicles.createVehicle`
   - ❌ `create`

2. **Agrupar por contexto**: Agrupar keys relacionadas
   ```json
   {
     "vehicles": {
       "form": { ... },
       "errors": { ... },
       "success": { ... }
     }
   }
   ```

3. **Reutilizar common**: Para textos comunes (save, cancel, delete, etc.)

4. **Mantener consistencia**: Usar las mismas keys para conceptos similares

### Agregar un Nuevo Idioma

1. Crear archivo `src/shared/i18n/locales/[code].json`
2. Copiar estructura de `es.json` y traducir
3. Actualizar `src/shared/i18n/config.ts`:
   ```ts
   resources: {
     es: { translation: es },
     en: { translation: en },
     pt: { translation: pt }, // Nuevo
   }
   ```
4. Agregar al selector de idioma si es necesario

### Mejores Prácticas

1. **Nunca hardcodear textos**: Siempre usar `t()`
2. **Usar keys descriptivas**: `vehicles.createVehicle` no `create`
3. **Agrupar por feature**: Mantener organización lógica
4. **Validar traducciones**: Revisar que todas las keys existan en todos los idiomas
5. **Mantener sincronizado**: Cuando agregues una key en ES, agregarla en EN

### Debugging

Para ver qué keys faltan, activar modo debug en `config.ts`:

```ts
i18n.init({
  debug: true, // Muestra warnings de keys faltantes
  // ...
});
```

