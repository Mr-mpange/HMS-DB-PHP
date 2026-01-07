<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed insurance companies
        $this->call([
            InsuranceCompaniesSeeder::class,
            ServicesSeeder::class, // Add services seeder to get all service types
            ServiceFormsSeeder::class, // Add service forms for proper documentation
            LocalUsersSeeder::class,
            AppointmentTestSeeder::class,
            LabTestDataSeeder::class, // Add lab test data with results
        ]);

        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
