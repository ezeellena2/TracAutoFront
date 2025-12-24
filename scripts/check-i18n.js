/**
 * Script para verificar que no hay strings hardcodeados en español
 * en archivos ya migrados a i18n.
 * 
 * Uso: node scripts/check-i18n.js
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Archivos/módulos ya migrados (no deben tener strings hardcodeados)
const MIGRATED_FILES = [
  'src/features/auth',
  'src/app/layouts/Sidebar.tsx',
  'src/app/layouts/Header.tsx',
  'src/features/replay/components/ReplayFilters.tsx',
  'src/features/replay/components/ReplayControls.tsx',
  'src/features/dashboard',
  'src/features/devices',
  'src/features/vehicles',
  'src/features/users',
  'src/features/drivers',
  'src/features/events',
  'src/features/traccar-map',
  'src/features/organization',
];

// Patrones de strings en español comunes que NO deberían aparecer
const SPANISH_PATTERNS = [
  /['"](Iniciar Sesión|Ingresar|Registrar|Crear|Editar|Eliminar|Guardar|Cancelar|Buscar|Filtrar|Cerrar|Confirmar)['"]/g,
  /['"](Cargando|Error|Éxito|Activo|Inactivo|Online|Offline)['"]/g,
  /['"](Vehículo|Dispositivo|Usuario|Conductor|Evento|Organización)['"]/g,
  /['"](Dashboard|Mapa|Replay|Dispositivos|Vehículos|Conductores|Eventos|Usuarios)['"]/g,
  /['"](Total|Página|de|por página|resultado|resultados)['"]/g,
  /['"](Desde|Hasta|Hoy|Ayer|Esta Semana|Semana Anterior|Este Mes|Mes Anterior|Personalizado)['"]/g,
  /['"](Velocidad|Posición|Estado|Encendido|Apagado|En movimiento|Detenido)['"]/g,
  /['"](Seleccione|No hay|disponibles|Cargando dispositivos)['"]/g,
  /['"](Correo electrónico|Contraseña|Nombre|Email|Teléfono)['"]/g,
  /['"](¿Está seguro|Esta acción|no se puede deshacer)['"]/g,
];

// Excepciones permitidas (strings técnicos, IDs, etc.)
const ALLOWED_PATTERNS = [
  /['"]TracAuto['"]/, // Nombre de la app
  /['"]es-AR['"]/, // Culture code
  /['"]es['"]/, // Language code
  /['"]en['"]/, // Language code
  /className=/, // CSS classes
  /import.*from/, // Imports
  /console\.(log|error|warn)/, // Console logs
  /\/\/.*/, // Comments
  /\/\*.*\*\//, // Block comments
  /['"]useTranslation['"]/, // Hook name
  /['"]react-i18next['"]/, // Library name
  /t\(/, // Translation function calls
  /i18n\./, // i18n object usage
];

function isAllowed(line) {
  return ALLOWED_PATTERNS.some(pattern => pattern.test(line));
}

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  lines.forEach((line, index) => {
    if (isAllowed(line)) return;

    SPANISH_PATTERNS.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        issues.push({
          file: filePath,
          line: index + 1,
          matches: matches,
          content: line.trim(),
        });
      }
    });
  });

  return issues;
}

function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and dist
      if (!file.includes('node_modules') && !file.includes('dist')) {
        getAllFiles(filePath, fileList);
      }
    } else if (extname(file) === '.tsx' || extname(file) === '.ts') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function main() {
  console.log('🔍 Verificando strings hardcodeados en archivos migrados...\n');

  const allIssues = [];
  const migratedFiles = [];

  MIGRATED_FILES.forEach(pattern => {
    const fullPath = join(rootDir, pattern);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        const files = getAllFiles(fullPath);
        migratedFiles.push(...files);
      } else {
        migratedFiles.push(fullPath);
      }
    } catch (e) {
      console.warn(`⚠️  No se encontró: ${pattern}`);
    }
  });

  migratedFiles.forEach(file => {
    const issues = checkFile(file);
    if (issues.length > 0) {
      allIssues.push(...issues);
    }
  });

  if (allIssues.length === 0) {
    console.log('✅ No se encontraron strings hardcodeados en archivos migrados.\n');
    return 0;
  }

  console.log(`❌ Se encontraron ${allIssues.length} posibles strings hardcodeados:\n`);

  // Agrupar por archivo
  const byFile = {};
  allIssues.forEach(issue => {
    if (!byFile[issue.file]) {
      byFile[issue.file] = [];
    }
    byFile[issue.file].push(issue);
  });

  Object.entries(byFile).forEach(([file, issues]) => {
    const relativePath = file.replace(rootDir + '\\', '');
    console.log(`📄 ${relativePath}:`);
    issues.forEach(issue => {
      console.log(`   Línea ${issue.line}: ${issue.content}`);
      console.log(`   Matches: ${issue.matches.join(', ')}\n`);
    });
  });

  console.log('\n💡 Sugerencia: Reemplaza estos strings con t(\'key\') usando useTranslation()\n');
  return 1;
}

const exitCode = main();
process.exit(exitCode);

