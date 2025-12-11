<?php
/**
 * Quick verification script for test data
 * Run with: php verify_test_data.php
 */

$baseUrl = 'http://localhost:8000/api';

echo "🔍 Verifying Test Data...\n";
echo "========================\n\n";

// Test health endpoint
echo "1. Testing API Health...\n";
$health = file_get_contents($baseUrl . '/health');
$healthData = json_decode($health, true);
echo "   Status: " . ($healthData['status'] ?? 'unknown') . "\n";
echo "   Database: " . ($healthData['database'] ?? 'unknown') . "\n\n";

// Test public endpoints (no auth required)
echo "2. Testing Public Endpoints...\n";

// Get departments
$departments = file_get_contents($baseUrl . '/public/departments');
$deptData = json_decode($departments, true);
echo "   Departments: " . count($deptData['departments'] ?? []) . " found\n";

// Get doctors
$doctors = file_get_contents($baseUrl . '/public/doctors');
$doctorData = json_decode($doctors, true);
echo "   Doctors: " . count($doctorData['doctors'] ?? []) . " found\n";

if (!empty($doctorData['doctors'])) {
    $doctor = $doctorData['doctors'][0];
    echo "   Sample Doctor: " . ($doctor['name'] ?? 'Unknown') . " (" . ($doctor['email'] ?? 'No email') . ")\n";
}

echo "\n3. Test Login Credentials:\n";
echo "   Email: doctor@hospital.com\n";
echo "   Password: password\n";

echo "\n4. Frontend URLs:\n";
echo "   Frontend: http://localhost:8081\n";
echo "   Backend API: http://localhost:8000/api\n";

echo "\n✅ Verification Complete!\n";
echo "\nNext Steps:\n";
echo "1. Open http://localhost:8081/auth in your browser\n";
echo "2. Login with the credentials above\n";
echo "3. Navigate to Doctor Dashboard\n";
echo "4. Test the new Lab workflow option\n";
?>