<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class QuickTestSeeder extends Seeder
{
    /**
     * Quick seeder for testing appointment workflows
     * Run with: php artisan db:seed --class=QuickTestSeeder
     */
    public function run(): void
    {
        $this->command->info('🚀 Quick Test Seeder - Creating minimal test data...');

        // Get or create a doctor
        $doctor = DB::table('users')->where('role', 'doctor')->first();
        if (!$doctor) {
            $doctorId = Str::uuid();
            DB::table('users')->insert([
                'id' => $doctorId,
                'name' => 'Dr. Test Doctor',
                'email' => 'doctor@test.local',
                'password' => bcrypt('password'),
                'role' => 'doctor',
                'phone' => '0700000001',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $doctor = DB::table('users')->where('id', $doctorId)->first();
        }

        // Get or create a department
        $department = DB::table('departments')->first();
        if (!$department) {
            $departmentId = Str::uuid();
            DB::table('departments')->insert([
                'id' => $departmentId,
                'name' => 'General Medicine',
                'description' => 'General medical consultations and primary care',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $department = DB::table('departments')->where('id', $departmentId)->first();
        }

        // Create test patients
        $patients = [];
        for ($i = 1; $i <= 3; $i++) {
            $patientId = Str::uuid();
            $patient = [
                'id' => $patientId,
                'full_name' => "Test Patient $i",
                'date_of_birth' => '1990-01-01',
                'gender' => $i % 2 == 0 ? 'Female' : 'Male',
                'phone' => "071234500$i",
                'email' => "patient$i@test.local",
                'address' => "Test Address $i",
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now(),
            ];
            
            DB::table('patients')->updateOrInsert(
                ['phone' => $patient['phone']],
                $patient
            );
            
            $patients[] = $patient;
        }

        // Create test appointments for today
        $today = Carbon::today();
        $appointments = [];
        
        for ($i = 0; $i < 3; $i++) {
            $appointmentId = Str::uuid();
            $appointment = [
                'id' => $appointmentId,
                'patient_id' => $patients[$i]['id'],
                'doctor_id' => $doctor->id,
                'department_id' => $department->id,
                'appointment_date' => $today->copy()->setTime(9 + $i, 0),
                'duration' => 30,
                'type' => 'Consultation',
                'status' => 'Confirmed',
                'reason' => [
                    'Routine checkup - needs lab work',
                    'Follow-up visit - needs prescription',
                    'General consultation - ready for discharge'
                ][$i],
                'notes' => "Test appointment $i for workflow testing",
                'created_at' => now(),
                'updated_at' => now(),
            ];
            
            DB::table('appointments')->insert($appointment);
            $appointments[] = $appointment;

            // Create corresponding visit
            DB::table('patient_visits')->insert([
                'id' => Str::uuid(),
                'patient_id' => $patients[$i]['id'],
                'appointment_id' => $appointmentId,
                'visit_date' => $today->format('Y-m-d'),
                'current_stage' => 'doctor',
                'overall_status' => 'Active',
                'reception_status' => 'Checked In',
                'reception_completed_at' => now()->subHour(),
                'nurse_status' => 'Completed',
                'nurse_completed_at' => now()->subMinutes(30),
                'doctor_status' => 'Pending',
                'doctor_id' => $doctor->id,
                'lab_status' => 'Not Required',
                'pharmacy_status' => 'Not Required',
                'billing_status' => 'Completed',
                'notes' => "Test visit $i - ready for doctor consultation",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('✅ Quick test data created!');
        $this->command->info('');
        $this->command->info('Test Data Summary:');
        $this->command->info('─────────────────────────────────────');
        $this->command->info("Doctor: {$doctor->name} ({$doctor->email})");
        $this->command->info("Department: {$department->name}");
        $this->command->info('Patients: 3 test patients created');
        $this->command->info('Appointments: 3 appointments for today');
        $this->command->info('Visits: 3 active visits ready for consultation');
        $this->command->info('─────────────────────────────────────');
        $this->command->info('');
        $this->command->info('Login as doctor to test the workflow:');
        $this->command->info("Email: {$doctor->email}");
        if ($doctor->email === 'doctor@test.com') {
            $this->command->info('Password: doctor123');
        } elseif ($doctor->email === 'doctor.test@hospital.com') {
            $this->command->info('Password: doctor123');
        } else {
            $this->command->info('Password: password');
        }
    }
}