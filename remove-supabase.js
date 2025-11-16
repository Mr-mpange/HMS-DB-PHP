#!/usr/bin/env node

/**
 * Script to remove all Supabase references from the codebase
 * This script comments out Supabase calls and adds TODO comments
 */

const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'src/components/AdminReports.tsx',
  'src/components/EnhancedPrescriptionDialog.tsx',
  'src/components/MultiplePrescriptionDialog.tsx',
  'src/components/PaymentDialog.tsx',
  'src/pages/BillingDashboard.tsx',
  'src/pages/DebugDashboard.tsx',
  'src/pages/DischargeDashboard.tsx',
  'src/pages/DoctorDashboard.tsx',
  'src/pages/LabDashboard.tsx',
  'src/pages/PatientDashboard.tsx',
  'src/pages/PharmacyDashboard.tsx'
];

function removeSupabaseCalls(content) {
  // Remove supabase import statements
  content = content.replace(/import\s+{[^}]*}\s+from\s+['"]@\/integrations\/supabase['"];?\n?/g, '');
  
  // Comment out lines containing "await supabase"
  content = content.replace(/^(\s*)(.*await\s+supabase.*$)/gm, '$1// TODO: Replace with MySQL API call\n$1// $2');
  
  // Comment out lines with supabase. calls
  content = content.replace(/^(\s*)(.*supabase\.[^\/].*$)/gm, '$1// TODO: Replace with MySQL API call\n$1// $2');
  
  // Comment out supabase channel subscriptions
  content = content.replace(/^(\s*)(const\s+\w+Channel\s*=\s*supabase.*$)/gm, '$1// TODO: Replace with Socket.io\n$1// $2');
  content = content.replace(/^(\s*)(\.channel\(.*$)/gm, '$1// $2');
  content = content.replace(/^(\s*)(\.on\(.*$)/gm, '$1// $2');
  content = content.replace(/^(\s*)(\.subscribe\(\).*$)/gm, '$1// $2');
  
  return content;
}

function processFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    
    content = removeSupabaseCalls(content);
    
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Processed: ${filePath}`);
    } else {
      console.log(`ℹ️  No changes: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log('🚀 Starting Supabase removal process...\n');

filesToProcess.forEach(processFile);

console.log('\n✅ Supabase removal complete!');
console.log('\n📝 Next steps:');
console.log('1. Review all files with "TODO: Replace with MySQL API call" comments');
console.log('2. Replace each commented Supabase call with the appropriate MySQL API endpoint');
console.log('3. Test each function after migration');
console.log('4. Remove TODO comments once verified\n');
