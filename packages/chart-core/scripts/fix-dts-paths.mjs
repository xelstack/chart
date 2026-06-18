/**
 * Fix @chart/* path aliases in generated .d.ts files
 * Converts @chart/xxx/yyy to relative paths like ../xxx/yyy
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const typesDir = join(__dirname, '..', 'dist', 'types');

/**
 * Get all .d.ts files recursively
 */
function getAllDtsFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllDtsFiles(fullPath));
    } else if (entry.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Calculate relative path from file to target module
 */
function calculateRelativePath(fromFile, aliasPath) {
  // @chart/types/index -> types/index
  // @chart/api/create-chart -> api/create-chart
  const modulePath = aliasPath.replace('@chart/', '');
  const targetPath = join(typesDir, modulePath);
  const fromDir = dirname(fromFile);
  let relativePath = relative(fromDir, targetPath).replace(/\\/g, '/');

  // Ensure it starts with ./ or ../
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }

  return relativePath;
}

/**
 * Fix @chart/* imports in a .d.ts file
 */
function fixDtsFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Match patterns like:
  // from '@chart/types/index'
  // from "@chart/api/create-chart"
  const importRegex = /from ['"](@chart\/[^'"]+)['"]/g;

  content = content.replace(importRegex, (match, aliasPath) => {
    const relativePath = calculateRelativePath(filePath, aliasPath);
    return `from '${relativePath}'`;
  });

  if (content !== originalContent) {
    writeFileSync(filePath, content);
    console.log(`Fixed: ${relative(typesDir, filePath)}`);
  }
}

// Main
console.log('Fixing @chart/* paths in .d.ts files...');
const dtsFiles = getAllDtsFiles(typesDir);
dtsFiles.forEach(fixDtsFile);
console.log(`Done. Processed ${dtsFiles.length} files.`);
