<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class LabTestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Get the users we created
        $doctor = DB::table('users')->where('email', 'doctor@test.com')->first();
        $labTech = DB::table('users')->where('email', 'lab@test.com')->first();

        if (!$doctor || !$labTech) {
            $this->command->error('❌ Please run LocalUsersSeeder first!');
            return;
        }

        // Create a test patient
        $patientId = Str::uuid();
        DB::table('patients')->insert([
            'id' => $patientId,
            'full_name' => 'John Patient',
            'date_of_birth' => '1985-05-15',
            'gender' => 'Male',
            'phone' => '0756789012',
            'email' => 'patient@test.com',
            'address' => '123 Test Street, Dar es Salaam',
            'emergency_contact' => 'Jane Patient',
            'emergency_phone' => '0767890123',
            'blood_group' => 'O+',
            'allergies' => 'None',
            'medical_history' => 'No significant medical history',
            'status' => 'Active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create a patient visit
        $visitId = Str::uuid();
        DB::table('patient_visits')->insert([
            'id' => $visitId,
            'patient_id' => $patientId,
            'doctor_id' => $doctor->id,
            'visit_date' => now(),
            'chief_complaint' => 'Fever and fatigue for 3 days',
            'provisional_diagnosis' => 'Suspected infection - pending lab results',
            'treatment_plan' => 'Lab tests ordered',
            'vital_signs' => json_encode([
                'temperature' => '38.5',
                'blood_pressure' => '120/80',
                'pulse' => '85',
                'respiratory_rate' => '18'
            ]),
            'notes' => 'Patient presents with fever. Lab tests ordered to determine cause.',
            'status' => 'Active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create lab tests using existing table structure
        $labTests = [
            // Pending test - waiting for lab tech to process
            [
                'id' => Str::uuid(),
                'patient_id' => $patientId,
                'doctor_id' => $doctor->id,
                'visit_id' => $visitId,
                'test_name' => 'Complete Blood Count (CBC)',
                'test_type' => 'Hematology',
                'test_date' => now()->format('Y-m-d'),
                'status' => 'Pending',
                'results' => null,
                'notes' => 'Check for infection markers - ordered by doctor',
                'performed_by' => null,
            ],
            // In Progress test - lab tech is working on it
            [
                'id' => Str::uuid(),
                'patient_id' => $patientId,
                'doctor_id' => $doctor->id,
                'visit_id' => $visitId,
                'test_name' => 'Malaria Test (RDT)',
                'test_type' => 'Parasitology',
                'test_date' => now()->format('Y-m-d'),
                'status' => 'In Progress',
                'results' => null,
                'notes' => 'Patient has fever - urgent malaria screening. Sample collected.',
                'performed_by' => $labTech->id,
            ],
            // Completed test with results - ready for doctor review
            [
                'id' => Str::uuid(),
                'patient_id' => $patientId,
                'doctor_id' => $doctor->id,
                'visit_id' => $visitId,
                'test_name' => 'Complete Blood Count (CBC)',
                'test_type' => 'Hematology',
                'test_date' => now()->subDay()->format('Y-m-d'),
                'status' => 'Completed',
                'results' => json_encode([
                    'test_date' => now()->subHours(3)->format('Y-m-d H:i:s'),
                    'performed_by' => 'Lab Technician',
                    'results' => [
                        'WBC' => ['value' => '12.5', 'unit' => 'x10^9/L', 'normal_range' => '4.5-11.0', 'status' => 'High'],
                        'RBC' => ['value' => '4.8', 'unit' => 'x10^12/L', 'normal_range' => '4.5-5.5', 'status' => 'Normal'],
                        'Hemoglobin' => ['value' => '14.2', 'unit' => 'g/dL', 'normal_range' => '13.5-17.5', 'status' => 'Normal'],
                        'Hematocrit' => ['value' => '42', 'unit' => '%', 'normal_range' => '40-50', 'status' => 'Normal'],
                        'Platelets' => ['value' => '280', 'unit' => 'x10^9/L', 'normal_range' => '150-400', 'status' => 'Normal'],
                    ],
                    'interpretation' => 'Elevated WBC count suggests possible bacterial infection. Other parameters within normal limits.',
                    'recommendations' => 'Recommend antibiotic therapy. Follow-up CBC in 1 week.',
                ]),
                'notes' => 'Results verified and ready for doctor review. Elevated WBC indicates infection.',
                'performed_by' => $labTech->id,
            ],
            // Another completed test - Malaria (Negative)
            [
                'id' => Str::uuid(),
                'patient_id' => $patientId,
                'doctor_id' => $doctor->id,
                'visit_id' => $visitId,
                'test_name' => 'Malaria Test (RDT)',
                'test_type' => 'Parasitology',
                'test_date' => now()->subDay()->format('Y-m-d'),
                'status' => 'Completed',
                'results' => json_encode([
                    'test_date' => now()->subHours(3)->format('Y-m-d H:i:s'),
                    'performed_by' => 'Lab Technician',
                    'results' => [
                        'Result' => ['value' => 'Negative', 'status' => 'Normal'],
                        'Parasites' => ['value' => 'None detected', 'status' => 'Normal'],
                    ],
                    'interpretation' => 'No malaria parasites detected. Malaria ruled out.',
                    'recommendations' => 'Consider other causes of fever. May need additional tests.',
                ]),
                'notes' => 'Rapid diagnostic test negative for malaria. Results verified.',
                'performed_by' => $labTech->id,
            ],
            // Blood Sugar test - Completed
            [
                'id' => Str::uuid(),
                'patient_id' => $patientId,
                'doctor_id' => $doctor->id,
                'visit_id' => $visitId,
                'test_name' => 'Blood Sugar (Fasting)',
                'test_type' => 'Clinical Chemistry',
                'test_date' => now()->subDay()->format('Y-m-d'),
                'status' => 'Completed',
                'results' => json_encode([
                    'test_date' => now()->subHours(4)->format('Y-m-d H:i:s'),
                    'performed_by' => 'Lab Technician',
                    'results' => [
                        'Glucose' => ['value' => '95', 'unit' => 'mg/dL', 'normal_range' => '70-100', 'status' => 'Normal'],
                    ],
                    'interpretation' => 'Fasting blood glucose within normal limits.',
                    'recommendations' => 'No immediate action required. Maintain healthy diet.',
                ]),
                'notes' => 'Patient fasted for 10 hours. Results normal.',
                'performed_by' => $labTech->id,
            ],
        ];

        foreach ($labTests as $test) {
            DB::table('lab_tests')->insert(array_merge($test, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        $this->command->info('✅ Lab test data created successfully!');
        $this->command->info('');
        $this->command->info('Created:');
        $this->command->info('─────────────────────────────────────');
        $this->command->info('• 1 Test Patient: John Patient');
        $this->command->info('• 1 Patient Visit with Dr. John Doe');
        $this->command->info('• 5 Lab Tests:');
        $this->command->info('  - 1 Pending (CBC)');
        $this->command->info('  - 1 In Progress (Malaria)');
        $this->command->info('  - 3 Completed with Results (CBC, Malaria, Blood Sugar)');
        $this->command->info('─────────────────────────────────────');
        $this->command->info('Lab Tech: Process pending/in-progress tests');
        $this->command->info('Doctor: Review completed test results');
    }
}
