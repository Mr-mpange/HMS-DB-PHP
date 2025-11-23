<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== AVAILABLE PATIENTS ===\n\n";

$patients = \App\Models\Patient::limit(10)->get();

echo "Total patients: " . $patients->count() . "\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

foreach ($patients as $patient) {
    echo "Name: {$patient->full_name}\n";
    echo "ID: {$patient->id}\n";
    echo "---\n";
}
