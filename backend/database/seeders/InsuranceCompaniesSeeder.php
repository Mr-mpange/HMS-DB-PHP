<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InsuranceCompany;
use Illuminate\Support\Str;

class InsuranceCompaniesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $companies = [
            [
                'name' => 'NHIF (National Health Insurance Fund)',
                'code' => 'NHIF',
                'contact_person' => 'NHIF Customer Service',
                'phone' => '+255 22 2153835',
                'email' => 'info@nhif.or.tz',
                'address' => 'Maktaba Street, Dar es Salaam',
                'is_active' => true,
            ],
            [
                'name' => 'AAR Insurance',
                'code' => 'AAR',
                'contact_person' => 'AAR Customer Service',
                'phone' => '+255 22 2601000',
                'email' => 'info@aar-insurance.co.tz',
                'address' => 'Dar es Salaam',
                'is_active' => true,
            ],
            [
                'name' => 'Jubilee Insurance',
                'code' => 'JUBILEE',
                'contact_person' => 'Jubilee Customer Service',
                'phone' => '+255 22 2113700',
                'email' => 'info@jubileeinsurance.com',
                'address' => 'Dar es Salaam',
                'is_active' => true,
            ],
            [
                'name' => 'Strategis Insurance',
                'code' => 'STRATEGIS',
                'contact_person' => 'Strategis Customer Service',
                'phone' => '+255 22 2700208',
                'email' => 'info@strategis-insurance.com',
                'address' => 'Dar es Salaam',
                'is_active' => true,
            ],
            [
                'name' => 'Resolution Insurance',
                'code' => 'RESOLUTION',
                'contact_person' => 'Resolution Customer Service',
                'phone' => '+255 22 2700000',
                'email' => 'info@resolution.co.tz',
                'address' => 'Dar es Salaam',
                'is_active' => true,
            ],
            [
                'name' => 'Britam Insurance',
                'code' => 'BRITAM',
                'contact_person' => 'Britam Customer Service',
                'phone' => '+255 22 2863000',
                'email' => 'info@britam.com',
                'address' => 'Dar es Salaam',
                'is_active' => true,
            ],
            [
                'name' => 'Sanlam Insurance',
                'code' => 'SANLAM',
                'contact_person' => 'Sanlam Customer Service',
                'phone' => '+255 22 2116507',
                'email' => 'info@sanlam.co.tz',
                'address' => 'Dar es Salaam',
                'is_active' => true,
            ],
            [
                'name' => 'Phoenix of Tanzania Assurance',
                'code' => 'PHOENIX',
                'contact_person' => 'Phoenix Customer Service',
                'phone' => '+255 22 2117974',
                'email' => 'info@phoenix.co.tz',
                'address' => 'Dar es Salaam',
                'is_active' => true,
            ],
        ];

        foreach ($companies as $company) {
            InsuranceCompany::firstOrCreate(
                ['code' => $company['code']],
                array_merge($company, ['id' => Str::uuid()])
            );
        }

        $this->command->info('Insurance companies seeded successfully!');
    }
}
