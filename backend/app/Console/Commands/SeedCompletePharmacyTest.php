<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\CompletePharmacyTestSeeder;

class SeedCompletePharmacyTest extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seed:pharmacy-complete';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed complete test data for pharmacy queue separation testing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            $seeder = new CompletePharmacyTestSeeder();
            $seeder->run();
            return 0;
        } catch (\Exception $e) {
            $this->error('Failed to seed data: ' . $e->getMessage());
            return 1;
        }
    }
}