<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Creating visits table...\n\n";

try {
    // Check if table exists
    if (Schema::hasTable('visits')) {
        echo "✅ Visits table already exists\n";
        exit(0);
    }
    
    // Create visits table
    Schema::create('visits', function (Blueprint $table) {
        $table->uuid('id')->primary();
        $table->uuid('patient_id');
        $table->uuid('appointment_id')->nullable();
        $table->uuid('doctor_id')->nullable();
        $table->date('visit_date');
        $table->string('visit_type')->nullable(); // 'Appointment', 'Walk-in', 'Quick Service', etc.
        
        // Workflow stages
        $table->string('current_stage')->default('reception'); // reception, nurse, doctor, lab, pharmacy, billing, completed
        $table->string('overall_status')->default('Active'); // Active, Completed, Cancelled
        
        // Reception stage
        $table->string('reception_status')->default('Pending'); // Pending, Checked In, Completed
        $table->timestamp('reception_completed_at')->nullable();
        
        // Nurse stage
        $table->string('nurse_status')->default('Pending'); // Pending, In Progress, Completed
        $table->timestamp('nurse_completed_at')->nullable();
        
        // Doctor stage
        $table->string('doctor_status')->default('Pending'); // Pending, In Progress, Completed
        $table->timestamp('doctor_completed_at')->nullable();
        
        // Lab stage
        $table->string('lab_status')->default('Not Required'); // Not Required, Pending, In Progress, Completed
        $table->timestamp('lab_completed_at')->nullable();
        
        // Pharmacy stage
        $table->string('pharmacy_status')->default('Not Required'); // Not Required, Pending, In Progress, Completed
        $table->timestamp('pharmacy_completed_at')->nullable();
        
        // Billing stage
        $table->string('billing_status')->default('Pending'); // Pending, Paid, Completed
        $table->timestamp('billing_completed_at')->nullable();
        
        $table->text('notes')->nullable();
        $table->timestamps();
        
        // Foreign keys
        $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
    });
    
    echo "✅ Visits table created successfully!\n\n";
    
    echo "Table structure:\n";
    echo "- id (UUID)\n";
    echo "- patient_id (UUID, foreign key)\n";
    echo "- appointment_id (UUID, nullable)\n";
    echo "- doctor_id (UUID, nullable)\n";
    echo "- visit_date (date)\n";
    echo "- visit_type (string, nullable)\n";
    echo "- current_stage (string, default: reception)\n";
    echo "- overall_status (string, default: Active)\n";
    echo "- reception_status, nurse_status, doctor_status, lab_status, pharmacy_status, billing_status\n";
    echo "- Timestamps for each stage completion\n";
    echo "- notes (text, nullable)\n";
    echo "- created_at, updated_at\n";
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
