<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\MinimalPharmacyTestSeeder;

class SeedMinimalPharmacyTest extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seed:pharmacy-minimal';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed minimal test data for pharmacy testing (patients + medications only)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            $seeder = new MinimalPharmacyTestSeeder();
            $seeder->run();
            return 0;
        } catch (\Exception $e) {
            $this->error('Failed to seed data: ' . $e->getMessage());
            return 1;
        }
    }
}