const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/BillingDashboard.tsx',
  'src/pages/DoctorDashboard.tsx',
  'src/pages/PharmacyDashboard.tsx',
  'src/pages/DebugDashboard.tsx',
  'src/pages/DischargeDashboard.tsx',
  'src/pages/ReceptionistDashboard.tsx'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Comment out all lines with "await supabase"
  const lines = content.split('\n');
  const newLines = lines.map((line, index) => {
    if (line.includes('await supabase') || (line.trim().startsWith('.from(') && lines[index-1]?.includes('await supabase'))) {
      modified = true;
      return '      // TODO: Migrate to MySQL API - ' + line;
    }
    if (line.trim().startsWith('.') && index > 0 && lines[index-1].includes('TODO: Migrate to MySQL API')) {
      return '      // ' + line;
    }
    return line;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    console.log(`✅ Commented Supabase calls in: ${file}`);
  } else {
    console.log(`ℹ️  No changes needed: ${file}`);
  }
});

console.log('\n✅ Done! All Supabase calls have been commented out.');
console.log('⚠️  These files need manual migration to MySQL API calls.');
