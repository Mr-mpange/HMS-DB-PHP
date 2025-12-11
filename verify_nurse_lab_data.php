<?php
require 'backend/vendor/autoload.php';
$app = require 'backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔍 Verifying Nurse → Lab test data...\n";
echo "═══════════════════════════════════════\n\n";

// Check patients
$patients = DB::table('patients')
    ->where('full_name', 'like', '%Nurse-Lab%')
    ->orWhere('full_name', 'like', '%Urine%')
    ->orWhere('full_name', 'like', '%Multi%')
    ->get();

echo "👥 Patients created: " . $patients->count() . "\n";
foreach ($patients as $patient) {
    echo "   - {$patient->full_name} ({$patient->phone})\n";
}

// Check visits in lab stage
$visits = DB::table('patient_visits')
    ->where('current_stage', 'lab')
    ->where('nurse_status', 'Completed')
    ->get();

echo "\n🏥 Visits in lab stage: " . $visits->count() . "\n";
foreach ($visits as $visit) {
    $patient = DB::table('patients')->where('id', $visit->patient_id)->first();
    echo "   - " . ($patient->full_name ?? 'Unknown') . " (Stage: {$visit->current_stage}, Lab Status: {$visit->lab_status})\n";
}

// Check lab tests
$labTests = DB::table('lab_tests')
    ->where('status', 'Pending')
    ->whereIn('patient_id', $patients->pluck('id'))
    ->get();

echo "\n🧪 Lab tests pending: " . $labTests->count() . "\n";
foreach ($labTests as $test) {
    $patient = DB::table('patients')->where('id', $test->patient_id)->first();
    echo "   - {$test->test_name} for " . ($patient->full_name ?? 'Unknown') . "\n";
}

echo "\n✅ Test data ready!\n";
echo "\n🎯 Next Steps:\n";
echo "1. Login as Lab Tech: lab@test.com / lab123\n";
echo "2. You should see 3 patients with pending tests\n";
echo "3. Complete the tests and submit results\n";
echo "4. Patients should return to Nurse Dashboard\n";
echo "5. Login as Nurse to verify they appear\n";
?>