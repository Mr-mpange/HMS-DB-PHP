<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupPharmacyData extends Command
{
    protected $signature = 'cleanup:pharmacy-data';
    protected $description = 'Clean up orphaned pharmacy data (prescriptions and visits with non-existent patients)';

    public function handle()
    {
        $this->info('🧹 CLEANING UP PHARMACY DATA...');
        $this->newLine();

        try {
            // Get all existing patients
            $existingPatients = DB::table('patients')->pluck('id')->toArray();
            $this->info('📋 Found ' . count($existingPatients) . ' existing patients');
            
            // Find prescriptions with non-existent patients
            $orphanedPrescriptions = DB::table('prescriptions')
                ->whereNotIn('patient_id', $existingPatients)
                ->get();
            
            $this->info('🔍 Found ' . count($orphanedPrescriptions) . ' prescriptions with non-existent patients');
            
            if (count($orphanedPrescriptions) > 0) {
                foreach ($orphanedPrescriptions as $prescription) {
                    $this->line("  • Prescription {$prescription->id} references non-existent patient {$prescription->patient_id}");
                }
                
                // Delete prescription items first (foreign key constraint)
                $deletedItems = DB::table('prescription_items')
                    ->whereIn('prescription_id', collect($orphanedPrescriptions)->pluck('id'))
                    ->delete();
                
                $this->info("🗑️ Deleted {$deletedItems} orphaned prescription items");
                
                // Delete orphaned prescriptions
                $deletedPrescriptions = DB::table('prescriptions')
                    ->whereNotIn('patient_id', $existingPatients)
                    ->delete();
                
                $this->info("🗑️ Deleted {$deletedPrescriptions} orphaned prescriptions");
            }
            
            // Find patient visits with non-existent patients
            $orphanedVisits = DB::table('patient_visits')
                ->whereNotIn('patient_id', $existingPatients)
                ->get();
            
            $this->info('🔍 Found ' . count($orphanedVisits) . ' visits with non-existent patients');
            
            if (count($orphanedVisits) > 0) {
                foreach ($orphanedVisits as $visit) {
                    $this->line("  • Visit {$visit->id} references non-existent patient {$visit->patient_id}");
                }
                
                // Delete orphaned visits
                $deletedVisits = DB::table('patient_visits')
                    ->whereNotIn('patient_id', $existingPatients)
                    ->delete();
                
                $this->info("🗑️ Deleted {$deletedVisits} orphaned visits");
            }
            
            $this->newLine();
            $this->info('✅ CLEANUP COMPLETED!');
            $this->newLine();
            
            $this->info('📊 CURRENT DATA:');
            $patientCount = DB::table('patients')->count();
            $prescriptionCount = DB::table('prescriptions')->count();
            $visitCount = DB::table('patient_visits')->count();
            
            $this->line("  • Patients: {$patientCount}");
            $this->line("  • Prescriptions: {$prescriptionCount}");
            $this->line("  • Visits: {$visitCount}");
            
            $this->newLine();
            $this->info('🎯 All data is now consistent!');
            
            return 0;
            
        } catch (\Exception $e) {
            $this->error('❌ ERROR: ' . $e->getMessage());
            return 1;
        }
    }
}