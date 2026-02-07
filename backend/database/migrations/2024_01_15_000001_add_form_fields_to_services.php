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
        // Add form fields to medical_services table
        Schema::table('medical_services', function (Blueprint $table) {
            // Check if columns don't exist before adding
            if (!Schema::hasColumn('medical_services', 'requires_form')) {
                $table->boolean('requires_form')->default(false)->after('is_active');
            }
            
            if (!Schema::hasColumn('medical_services', 'form_template')) {
                $table->json('form_template')->nullable()->after('requires_form');
            }
            
            // Add index for performance (only if column exists and index doesn't)
            if (Schema::hasColumn('medical_services', 'requires_form')) {
                // Check if index doesn't exist before adding
                $sm = Schema::getConnection()->getDoctrineSchemaManager();
                $indexesFound = $sm->listTableIndexes('medical_services');
                
                $hasIndex = false;
                foreach ($indexesFound as $index) {
                    if (in_array('requires_form', $index->getColumns())) {
                        $hasIndex = true;
                        break;
                    }
                }
                
                if (!$hasIndex) {
                    $table->index('requires_form');
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medical_services', function (Blueprint $table) {
            $table->dropIndex(['requires_form']);
            $table->dropColumn(['requires_form', 'form_template']);
        });
    }
};