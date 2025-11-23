<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('patient_visits', function (Blueprint $table) {
            // Workflow tracking
            $table->string('current_stage', 50)->nullable()->after('status'); // reception, nurse, doctor, lab, pharmacy, billing
            $table->string('overall_status', 50)->default('Active')->after('current_stage'); // Active, Completed, Cancelled
            
            // Reception stage
            $table->string('reception_status', 50)->nullable()->after('overall_status');
            $table->timestamp('reception_completed_at')->nullable()->after('reception_status');
            
            // Nurse stage
            $table->string('nurse_status', 50)->nullable()->after('reception_completed_at');
            $table->timestamp('nurse_completed_at')->nullable()->after('nurse_status');
            $table->text('nurse_notes')->nullable()->after('nurse_completed_at');
            
            // Doctor stage
            $table->string('doctor_status', 50)->nullable()->after('nurse_notes');
            $table->timestamp('doctor_completed_at')->nullable()->after('doctor_status');
            
            // Lab stage
            $table->string('lab_status', 50)->nullable()->after('doctor_completed_at');
            $table->timestamp('lab_completed_at')->nullable()->after('lab_status');
            $table->boolean('lab_results_reviewed')->default(false)->after('lab_completed_at');
            
            // Pharmacy stage
            $table->string('pharmacy_status', 50)->nullable()->after('lab_results_reviewed');
            $table->timestamp('pharmacy_completed_at')->nullable()->after('pharmacy_status');
            
            // Billing stage
            $table->string('billing_status', 50)->nullable()->after('pharmacy_completed_at');
            $table->timestamp('billing_completed_at')->nullable()->after('billing_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patient_visits', function (Blueprint $table) {
            $table->dropColumn([
                'current_stage', 'overall_status',
                'reception_status', 'reception_completed_at',
                'nurse_status', 'nurse_completed_at', 'nurse_notes',
                'doctor_status', 'doctor_completed_at',
                'lab_status', 'lab_completed_at', 'lab_results_reviewed',
                'pharmacy_status', 'pharmacy_completed_at',
                'billing_status', 'billing_completed_at'
            ]);
        });
    }
};
