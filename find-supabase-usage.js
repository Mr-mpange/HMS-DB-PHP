/**
 * Script to find all files that still use Supabase
 * Run: node find-supabase-usage.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const results = [];

function searchDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      searchDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes('supabase') || content.includes('@supabase')) {
        const lines = content.split('\n');
        const matches = [];
        
        lines.forEach((line, index) => {
          if (line.includes('supabase') || line.includes('@supabase')) {
            matches.push({
              line: index + 1,
              content: line.trim()
            });
          }
        });
        
        if (matches.length > 0) {
          results.push({
            file: filePath.replace(__dirname, '.'),
            matches: matches.length,
            lines: matches
          });
        }
      }
    }
  });
}

console.log('🔍 Searching for Supabase usage...\n');
searchDirectory(srcDir);

if (results.length === 0) {
  console.log('✅ No Supabase usage found! Migration complete.\n');
} else {
  console.log(`⚠️  Found Supabase usage in ${results.length} files:\n`);
  
  results.forEach(result => {
    console.log(`📄 ${result.file} (${result.matches} occurrences)`);
    result.lines.slice(0, 3).forEach(line => {
      console.log(`   Line ${line.line}: ${line.content.substring(0, 80)}...`);
    });
    if (result.lines.length > 3) {
      console.log(`   ... and ${result.lines.length - 3} more`);
    }
    console.log('');
  });
  
  console.log('\n📋 Summary:');
  console.log(`   Total files: ${results.length}`);
  console.log(`   Total occurrences: ${results.reduce((sum, r) => sum + r.matches, 0)}`);
  console.log('\n💡 Run the migration guide: See SUPABASE_REMOVED_GUIDE.md\n');
}
