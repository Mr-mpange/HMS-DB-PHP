<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class QuickServiceTestSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🚀 Creating Quick Service test data...');

        // Create test patients for different Quick Service scenarios
        $patients = $this->createTestPatients();
        
        // Create Quick Service visits with different service types
        $this->createQuickServiceVisits($patients);
        
        $this->command->info('✅ Quick Service test data created successfully!');
    }

    private function createTestPatients(): array
    {
        $patients = [
            [
                'id' => Str::uuid(),
                'full_name' => 'Sarah Vaccination-Test',
                'phone' => '0712000001',
                'email' => 'sarah.vaccine@test.com',
                'date_of_birth' => '1990-05-15',
                'gender' => 'Female',
                'address' => 'Vaccination Test Address',
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'full_name' => 'John Injection-Test',
                'phone' => '0713000002',
                'email' => 'john.injection@test.com',
                'date_of_birth' => '1985-08-22',
                'gender' => 'Male',
                'address' => 'Injection Test Address',
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'full_name' => 'Mary WoundCare-Test',
                'phone' => '0714000003',
                'email' => 'mary.wound@test.com',
                'date_of_birth' => '1992-12-10',
                'gender' => 'Female',
                'address' => 'Wound Care Test Address',
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'full_name' => 'David BloodPressure-Test',
                'phone' => '0715000004',
                'email' => 'david.bp@test.com',
                'date_of_birth' => '1978-03-18',
                'gender' => 'Male',
                'address' => 'BP Check Test Address',
                'status' => 'Active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'full_name' => 'Lisa Suturing-Test',
                'phone' => '0716000005',
                'email' => 'lisa.suture@test.com',
                'date_of_birth' => '1988-07-25',
                'gender' => 'Female',
                'address' => 'Suturing Test Address',
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

        $this->command->info('👥 Created ' . count($patients) . ' test patients');
        return $patients;
    }

    private function createQuickServiceVisits(array $patients): void
    {
        // Get service IDs for different service types
        $services = [
            'vaccination' => DB::table('medical_services')
                ->where('service_type', 'Vaccination')
                ->where('service_name', 'LIKE', '%COVID-19%')
                ->first(),
            'injection' => DB::table('medical_services')
                ->where('service_type', 'Procedure')
                ->where('service_name', 'Injection')
                ->first(),
            'wound_dressing' => DB::table('medical_services')
                ->where('service_type', 'Procedure')
                ->where('service_name', 'Wound Dressing')
                ->first(),
            'blood_pressure' => DB::table('medical_services')
                ->where('service_type', 'Diagnostic')
                ->where('service_name', 'Blood Pressure Check')
                ->first(),
            'suturing' => DB::table('medical_services')
                ->where('service_type', 'Procedure')
                ->where('service_name', 'Suturing')
                ->first(),
        ];

        $quickServiceData = [
            [
                'patient' => $patients[0], // Sarah Vaccination-Test
                'service' => $services['vaccination'],
                'service_name' => 'COVID-19 Vaccination',
                'notes' => 'Quick Service: COVID-19 Vaccination - Paid upfront',
                'amount' => 25000,
            ],
            [
                'patient' => $patients[1], // John Injection-Test
                'service' => $services['injection'],
                'service_name' => 'Injection',
                'notes' => 'Quick Service: Injection - Paid upfront',
                'amount' => 5000,
            ],
            [
                'patient' => $patients[2], // Mary WoundCare-Test
                'service' => $services['wound_dressing'],
                'service_name' => 'Wound Dressing',
                'notes' => 'Quick Service: Wound Dressing - Paid upfront',
                'amount' => 15000,
            ],
            [
                'patient' => $patients[3], // David BloodPressure-Test
                'service' => $services['blood_pressure'],
                'service_name' => 'Blood Pressure Check',
                'notes' => 'Quick Service: Blood Pressure Check - Paid upfront',
                'amount' => 8000,
            ],
            [
                'patient' => $patients[4], // Lisa Suturing-Test
                'service' => $services['suturing'],
                'service_name' => 'Suturing',
                'notes' => 'Quick Service: Suturing - Paid upfront',
                'amount' => 30000,
            ],
        ];

        foreach ($quickServiceData as $data) {
            if (!$data['service']) {
                $this->command->warn("⚠️  Service '{$data['service_name']}' not found, skipping...");
                continue;
            }

            // Create visit
            $visitId = Str::uuid();
            DB::table('patient_visits')->insert([
                'id' => $visitId,
                'patient_id' => $data['patient']['id'],
                'visit_date' => now()->toDateString(),
                'reception_status' => 'Completed',
                'reception_completed_at' => now(),
                'current_stage' => 'nurse',
                'nurse_status' => 'Pending',
                'doctor_status' => 'Not Required',
                'lab_status' => 'Not Required',
                'pharmacy_status' => 'Not Required',
                'billing_status' => 'Completed',
                'overall_status' => 'Active',
                'visit_type' => 'Quick Service',
                'notes' => $data['notes'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create patient service
            DB::table('patient_services')->insert([
                'id' => Str::uuid(),
                'patient_id' => $data['patient']['id'],
                'service_id' => $data['service']->id,
                'quantity' => 1,
                'unit_price' => $data['amount'],
                'total_price' => $data['amount'],
                'service_date' => now()->toDateString(),
                'status' => 'Completed',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create invoice
            $invoiceId = Str::uuid();
            $invoiceNumber = 'QS-' . now()->format('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            
            DB::table('invoices')->insert([
                'id' => $invoiceId,
                'patient_id' => $data['patient']['id'],
                'invoice_number' => $invoiceNumber,
                'invoice_date' => now()->toDateString(),
                'total_amount' => $data['amount'],
                'paid_amount' => $data['amount'],
                'balance' => 0,
                'status' => 'Paid',
                'notes' => "Quick Service: {$data['service_name']}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create payment record
            DB::table('payments')->insert([
                'id' => Str::uuid(),
                'patient_id' => $data['patient']['id'],
                'invoice_id' => $invoiceId,
                'amount' => $data['amount'],
                'payment_method' => 'Cash',
                'payment_type' => 'Quick Service',
                'status' => 'Completed',
                'payment_date' => now(),
                'notes' => "Payment for {$data['service_name']}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->command->info("✅ Created Quick Service visit: {$data['patient']['full_name']} - {$data['service_name']}");
        }
    }
}