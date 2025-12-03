<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class LocalUsersSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'id' => Str::uuid(),
                'name' => 'Dr. John Doe',
                'email' => 'doctor@test.com',
                'password' => Hash::make('doctor123'),
                'role' => 'doctor',
                'phone' => '0712345678',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'name' => 'Lab Technician',
                'email' => 'lab@test.com',
                'password' => Hash::make('lab123'),
                'role' => 'lab_technician',
                'phone' => '0723456789',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'name' => 'Admin User',
                'email' => 'admin@test.com',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'phone' => '0734567890',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($users as $user) {
            DB::table('users')->insert($user);
        }

        $this->command->info('✅ Local test users created successfully!');
        $this->command->info('');
        $this->command->info('Login Credentials:');
        $this->command->info('─────────────────────────────────────');
        $this->command->info('Doctor:  doctor@test.com / doctor123');
        $this->command->info('Lab:     lab@test.com / lab123');
        $this->command->info('Admin:   admin@test.com / admin123');
        $this->command->info('─────────────────────────────────────');
    }
}
