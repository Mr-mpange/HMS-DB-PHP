<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\FinalPharmacyTestSeeder;

class SeedFinalPharmacyTest extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seed:pharmacy-final';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed final test data for pharmacy queue separation (auto-detects columns)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            $seeder = new FinalPharmacyTestSeeder();
            $seeder->run();
            return 0;
        } catch (\Exception $e) {
            $this->error('Failed to seed data: ' . $e->getMessage());
            return 1;
        }
    }
}