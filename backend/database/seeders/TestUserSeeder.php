<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin Users
        User::create([
            'id' => Str::uuid(),
            'name' => 'Test User',
            'email' => 'test@test.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        User::create([
            'id' => Str::uuid(),
            'name' => 'System Administrator',
            'email' => 'admin@hasetcompany.or.tz',
            'password' => Hash::make('Admin@123'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        // Doctor
        User::create([
            'id' => Str::uuid(),
            'name' => 'Dr. John Smith',
            'email' => 'doctor@hospital.com',
            'password' => Hash::make('doctor123'),
            'role' => 'doctor',
            'is_active' => true,
        ]);

        // Nurse
        User::create([
            'id' => Str::uuid(),
            'name' => 'Nurse Mary Johnson',
            'email' => 'nurse@hospital.com',
            'password' => Hash::make('nurse123'),
            'role' => 'nurse',
            'is_active' => true,
        ]);

        // Receptionist
        User::create([
            'id' => Str::uuid(),
            'name' => 'Sarah Wilson',
            'email' => 'receptionist@hospital.com',
            'password' => Hash::make('reception123'),
            'role' => 'receptionist',
            'is_active' => true,
        ]);

        // Pharmacist
        User::create([
            'id' => Str::uuid(),
            'name' => 'Michael Brown',
            'email' => 'pharmacist@hospital.com',
            'password' => Hash::make('pharmacy123'),
            'role' => 'pharmacist',
            'is_active' => true,
        ]);

        // Lab Technician
        User::create([
            'id' => Str::uuid(),
            'name' => 'Lisa Davis',
            'email' => 'lab@hospital.com',
            'password' => Hash::make('lab123'),
            'role' => 'lab_technician',
            'is_active' => true,
        ]);

        // Billing Staff
        User::create([
            'id' => Str::uuid(),
            'name' => 'Robert Taylor',
            'email' => 'billing@hospital.com',
            'password' => Hash::make('billing123'),
            'role' => 'billing',
            'is_active' => true,
        ]);
    }
}
