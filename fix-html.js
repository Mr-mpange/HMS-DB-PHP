import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing index.html...');

const htmlPath = path.join(__dirname, 'dist', 'index.html');

if (!fs.existsSync(htmlPath)) {
  console.error('❌ Error: dist/index.html not found. Run "npm run build" first.');
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');

// Count problematic links before
const beforeCount = (html.match(/<link rel="modulepreload" href="data:application\/octet-stream/g) || []).length +
                    (html.match(/<link rel="modulepreload" href="\/assets\/tsx\//g) || []).length;

// Remove problematic preload links with base64 data
html = html.replace(/<link rel="modulepreload" href="data:application\/octet-stream[^>]*>/g, '');

// Remove problematic preload links to .tsx files
html = html.replace(/<link rel="modulepreload" href="\/assets\/tsx\/[^>]*>/g, '');

// Write back
fs.writeFileSync(htmlPath, html);

console.log(`✅ Fixed index.html - Removed ${beforeCount} problematic preload link(s)`);
console.log('');
console.log('Next steps:');
console.log('1. Test locally: cd dist && php -S localhost:3000');
console.log('2. Open browser: http://localhost:3000');
console.log('3. Check console for MIME errors');
console.log('4. If OK, deploy to Hostinger');
