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
            $table->boolean('requires_form')->default(false)->after('is_active');
            $table->json('form_template')->nullable()->after('requires_form');
            
            // Add index for performance
            $table->index('requires_form');
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