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
            $table->timestamp('doctor_started_at')->nullable()->after('doctor_status');
            $table->text('doctor_diagnosis')->nullable()->after('doctor_started_at');
            $table->text('doctor_notes')->nullable()->after('doctor_diagnosis');
            $table->timestamp('doctor_consultation_saved_at')->nullable()->after('doctor_notes');
            $table->timestamp('lab_results_reviewed_at')->nullable()->after('lab_results_reviewed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patient_visits', function (Blueprint $table) {
            $table->dropColumn([
                'doctor_started_at',
                'doctor_diagnosis',
                'doctor_notes',
                'doctor_consultation_saved_at',
                'lab_results_reviewed_at'
            ]);
        });
    }
};
