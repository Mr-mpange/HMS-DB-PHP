<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class NurseLabWorkflowSeeder extends Seeder
{
    /**
     * Seeder for testing Nurse → Lab → Nurse workflow
     * Run with: php artisan db:seed --class=NurseLabWorkflowSeeder
     */
    public function run(): void
    {
        $this->command->info('🏥 Creating Nurse → Lab workflow test data...');

        // Ensure we have a nurse user
        $nurse = $this->ensureNurseUser();
        
        // Ensure we have a department
        $department = $this->ensureDepartment();
        
        // Create test patients for nurse workflow
        $patients = $this->createNurseWorkflowPatients();
        
        // Create visits that simulate nurse sending patients to lab
        $this->createNurseToLabVisits($patients, $nurse, $department);
        
        // Create lab tests for these patients
        $this->createLabTestsForNursePatients($patients, $nurse);
        
        $this->command->info('✅ Nurse → Lab workflow test data created!');
        $this->command->info('');
        $this->command->info('🧪 Test Scenarios Created:');
        $this->command->info('─────────────────────────────────────');
        $this->command->info('1. 🩺 NURSE → LAB: Patient needs routine blood work');
        $this->command->info('2. 🩺 NURSE → LAB: Patient needs urine analysis');
        $this->command->info('3. 🩺 NURSE → LAB: Patient needs multiple tests');
        $this->command->info('─────────────────────────────────────');
        $this->command->info('');
        $this->command->info('🎯 Testing Instructions:');
        $this->command->info('1. Login as Lab Tech: lab@test.com / lab123');
        $this->command->info('2. Complete the lab tests in Lab Dashboard');
        $this->command->info('3. Check if patients return to Nurse Dashboard');
        $this->command->info('4. Login as Nurse to verify workflow');
    }

    private function ensureNurseUser()
    {
        $nurse = DB::table('users')->where('role', 'nurse')->first();
        
        if (!$nurse) {
            $nurseId = Str::uuid();
            DB::table('users')->insert([
                'id' => $nurseId,
                'name' => 'Nurse Sarah',
                'email' => 'nurse@test.com',
                'password' => bcrypt('nurse123'),
                'role' => 'nurse',
                'phone' => '0700000002',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $nurse = DB::table('users')->where('id', $nurseId)->first();
        }
        
        return $nurse;
    }

    private function ensureDepartment()
    {
        $department = DB::table('departments')->first();
        
        if (!$department) {
            $departmentId = Str::uuid();
            DB::table('departments')->insert([
                'id' => $departmentId,
                'name' => 'General Medicine',
                'description' => 'General medical care and nursing',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $department = DB::table('departments')->where('id', $departmentId)->first();
        }
        
        return $department;
    }

    private function createNurseWorkflowPatients(): array
    {
        $patients = [
            [
                'id' => Str::uuid(),
                'full_name' => 'Alice Nurse-Lab-Test',
                'date_of_birth' => '1988-04-10',
                'gender' => 'Female',
                'phone' => '0718000001',
                'email' => 'alice.nurselab@test.com',
                'address' => '100 Nurse Street, Dar es Salaam',
                'emergency_contact' => 'Bob Nurse-Test',
                'emergency_phone' => '0718000002',
                'blood_group' => 'O+',
                'allergies' => 'None known',
                'medical_history' => 'Routine checkup - nurse ordered blood work',
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'full_name' => 'Bob Urine-Test',
                'date_of_birth' => '1975-08-22',
                'gender' => 'Male',
                'phone' => '0719000001',
                'email' => 'bob.urine@test.com',
                'address' => '200 Lab Avenue, Dar es Salaam',
                'emergency_contact' => 'Carol Urine-Test',
                'emergency_phone' => '0719000002',
                'blood_group' => 'A+',
                'allergies' => 'Penicillin',
                'medical_history' => 'UTI symptoms - nurse ordered urine analysis',
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'full_name' => 'Carol Multi-Test',
                'date_of_birth' => '1990-12-05',
                'gender' => 'Female',
                'phone' => '0720000001',
                'email' => 'carol.multi@test.com',
                'address' => '300 Multiple Road, Dar es Salaam',
                'emergency_contact' => 'David Multi-Test',
                'emergency_phone' => '0720000002',
                'blood_group' => 'B+',
                'allergies' => 'Latex',
                'medical_history' => 'Pre-surgery workup - nurse ordered multiple tests',
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($patients as $patient) {
            DB::table('patients')->updateOrInsert(
                ['phone' => $patient['phone']],
                $patient
            );
        }

        return $patients;
    }

    private function createNurseToLabVisits(array $patients, $nurse, $department): void
    {
        $today = Carbon::today();
        
        foreach ($patients as $index => $patient) {
            $visitId = Str::uuid();
            
            // Create visit that simulates nurse sending patient to lab
            DB::table('patient_visits')->insert([
                'id' => $visitId,
                'patient_id' => $patient['id'],
                'visit_date' => $today->format('Y-m-d'),
                'current_stage' => 'lab', // Patient is currently in lab
                'overall_status' => 'Active',
                
                // Reception completed
                'reception_status' => 'Checked In',
                'reception_completed_at' => $today->copy()->subHours(3),
                
                // Nurse completed (sent to lab)
                'nurse_status' => 'Completed',
                'nurse_completed_at' => $today->copy()->subHours(2),
                
                // Doctor not required (nurse workflow)
                'doctor_status' => 'Not Required',
                'doctor_id' => null,
                
                // Lab pending
                'lab_status' => 'Pending',
                'lab_completed_at' => null,
                
                // Other statuses
                'pharmacy_status' => 'Not Required',
                'billing_status' => 'Not Required',
                
                'notes' => 'Patient sent to lab by nurse for ' . [
                    'routine blood work',
                    'urine analysis', 
                    'pre-surgery tests'
                ][$index],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function createLabTestsForNursePatients(array $patients, $nurse): void
    {
        // Get a doctor for the lab tests (required field)
        $doctor = DB::table('users')->where('role', 'doctor')->first();
        if (!$doctor) {
            // Create a doctor if none exists
            $doctorId = Str::uuid();
            DB::table('users')->insert([
                'id' => $doctorId,
                'name' => 'Dr. Lab Supervisor',
                'email' => 'doctor.lab@test.com',
                'password' => bcrypt('doctor123'),
                'role' => 'doctor',
                'phone' => '0700000003',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $doctor = DB::table('users')->where('id', $doctorId)->first();
        }
        // Test scenarios for each patient
        $testScenarios = [
            // Patient 1: Routine blood work
            [
                ['test_name' => 'Complete Blood Count (CBC)', 'test_type' => 'Laboratory'],
                ['test_name' => 'Blood Sugar (Fasting)', 'test_type' => 'Laboratory'],
            ],
            // Patient 2: Urine analysis
            [
                ['test_name' => 'Urine Analysis', 'test_type' => 'Laboratory'],
            ],
            // Patient 3: Multiple tests
            [
                ['test_name' => 'Complete Blood Count (CBC)', 'test_type' => 'Laboratory'],
                ['test_name' => 'Liver Function Test', 'test_type' => 'Laboratory'],
                ['test_name' => 'Urine Analysis', 'test_type' => 'Laboratory'],
            ],
        ];

        foreach ($patients as $index => $patient) {
            $tests = $testScenarios[$index];
            
            foreach ($tests as $testData) {
                DB::table('lab_tests')->insert([
                    'id' => Str::uuid(),
                    'patient_id' => $patient['id'],
                    'test_name' => $testData['test_name'],
                    'test_type' => $testData['test_type'],
                    'test_date' => now()->format('Y-m-d'),
                    'status' => 'Pending',
                    'doctor_id' => $doctor->id, // Required field, but test was ordered by nurse
                    'notes' => 'Ordered by nurse for patient care',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}