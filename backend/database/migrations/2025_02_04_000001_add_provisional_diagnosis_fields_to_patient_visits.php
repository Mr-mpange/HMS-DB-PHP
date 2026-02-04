<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patient_visits', function (Blueprint $table) {
            // Rename existing diagnosis to provisional_diagnosis
            $table->renameColumn('diagnosis', 'provisional_diagnosis');
            
            // Add comprehensive medical history fields
            $table->text('chief_complaint_detailed')->nullable()->after('chief_complaint');
            $table->text('history_present_illness')->nullable()->after('chief_complaint_detailed');
            $table->text('review_of_systems')->nullable()->after('history_present_illness');
            $table->text('past_medical_history')->nullable()->after('review_of_systems');
            $table->text('family_social_history')->nullable()->after('past_medical_history');
            $table->text('obstetric_history')->nullable()->after('family_social_history');
            $table->text('developmental_milestones')->nullable()->after('obstetric_history');
            $table->text('investigation_plan')->nullable()->after('provisional_diagnosis');
            $table->text('final_diagnosis')->nullable()->after('investigation_plan');
            $table->text('treatment_rx')->nullable()->after('final_diagnosis');
            $table->text('other_management')->nullable()->after('treatment_rx');
            
            // Add flag to track if provisional diagnosis form is completed
            $table->boolean('provisional_diagnosis_completed')->default(false)->after('other_management');
        });
    }

    public function down(): void
    {
        Schema::table('patient_visits', function (Blueprint $table) {
            // Rename back to diagnosis
            $table->renameColumn('provisional_diagnosis', 'diagnosis');
            
            // Drop the new fields
            $table->dropColumn([
                'chief_complaint_detailed',
                'history_present_illness',
                'review_of_systems',
                'past_medical_history',
                'family_social_history',
                'obstetric_history',
                'developmental_milestones',
                'investigation_plan',
                'final_diagnosis',
                'treatment_rx',
                'other_management',
                'provisional_diagnosis_completed'
            ]);
        });
    }
};