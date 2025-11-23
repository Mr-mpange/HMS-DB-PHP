<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Creating visits for existing appointments...\n\n";

try {
    // Get all scheduled appointments without visits
    $appointments = DB::table('appointments')
        ->where('status', 'Scheduled')
        ->get();
    
    echo "Found {$appointments->count()} scheduled appointments\n\n";
    
    $created = 0;
    
    foreach ($appointments as $apt) {
        // Check if visit already exists
        $existingVisit = DB::table('visits')
            ->where('appointment_id', $apt->id)
            ->first();
        
        if ($existingVisit) {
            echo "⏭️  Skipping appointment {$apt->id} - visit already exists\n";
            continue;
        }
        
        // Create visit for this appointment
        $visitData = [
            'id' => Str::uuid(),
            'patient_id' => $apt->patient_id,
            'appointment_id' => $apt->id,
            'doctor_id' => $apt->doctor_id,
            'visit_date' => date('Y-m-d', strtotime($apt->appointment_date)),
            'visit_type' => 'Appointment',
            'current_stage' => 'reception',
            'overall_status' => 'Active',
            'reception_status' => 'Pending',
            'nurse_status' => 'Pending',
            'doctor_status' => 'Pending',
            'lab_status' => 'Not Required',
            'pharmacy_status' => 'Not Required',
            'billing_status' => 'Pending',
            'created_at' => now(),
            'updated_at' => now()
        ];
        
        DB::table('visits')->insert($visitData);
        
        $patient = DB::table('patients')->where('id', $apt->patient_id)->first();
        echo "✅ Created visit for: " . ($patient ? $patient->full_name : 'Unknown') . " (Appointment: " . date('Y-m-d H:i', strtotime($apt->appointment_date)) . ")\n";
        
        $created++;
    }
    
    echo "\n✅ Created {$created} visits\n\n";
    
    // Show queue counts
    $nurseQueue = DB::table('visits')
        ->where('overall_status', 'Active')
        ->where('current_stage', 'nurse')
        ->where('nurse_status', 'Pending')
        ->count();
    
    $receptionQueue = DB::table('visits')
        ->where('overall_status', 'Active')
        ->where('current_stage', 'reception')
        ->where('reception_status', 'Pending')
        ->count();
    
    echo "Current Queue Status:\n";
    echo "  Nurse Queue: {$nurseQueue} patients\n";
    echo "  Reception Queue: {$receptionQueue} patients\n";
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
