<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Inserting lab test data..." . PHP_EOL;

$doctor = DB::table('users')->where('email', 'doctor@test.com')->first();
$labTech = DB::table('users')->where('email', 'lab@test.com')->first();

if (!$doctor || !$labTech) {
    echo "ERROR: Users not found!" . PHP_EOL;
    exit(1);
}

// Delete existing test data
DB::table('lab_tests')->where('patient_id', '550e8400-e29b-41d4-a716-446655440001')->delete();
DB::table('patients')->where('id', '550e8400-e29b-41d4-a716-446655440001')->delete();

// Insert patient
$patientId = '550e8400-e29b-41d4-a716-446655440001';
DB::table('patients')->insert([
    'id' => $patientId,
    'full_name' => 'John Test Patient',
    'date_of_birth' => '1985-05-15',
    'gender' => 'Male',
    'phone' => '0756789012',
    'address' => '123 Test Street',
    'status' => 'Active',
    'created_at' => now(),
    'updated_at' => now(),
]);

// Insert 3 lab tests
DB::table('lab_tests')->insert([
    [
        'id' => '550e8400-e29b-41d4-a716-446655440002',
        'patient_id' => $patientId,
        'doctor_id' => $doctor->id,
        'test_name' => 'Complete Blood Count (CBC)',
        'test_type' => 'Hematology',
        'test_date' => now()->format('Y-m-d'),
        'status' => 'Pending',
        'notes' => 'Urgent - check for infection',
        'created_at' => now(),
        'updated_at' => now(),
    ],
    [
        'id' => '550e8400-e29b-41d4-a716-446655440003',
        'patient_id' => $patientId,
        'doctor_id' => $doctor->id,
        'test_name' => 'Malaria Test (RDT)',
        'test_type' => 'Parasitology',
        'test_date' => now()->format('Y-m-d'),
        'status' => 'In Progress',
        'notes' => 'Sample collected - processing',
        'performed_by' => $labTech->id,
        'created_at' => now(),
        'updated_at' => now(),
    ],
    [
        'id' => '550e8400-e29b-41d4-a716-446655440004',
        'patient_id' => $patientId,
        'doctor_id' => $doctor->id,
        'test_name' => 'Blood Sugar (Fasting)',
        'test_type' => 'Clinical Chemistry',
        'test_date' => now()->subDay()->format('Y-m-d'),
        'status' => 'Completed',
        'results' => json_encode([
            'test_date' => now()->subHours(3)->format('Y-m-d H:i:s'),
            'performed_by' => 'Lab Technician',
            'results' => [
                'Glucose' => ['value' => '95', 'unit' => 'mg/dL', 'normal_range' => '70-100', 'status' => 'Normal'],
            ],
            'interpretation' => 'Fasting blood glucose within normal limits.',
        ]),
        'notes' => 'Results verified and ready for review',
        'performed_by' => $labTech->id,
        'created_at' => now()->subHours(3),
        'updated_at' => now()->subHours(2),
    ],
]);

$count = DB::table('lab_tests')->count();
echo "✅ SUCCESS! Lab tests in database: {$count}" . PHP_EOL;
echo PHP_EOL;
echo "Tests inserted:" . PHP_EOL;
$tests = DB::table('lab_tests')->select('test_name', 'status')->get();
foreach ($tests as $test) {
    echo "  - {$test->test_name} ({$test->status})" . PHP_EOL;
}
echo PHP_EOL;
echo "Now refresh your lab dashboard at http://localhost:8082" . PHP_EOL;
