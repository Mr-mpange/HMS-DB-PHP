<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\PharmacyQueueTestSeeder;

class SeedPharmacyTestData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seed:pharmacy-test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed test data for pharmacy queue separation testing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🏥 Seeding Pharmacy Queue Test Data...');
        $this->newLine();

        try {
            $seeder = new PharmacyQueueTestSeeder();
            $seeder->run();
            
            $this->newLine();
            $this->info('✅ Pharmacy test data seeded successfully!');
            $this->newLine();
            
            $this->comment('🚀 Test the pharmacy queue system:');
            $this->line('   1. Open Pharmacy Dashboard');
            $this->line('   2. Go to Queue tab');
            $this->line('   3. See separated Green and Blue queues');
            $this->line('   4. Test medication management');
            $this->newLine();
            
        } catch (\Exception $e) {
            $this->error('❌ Failed to seed pharmacy test data:');
            $this->error($e->getMessage());
            return 1;
        }

        return 0;
    }
}