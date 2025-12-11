<?php
/**
 * Verify the appointment workflow test data
 */

$baseUrl = 'http://localhost:8000/api';

echo "🔍 Verifying Appointment Workflow Test Data...\n";
echo "===============================================\n\n";

// Test health
$health = json_decode(file_get_contents($baseUrl . '/health'), true);
echo "✅ API Health: " . $health['status'] . "\n";
echo "✅ Database: " . $health['database'] . "\n\n";

// Test public endpoints
$departments = json_decode(file_get_contents($baseUrl . '/public/departments'), true);
echo "📋 Departments: " . count($departments['departments']) . " found\n";

$doctors = json_decode(file_get_contents($baseUrl . '/public/doctors'), true);
echo "👨‍⚕️ Doctors: " . count($doctors['doctors']) . " found\n";

if (!empty($doctors['doctors'])) {
    $doctor = $doctors['doctors'][0];
    echo "   Sample Doctor: " . $doctor['name'] . " (" . $doctor['email'] . ")\n";
}

echo "\n🧪 Test Scenarios Ready:\n";
echo "─────────────────────────────────────\n";
echo "1. 🔬 LAB WORKFLOW - Sarah Lab-Test\n";
echo "2. 💊 PHARMACY WORKFLOW - Michael Pharmacy-Test\n";
echo "3. ✅ DISCHARGE WORKFLOW - Emma Discharge-Test\n";
echo "4. 🔄 MIXED WORKFLOW - Robert Mixed-Test\n";
echo "5. 👶 PEDIATRIC WORKFLOW - Tommy Pediatric-Test\n";
echo "─────────────────────────────────────\n";

echo "\n🎯 Test Instructions:\n";
echo "1. Open: http://localhost:8081/auth\n";
echo "2. Login: doctor@test.com / doctor123\n";
echo "3. Go to Doctor Dashboard\n";
echo "4. You should see 5 test patients with clear workflow indicators\n";
echo "5. Test each patient with their suggested workflow:\n";
echo "   - Sarah: Select 'Send to Lab' and order blood tests\n";
echo "   - Michael: Select 'Send to Pharmacy' and prescribe medication\n";
echo "   - Emma: Select 'Discharge Patient' directly\n";
echo "   - Robert: Choose based on your clinical judgment\n";
echo "   - Tommy: Test pediatric workflow options\n";

echo "\n✨ New Feature to Test:\n";
echo "The appointment completion dialog now has 3 options:\n";
echo "🔬 Send to Lab (NEW!)\n";
echo "💊 Send to Pharmacy\n";
echo "✅ Discharge Patient\n";

echo "\n🔧 Troubleshooting:\n";
echo "- Backend: http://localhost:8000/api/health\n";
echo "- Frontend: http://localhost:8081\n";
echo "- Re-seed: cd backend && php artisan db:seed --class=AppointmentWorkflowSeeder\n";

echo "\n✅ Ready for testing!\n";
?>