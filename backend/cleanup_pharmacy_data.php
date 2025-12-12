<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;

// Load environment variables
if (file_exists(__DIR__ . '/.env')) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
}

// Database configuration
$capsule = new Capsule;
$capsule->addConnection([
    'driver' => $_ENV['DB_CONNECTION'] ?? 'mysql',
    'host' => $_ENV['DB_HOST'] ?? '127.0.0.1',
    'port' => $_ENV['DB_PORT'] ?? '3306',
    'database' => $_ENV['DB_DATABASE'] ?? 'hospital_management',
    'username' => $_ENV['DB_USERNAME'] ?? 'root',
    'password' => $_ENV['DB_PASSWORD'] ?? '',
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
]);

$capsule->setAsGlobal();
$capsule->bootEloquent();

echo "🧹 CLEANING UP PHARMACY DATA...\n\n";

try {
    // Get all existing patients
    $existingPatients = Capsule::table('patients')->pluck('id')->toArray();
    echo "📋 Found " . count($existingPatients) . " existing patients\n";
    
    // Find prescriptions with non-existent patients
    $orphanedPrescriptions = Capsule::table('prescriptions')
        ->whereNotIn('patient_id', $existingPatients)
        ->get();
    
    echo "🔍 Found " . count($orphanedPrescriptions) . " prescriptions with non-existent patients\n";
    
    if (count($orphanedPrescriptions) > 0) {
        foreach ($orphanedPrescriptions as $prescription) {
            echo "  • Prescription {$prescription->id} references non-existent patient {$prescription->patient_id}\n";
        }
        
        // Delete prescription items first (foreign key constraint)
        $deletedItems = Capsule::table('prescription_items')
            ->whereIn('prescription_id', collect($orphanedPrescriptions)->pluck('id'))
            ->delete();
        
        echo "🗑️ Deleted {$deletedItems} orphaned prescription items\n";
        
        // Delete orphaned prescriptions
        $deletedPrescriptions = Capsule::table('prescriptions')
            ->whereNotIn('patient_id', $existingPatients)
            ->delete();
        
        echo "🗑️ Deleted {$deletedPrescriptions} orphaned prescriptions\n";
    }
    
    // Find patient visits with non-existent patients
    $orphanedVisits = Capsule::table('patient_visits')
        ->whereNotIn('patient_id', $existingPatients)
        ->get();
    
    echo "🔍 Found " . count($orphanedVisits) . " visits with non-existent patients\n";
    
    if (count($orphanedVisits) > 0) {
        foreach ($orphanedVisits as $visit) {
            echo "  • Visit {$visit->id} references non-existent patient {$visit->patient_id}\n";
        }
        
        // Delete orphaned visits
        $deletedVisits = Capsule::table('patient_visits')
            ->whereNotIn('patient_id', $existingPatients)
            ->delete();
        
        echo "🗑️ Deleted {$deletedVisits} orphaned visits\n";
    }
    
    echo "\n✅ CLEANUP COMPLETED!\n";
    echo "\n📊 CURRENT DATA:\n";
    
    $patientCount = Capsule::table('patients')->count();
    $prescriptionCount = Capsule::table('prescriptions')->count();
    $visitCount = Capsule::table('patient_visits')->count();
    
    echo "  • Patients: {$patientCount}\n";
    echo "  • Prescriptions: {$prescriptionCount}\n";
    echo "  • Visits: {$visitCount}\n";
    
    echo "\n🎯 All data is now consistent!\n";
    
} catch (Exception $e) {
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
}