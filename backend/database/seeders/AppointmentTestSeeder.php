<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AppointmentTestSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🏥 Creating test appointments for workflow testing...');

        // First, ensure we have departments
        $this->createDepartments();
        
        // Create test patients
        $patients = $this->createPatients();
        
        // Get existing users (doctors)
        $doctors = DB::table('users')->where('role', 'doctor')->get();
        
        if ($doctors->isEmpty()) {
            $this->command->warn('⚠️  No doctors found. Creating a test doctor...');
            $doctorId = $this->createTestDoctor();
            $doctors = collect([DB::table('users')->where('id', $doctorId)->first()]);
        }

        // Get departments
        $departments = DB::table('departments')->get();
        
        // Create appointments for testing different workflows
        $this->createTestAppointments($patients, $doctors, $departments);
        
        $this->command->info('✅ Test appointments created successfully!');
        $this->command->info('');
        $this->command->info('Test Scenarios Created:');
        $this->command->info('─────────────────────────────────────');
        $this->command->info('1. Scheduled appointments ready for consultation');
        $this->command->info('2. In-progress appointments for lab workflow testing');
        $this->command->info('3. Patients with different medical conditions');
        $this->command->info('4. Various appointment times (past, current, future)');
        $this->command->info('─────────────────────────────────────');
    }

    private function createDepartments(): void
    {
        $departments = [
            [
                'id' => Str::uuid(),
                'name' => 'General Medicine',
                'description' => 'General medical consultations and primary care',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'name' => 'Pediatrics',
                'description' => 'Medical care for infants, children, and adolescents',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'name' => 'Cardiology',
                'description' => 'Heart and cardiovascular system care',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($departments as $department) {
            DB::table('departments')->updateOrInsert(
                ['name' => $department['name']],
                $department
            );
        }
    }

    private function createPatients(): array
    {
        $patients = [
            [
                'id' => Str::uuid(),
                'full_name' => 'John Smith',
                'date_of_birth' => '1985-03-15',
                'gender' => 'Male',
                'phone' => '0712345001',
                'email' => 'john.smith@email.com',
                'address' => '123 Main Street, Dar es Salaam',
                'emergency_contact' => 'Jane Smith',
                'emergency_phone' => '0712345002',
                'blood_group' => 'O+',
                'allergies' => 'Penicillin',
                'medical_history' => 'Hypertension, managed with medication',
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'full_name' => 'Mary Johnson',
                'date_of_birth' => '1992-07-22',
                'gender' => 'Female',
                'phone' => '0723456001',
                'email' => 'mary.johnson@email.com',
                'address' => '456 Oak Avenue, Dar es Salaam',
                'emergency_contact' => 'Robert Johnson',
                'emergency_phone' => '0723456002',
                'blood_group' => 'A+',
                'allergies' => 'None known',
                'medical_history' => 'Diabetes Type 2, diet controlled',
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'full_name' => 'Ahmed Hassan',
                'date_of_birth' => '1978-11-08',
                'gender' => 'Male',
                'phone' => '0734567001',
                'email' => 'ahmed.hassan@email.com',
                'address' => '789 Uhuru Street, Dar es Salaam',
                'emergency_contact' => 'Fatima Hassan',
                'emergency_phone' => '0734567002',
                'blood_group' => 'B+',
                'allergies' => 'Shellfish',
                'medical_history' => 'Asthma, uses inhaler as needed',
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'full_name' => 'Grace Mwangi',
                'date_of_birth' => '1995-05-12',
                'gender' => 'Female',
                'phone' => '0745678001',
                'email' => 'grace.mwangi@email.com',
                'address' => '321 Kilimani Road, Dar es Salaam',
                'emergency_contact' => 'Peter Mwangi',
                'emergency_phone' => '0745678002',
                'blood_group' => 'AB+',
                'allergies' => 'Latex',
                'medical_history' => 'No significant medical history',
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'full_name' => 'David Wilson',
                'date_of_birth' => '2010-09-30',
                'gender' => 'Male',
                'phone' => '0756789001',
                'email' => 'david.wilson@email.com',
                'address' => '654 Msimbazi Street, Dar es Salaam',
                'emergency_contact' => 'Sarah Wilson',
                'emergency_phone' => '0756789002',
                'blood_group' => 'O-',
                'allergies' => 'Peanuts',
                'medical_history' => 'Childhood asthma, well controlled',
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

    private function createTestDoctor(): string
    {
        $doctorId = Str::uuid();
        
        DB::table('users')->insert([
            'id' => $doctorId,
            'name' => 'Dr. Sarah Medical',
            'email' => 'doctor.test@hospital.com',
            'password' => bcrypt('doctor123'),
            'role' => 'doctor',
            'phone' => '0700000001',
            'specialization' => 'General Medicine',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $doctorId;
    }

    private function createTestAppointments(array $patients, $doctors, $departments): void
    {
        $today = Carbon::today();
        $appointments = [];

        // Get patient and doctor IDs
        $patientIds = collect($patients)->pluck('id')->toArray();
        $doctorIds = $doctors->pluck('id')->toArray();
        $departmentIds = $departments->pluck('id')->toArray();

        // Scenario 1: Today's appointments ready for consultation
        $appointments[] = [
            'id' => Str::uuid(),
            'patient_id' => $patientIds[0],
            'doctor_id' => $doctorIds[0],
            'department_id' => $departmentIds[0] ?? null,
            'appointment_date' => $today->copy()->setTime(9, 0),
            'duration' => 30,
            'type' => 'Consultation',
            'status' => 'Confirmed',
            'reason' => 'Routine checkup and blood pressure monitoring',
            'notes' => 'Patient reports feeling well, wants BP check',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        $appointments[] = [
            'id' => Str::uuid(),
            'patient_id' => $patientIds[1],
            'doctor_id' => $doctorIds[0],
            'department_id' => $departmentIds[0] ?? null,
            'appointment_date' => $today->copy()->setTime(10, 30),
            'duration' => 30,
            'type' => 'Consultation',
            'status' => 'Confirmed',
            'reason' => 'Diabetes follow-up and medication review',
            'notes' => 'Regular diabetes monitoring appointment',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Scenario 2: Appointments that need lab work
        $appointments[] = [
            'id' => Str::uuid(),
            'patient_id' => $patientIds[2],
            'doctor_id' => $doctorIds[0],
            'department_id' => $departmentIds[0] ?? null,
            'appointment_date' => $today->copy()->setTime(11, 0),
            'duration' => 30,
            'type' => 'Consultation',
            'status' => 'Confirmed',
            'reason' => 'Chest pain and shortness of breath',
            'notes' => 'Patient needs ECG and blood work to rule out cardiac issues',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Scenario 3: Pediatric appointment
        if (count($departmentIds) > 1) {
            $appointments[] = [
                'id' => Str::uuid(),
                'patient_id' => $patientIds[4], // David Wilson (child)
                'doctor_id' => $doctorIds[0],
                'department_id' => $departmentIds[1], // Pediatrics
                'appointment_date' => $today->copy()->setTime(14, 0),
                'duration' => 30,
                'type' => 'Consultation',
                'status' => 'Confirmed',
                'reason' => 'School physical examination',
                'notes' => 'Annual school health check required',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Scenario 4: Appointment needing prescription
        $appointments[] = [
            'id' => Str::uuid(),
            'patient_id' => $patientIds[3],
            'doctor_id' => $doctorIds[0],
            'department_id' => $departmentIds[0] ?? null,
            'appointment_date' => $today->copy()->setTime(15, 30),
            'duration' => 30,
            'type' => 'Consultation',
            'status' => 'Confirmed',
            'reason' => 'Headaches and fatigue',
            'notes' => 'Patient reports frequent headaches, may need pain medication',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Scenario 5: Tomorrow's appointments
        $appointments[] = [
            'id' => Str::uuid(),
            'patient_id' => $patientIds[0],
            'doctor_id' => $doctorIds[0],
            'department_id' => $departmentIds[0] ?? null,
            'appointment_date' => $today->copy()->addDay()->setTime(9, 0),
            'duration' => 30,
            'type' => 'Follow-up',
            'status' => 'Scheduled',
            'reason' => 'Follow-up for lab results',
            'notes' => 'Review blood work results from previous visit',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Insert appointments
        foreach ($appointments as $appointment) {
            DB::table('appointments')->insert($appointment);
        }

        // Create corresponding visits for today's confirmed appointments
        $this->createVisitsForAppointments($appointments, $today);
    }

    private function createVisitsForAppointments(array $appointments, Carbon $today): void
    {
        $visits = [];

        foreach ($appointments as $appointment) {
            // Only create visits for today's confirmed appointments
            if (Carbon::parse($appointment['appointment_date'])->isSameDay($today) && 
                $appointment['status'] === 'Confirmed') {
                
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
                    'notes' => 'Patient checked in and ready for doctor consultation',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        // Insert visits
        foreach ($visits as $visit) {
            DB::table('patient_visits')->insert($visit);
        }
    }
}