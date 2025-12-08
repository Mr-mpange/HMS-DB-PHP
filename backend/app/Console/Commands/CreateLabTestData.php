<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Patient;
use App\Models\LabTest;

class CreateLabTestData extends Command
{
    protected $signature = 'lab:create-test-data';
    protected $description = 'Create sample lab test data with results for testing';

    public function handle()
    {
        $this->info('Creating lab test data...');

        // Get required users
        $doctor = User::where('role', 'doctor')->first();
        $labTech = User::where('role', 'lab_technician')->first();
        $patient = Patient::first();

        if (!$doctor) {
            $this->error('No doctor found in database');
            return 1;
        }

        if (!$labTech) {
            $this->error('No lab technician found in database');
            return 1;
        }

        if (!$patient) {
            $this->error('No patient found in database');
            return 1;
        }

        $this->info("Doctor: {$doctor->name}");
        $this->info("Lab Tech: {$labTech->name}");
        $this->info("Patient: {$patient->full_name}");
        $this->newLine();

        // Test data
        $testData = [
            [
                'name' => 'Complete Blood Count (CBC)',
                'type' => 'Hematology',
                'results' => [
                    'WBC' => ['value' => '12.5', 'unit' => 'x10^9/L', 'normal_range' => '4.5-11.0', 'status' => 'High'],
                    'RBC' => ['value' => '4.8', 'unit' => 'x10^12/L', 'normal_range' => '4.5-5.5', 'status' => 'Normal'],
                    'Hemoglobin' => ['value' => '14.2', 'unit' => 'g/dL', 'normal_range' => '13.5-17.5', 'status' => 'Normal'],
                    'Platelets' => ['value' => '280', 'unit' => 'x10^9/L', 'normal_range' => '150-400', 'status' => 'Normal']
                ],
                'interpretation' => 'Elevated WBC count suggests possible bacterial infection.',
                'recommendations' => 'Recommend antibiotic therapy and follow-up CBC in 1 week.'
            ],
            [
                'name' => 'Blood Sugar (Fasting)',
                'type' => 'Clinical Chemistry',
                'results' => [
                    'Glucose' => ['value' => '105', 'unit' => 'mg/dL', 'normal_range' => '70-100', 'status' => 'High']
                ],
                'interpretation' => 'Slightly elevated fasting glucose. Pre-diabetic range.',
                'recommendations' => 'Recommend lifestyle modifications and repeat test in 3 months.'
            ],
            [
                'name' => 'Liver Function Test',
                'type' => 'Clinical Chemistry',
                'results' => [
                    'ALT' => ['value' => '45', 'unit' => 'U/L', 'normal_range' => '7-56', 'status' => 'Normal'],
                    'AST' => ['value' => '38', 'unit' => 'U/L', 'normal_range' => '10-40', 'status' => 'Normal'],
                    'Bilirubin' => ['value' => '0.8', 'unit' => 'mg/dL', 'normal_range' => '0.3-1.2', 'status' => 'Normal']
                ],
                'interpretation' => 'Liver function within normal limits.',
                'recommendations' => 'No immediate action required.'
            ]
        ];

        $created = 0;
        foreach ($testData as $data) {
            $formattedResults = json_encode([
                'test_date' => now()->format('Y-m-d H:i:s'),
                'performed_by' => $labTech->name,
                'results' => $data['results'],
                'interpretation' => $data['interpretation'],
                'recommendations' => $data['recommendations']
            ]);

            LabTest::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'test_name' => $data['name'],
                'test_type' => $data['type'],
                'test_date' => now(),
                'status' => 'Completed',
                'results' => $formattedResults,
                'notes' => 'Results verified and ready for doctor review',
                'performed_by' => $labTech->id
            ]);

            $this->info("✓ Created: {$data['name']}");
            $created++;
        }

        $this->newLine();
        $this->info("✅ Successfully created {$created} lab tests with complete results");
        $this->info('These tests are now ready for doctor review in the dashboard');

        return 0;
    }
}
