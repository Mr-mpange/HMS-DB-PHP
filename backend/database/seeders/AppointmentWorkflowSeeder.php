<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AppointmentWorkflowSeeder extends Seeder
{
    /**
     * Seeder specifically for testing the appointment workflow with Lab, Pharmacy, and Discharge options
     * Run with: php artisan db:seed --class=AppointmentWorkflowSeeder
     */
    public function run(): void
    {
        $this->command->info('🏥 Creating appointment workflow test data...');

        // Ensure we have the required base data
        $this->ensureBaseData();
        
        // Create specific test patients for each workflow
        $patients = $this->createWorkflowPatients();
        
        // Get doctor and department
        $doctor = DB::table('users')->where('role', 'doctor')->first();
        $department = DB::table('departments')->first();
        
        // Create appointments for each workflow scenario
        $this->createWorkflowAppointments($patients, $doctor, $department);
        
        $this->command->info('✅ Appointment workflow test data created!');
        $this->command->info('');
        $this->command->info('🧪 Test Scenarios Created:');
        $this->command->info('─────────────────────────────────────');
        $this->command->info('1. 🔬 LAB WORKFLOW - Patient needs blood work and ECG');
        $this->command->info('2. 💊 PHARMACY WORKFLOW - Patient needs prescription medication');
        $this->command->info('3. ✅ DISCHARGE WORKFLOW - Patient ready for discharge');
        $this->command->info('4. 🔄 MIXED WORKFLOW - Patient may need lab OR pharmacy');
        $this->command->info('5. 👶 PEDIATRIC WORKFLOW - Child patient for comprehensive testing');
        $this->command->info('─────────────────────────────────────');
        $this->command->info('');
        $this->command->info('🎯 Login and Test:');
        $this->command->info("Email: {$doctor->email}");
        $this->command->info('Password: doctor123');
        $this->command->info('Frontend: http://localhost:8081/auth');
    }

    private function ensureBaseData(): void
    {
        // Ensure we have a doctor
        $doctor = DB::table('users')->where('role', 'doctor')->first();
        if (!$doctor) {
            DB::table('users')->insert([
                'id' => Str::uuid(),
                'name' => 'Dr. Workflow Tester',
                'email' => 'doctor@test.com',
                'password' => bcrypt('doctor123'),
                'role' => 'doctor',
                'phone' => '0700000001',
                'specialization' => 'General Medicine',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Ensure we have a department
        $department = DB::table('departments')->first();
        if (!$department) {
            DB::table('departments')->insert([
                'id' => Str::uuid(),
                'name' => 'General Medicine',
                'description' => 'General medical consultations and workflow testing',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Ensure we have some lab services for testing
        $this->ensureLabServices();
        
        // Ensure we have some medications for testing
        $this->ensureMedications();
    }

    private function ensureLabServices(): void
    {
        $labServices = [
            [
                'id' => Str::uuid(),
                'service_code' => 'LAB001',
                'service_name' => 'Complete Blood Count (CBC)',
                'service_type' => 'Laboratory',
                'description' => 'Complete blood count with differential',
                'base_price' => 15000,
                'currency' => 'TSh',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'service_code' => 'LAB002',
                'service_name' => 'Blood Sugar (Fasting)',
                'service_type' => 'Laboratory',
                'description' => 'Fasting blood glucose test',
                'base_price' => 8000,
                'currency' => 'TSh',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'service_code' => 'LAB003',
                'service_name' => 'ECG (Electrocardiogram)',
                'service_type' => 'Laboratory',
                'description' => 'Electrocardiogram for heart rhythm analysis',
                'base_price' => 25000,
                'currency' => 'TSh',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'service_code' => 'LAB004',
                'service_name' => 'Liver Function Test',
                'service_type' => 'Laboratory',
                'description' => 'Comprehensive liver function panel',
                'base_price' => 20000,
                'currency' => 'TSh',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'service_code' => 'LAB005',
                'service_name' => 'Urine Analysis',
                'service_type' => 'Laboratory',
                'description' => 'Complete urine analysis and microscopy',
                'base_price' => 5000,
                'currency' => 'TSh',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($labServices as $service) {
            DB::table('medical_services')->updateOrInsert(
                ['service_code' => $service['service_code']],
                $service
            );
        }
    }

    private function ensureMedications(): void
    {
        $medications = [
            [
                'id' => Str::uuid(),
                'name' => 'Paracetamol',
                'generic_name' => 'Acetaminophen',
                'dosage_form' => 'Tablet',
                'strength' => '500mg',
                'stock_quantity' => 1000,
                'unit_price' => 500,
                'manufacturer' => 'Test Pharma',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'name' => 'Amoxicillin',
                'generic_name' => 'Amoxicillin',
                'dosage_form' => 'Capsule',
                'strength' => '500mg',
                'stock_quantity' => 500,
                'unit_price' => 1200,
                'manufacturer' => 'Test Pharma',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'name' => 'Metformin',
                'generic_name' => 'Metformin HCl',
                'dosage_form' => 'Tablet',
                'strength' => '500mg',
                'stock_quantity' => 800,
                'unit_price' => 800,
                'manufacturer' => 'Test Pharma',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($medications as $medication) {
            DB::table('medications')->updateOrInsert(
                ['name' => $medication['name'], 'strength' => $medication['strength']],
                $medication
            );
        }
    }

    private function createWorkflowPatients(): array
    {
        $patients = [
            // Patient 1: Lab Workflow - Needs comprehensive blood work
            [
                'id' => Str::uuid(),
                'full_name' => 'Sarah Lab-Test',
                'date_of_birth' => '1985-06-15',
                'gender' => 'Female',
                'phone' => '0712000001',
                'email' => 'sarah.lab@test.com',
                'address' => '123 Lab Street, Dar es Salaam',
                'emergency_contact' => 'John Lab-Test',
                'emergency_phone' => '0712000002',
                'blood_group' => 'A+',
                'allergies' => 'None known',
                'medical_history' => 'Diabetes family history, needs screening',
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            
            // Patient 2: Pharmacy Workflow - Needs prescription
            [
                'id' => Str::uuid(),
                'full_name' => 'Michael Pharmacy-Test',
                'date_of_birth' => '1978-03-22',
                'gender' => 'Male',
                'phone' => '0713000001',
                'email' => 'michael.pharmacy@test.com',
                'address' => '456 Pharmacy Ave, Dar es Salaam',
                'emergency_contact' => 'Lisa Pharmacy-Test',
                'emergency_phone' => '0713000002',
                'blood_group' => 'O+',
                'allergies' => 'Penicillin',
                'medical_history' => 'Hypertension, on medication',
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            
            // Patient 3: Discharge Workflow - Simple consultation
            [
                'id' => Str::uuid(),
                'full_name' => 'Emma Discharge-Test',
                'date_of_birth' => '1992-11-08',
                'gender' => 'Female',
                'phone' => '0714000001',
                'email' => 'emma.discharge@test.com',
                'address' => '789 Discharge Rd, Dar es Salaam',
                'emergency_contact' => 'David Discharge-Test',
                'emergency_phone' => '0714000002',
                'blood_group' => 'B+',
                'allergies' => 'Latex',
                'medical_history' => 'No significant medical history',
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            
            // Patient 4: Mixed Workflow - Could go to lab OR pharmacy
            [
                'id' => Str::uuid(),
                'full_name' => 'Robert Mixed-Test',
                'date_of_birth' => '1970-09-12',
                'gender' => 'Male',
                'phone' => '0715000001',
                'email' => 'robert.mixed@test.com',
                'address' => '321 Mixed Blvd, Dar es Salaam',
                'emergency_contact' => 'Mary Mixed-Test',
                'emergency_phone' => '0715000002',
                'blood_group' => 'AB+',
                'allergies' => 'Shellfish',
                'medical_history' => 'Chest pain episodes, needs evaluation',
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            
            // Patient 5: Pediatric Workflow - Child patient
            [
                'id' => Str::uuid(),
                'full_name' => 'Tommy Pediatric-Test',
                'date_of_birth' => '2015-04-20',
                'gender' => 'Male',
                'phone' => '0716000001',
                'email' => 'tommy.pediatric@test.com',
                'address' => '654 Kids Lane, Dar es Salaam',
                'emergency_contact' => 'Susan Pediatric-Test',
                'emergency_phone' => '0716000002',
                'blood_group' => 'O-',
                'allergies' => 'Peanuts',
                'medical_history' => 'Asthma, well controlled',
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

    private function createWorkflowAppointments(array $patients, $doctor, $department): void
    {
        $today = Carbon::today();
        $appointments = [];

        // Appointment 1: Lab Workflow Test
        $appointments[] = [
            'id' => Str::uuid(),
            'patient_id' => $patients[0]['id'],
            'doctor_id' => $doctor->id,
            'department_id' => $department->id,
            'appointment_date' => $today->copy()->setTime(9, 0),
            'duration' => 30,
            'type' => 'Consultation',
            'status' => 'Confirmed',
            'reason' => '🔬 LAB TEST: Diabetes screening and blood work needed',
            'notes' => 'Patient has family history of diabetes. Needs CBC, fasting glucose, and HbA1c. Perfect for testing LAB WORKFLOW.',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Appointment 2: Pharmacy Workflow Test
        $appointments[] = [
            'id' => Str::uuid(),
            'patient_id' => $patients[1]['id'],
            'doctor_id' => $doctor->id,
            'department_id' => $department->id,
            'appointment_date' => $today->copy()->setTime(10, 0),
            'duration' => 30,
            'type' => 'Consultation',
            'status' => 'Confirmed',
            'reason' => '💊 PHARMACY TEST: Hypertension medication refill',
            'notes' => 'Patient needs blood pressure medication refill. Perfect for testing PHARMACY WORKFLOW.',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Appointment 3: Discharge Workflow Test
        $appointments[] = [
            'id' => Str::uuid(),
            'patient_id' => $patients[2]['id'],
            'doctor_id' => $doctor->id,
            'department_id' => $department->id,
            'appointment_date' => $today->copy()->setTime(11, 0),
            'duration' => 30,
            'type' => 'Consultation',
            'status' => 'Confirmed',
            'reason' => '✅ DISCHARGE TEST: Routine checkup - healthy patient',
            'notes' => 'Routine annual checkup. Patient is healthy, no medications or tests needed. Perfect for testing DISCHARGE WORKFLOW.',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Appointment 4: Mixed Workflow Test
        $appointments[] = [
            'id' => Str::uuid(),
            'patient_id' => $patients[3]['id'],
            'doctor_id' => $doctor->id,
            'department_id' => $department->id,
            'appointment_date' => $today->copy()->setTime(14, 0),
            'duration' => 30,
            'type' => 'Consultation',
            'status' => 'Confirmed',
            'reason' => '🔄 MIXED TEST: Chest pain - needs evaluation',
            'notes' => 'Patient reports chest pain. May need ECG (LAB) or cardiac medication (PHARMACY). Test doctor decision-making.',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Appointment 5: Pediatric Workflow Test
        $appointments[] = [
            'id' => Str::uuid(),
            'patient_id' => $patients[4]['id'],
            'doctor_id' => $doctor->id,
            'department_id' => $department->id,
            'appointment_date' => $today->copy()->setTime(15, 0),
            'duration' => 30,
            'type' => 'Consultation',
            'status' => 'Confirmed',
            'reason' => '👶 PEDIATRIC TEST: School physical and asthma check',
            'notes' => 'Child needs school physical. May need lab work or inhaler prescription. Test pediatric workflow.',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Insert appointments
        foreach ($appointments as $appointment) {
            DB::table('appointments')->insert($appointment);
        }

        // Create corresponding visits for all appointments (ready for doctor consultation)
        $this->createWorkflowVisits($appointments, $today);
    }

    private function createWorkflowVisits(array $appointments, Carbon $today): void
    {
        $visits = [];

        foreach ($appointments as $appointment) {
            $visits[] = [
                'id' => Str::uuid(),
                'patient_id' => $appointment['patient_id'],
                'appointment_id' => $appointment['id'],
                'visit_date' => $today->format('Y-m-d'),
                'current_stage' => 'doctor',
                'overall_status' => 'Active',
                'reception_status' => 'Checked In',
                'reception_completed_at' => $today->copy()->subHours(2),
                'nurse_status' => 'Completed',
                'nurse_completed_at' => $today->copy()->subHours(1),
                'doctor_status' => 'Pending',
                'doctor_id' => $appointment['doctor_id'],
                'lab_status' => 'Not Required',
                'pharmacy_status' => 'Not Required',
                'billing_status' => 'Completed',
                'notes' => 'Patient ready for doctor consultation - workflow testing',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Insert visits
        foreach ($visits as $visit) {
            DB::table('patient_visits')->insert($visit);
        }
    }
}