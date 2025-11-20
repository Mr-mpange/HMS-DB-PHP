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
    }
}
