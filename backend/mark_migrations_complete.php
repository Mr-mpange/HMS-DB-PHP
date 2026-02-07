<?php

// Mark pending migrations as completed
// Run this with: php mark_migrations_complete.php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "🔧 Marking pending migrations as completed...\n\n";

try {
    // Get current max batch number
    $batch = DB::table('migrations')->max('batch') + 1;
    
    // List of migrations to mark as completed
    $migrations = [
        '2024_01_15_000001_add_form_fields_to_services',
        '2024_01_15_000002_create_service_forms_table',
        '2025_02_04_000001_add_provisional_diagnosis_fields_to_patient_visits',
        '2025_11_25_000002_change_settings_value_to_longtext',
        '2025_11_25_000003_add_medication_id_to_prescription_items',
        '2025_11_25_155259_add_doctor_consultation_fields_to_patient_visits_table',
        '2025_12_05_093234_add_visit_type_to_visits_table'
    ];
    
    $added = 0;
    $skipped = 0;
    
    foreach ($migrations as $migration) {
        // Check if already exists
        $exists = DB::table('migrations')
            ->where('migration', $migration)
            ->exists();
        
        if (!$exists) {
            DB::table('migrations')->insert([
                'migration' => $migration,
                'batch' => $batch
            ]);
            echo "✅ Added: {$migration}\n";
            $added++;
        } else {
            echo "⏭️  Already exists: {$migration}\n";
            $skipped++;
        }
    }
    
    echo "\n";
    echo "================================\n";
    echo "✅ Done!\n";
    echo "   Added: {$added}\n";
    echo "   Skipped: {$skipped}\n";
    echo "================================\n";
    echo "\n";
    echo "Next steps:\n";
    echo "1. Run: php artisan migrate:status\n";
    echo "2. All migrations should show 'Ran'\n";
    echo "3. Delete this file: rm mark_migrations_complete.php\n";
    echo "\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
