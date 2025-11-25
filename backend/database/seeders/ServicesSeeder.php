<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ServicesSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            // Medical Consultation Services
            [
                'id' => Str::uuid(),
                'service_code' => 'CONS-001',
                'service_name' => 'General Consultation',
                'service_type' => 'Consultation',
                'description' => 'General medical consultation with doctor',
                'base_price' => 20000,
                'is_active' => true,
            ],
            [
                'id' => Str::uuid(),
                'service_code' => 'CONS-002',
                'service_name' => 'Specialist Consultation',
                'service_type' => 'Consultation',
                'description' => 'Consultation with specialist doctor',
                'base_price' => 50000,
                'is_active' => true,
            ],
            
            // Procedures
            [
                'id' => Str::uuid(),
                'service_code' => 'PROC-001',
                'service_name' => 'Wound Dressing',
                'service_type' => 'Procedure',
                'description' => 'Wound cleaning and dressing',
                'base_price' => 15000,
                'is_active' => true,
            ],
            [
                'id' => Str::uuid(),
                'service_code' => 'PROC-002',
                'service_name' => 'Injection',
                'service_type' => 'Procedure',
                'description' => 'Intramuscular or intravenous injection',
                'base_price' => 5000,
                'is_active' => true,
            ],
            [
                'id' => Str::uuid(),
                'service_code' => 'PROC-003',
                'service_name' => 'Suturing',
                'service_type' => 'Procedure',
                'description' => 'Wound suturing/stitching',
                'base_price' => 30000,
                'is_active' => true,
            ],
            [
                'id' => Str::uuid(),
                'service_code' => 'PROC-004',
                'service_name' => 'IV Drip',
                'service_type' => 'Procedure',
                'description' => 'Intravenous fluid administration',
                'base_price' => 25000,
                'is_active' => true,
            ],
            
            // Diagnostic Services
            [
                'id' => Str::uuid(),
                'service_code' => 'DIAG-001',
                'service_name' => 'Blood Pressure Check',
                'service_type' => 'Diagnostic',
                'description' => 'Blood pressure measurement',
                'base_price' => 2000,
                'is_active' => true,
            ],
            [
                'id' => Str::uuid(),
                'service_code' => 'DIAG-002',
                'service_name' => 'Blood Sugar Test',
                'service_type' => 'Diagnostic',
                'description' => 'Random blood glucose test',
                'base_price' => 5000,
                'is_active' => true,
            ],
            
            // Vaccination
            [
                'id' => Str::uuid(),
                'service_code' => 'VACC-001',
                'service_name' => 'COVID-19 Vaccination',
                'service_type' => 'Vaccination',
                'description' => 'COVID-19 vaccine administration',
                'base_price' => 10000,
                'is_active' => true,
            ],
            [
                'id' => Str::uuid(),
                'service_code' => 'VACC-002',
                'service_name' => 'Flu Vaccination',
                'service_type' => 'Vaccination',
                'description' => 'Seasonal influenza vaccine',
                'base_price' => 15000,
                'is_active' => true,
            ],
            
            // Laboratory (These will be filtered out in quick service)
            [
                'id' => Str::uuid(),
                'service_code' => 'LAB-001',
                'service_name' => 'Complete Blood Count (CBC)',
                'service_type' => 'Laboratory',
                'description' => 'Full blood count analysis',
                'base_price' => 25000,
                'is_active' => true,
            ],
            [
                'id' => Str::uuid(),
                'service_code' => 'LAB-002',
                'service_name' => 'Malaria Test',
                'service_type' => 'Laboratory',
                'description' => 'Rapid malaria diagnostic test',
                'base_price' => 10000,
                'is_active' => true,
            ],
        ];

        foreach ($services as $service) {
            DB::table('medical_services')->updateOrInsert(
                ['service_code' => $service['service_code']],
                array_merge($service, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }

        $this->command->info('Medical services seeded successfully!');
    }
}
