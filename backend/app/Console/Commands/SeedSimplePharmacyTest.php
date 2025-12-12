<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\SimplePharmacyTestSeeder;

class SeedSimplePharmacyTest extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seed:pharmacy-simple';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed simple test data for pharmacy queue testing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            $seeder = new SimplePharmacyTestSeeder();
            $seeder->run();
            return 0;
        } catch (\Exception $e) {
            $this->error('Failed to seed data: ' . $e->getMessage());
            return 1;
        }
    }
}