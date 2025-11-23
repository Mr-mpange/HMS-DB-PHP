<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patient_services', function (Blueprint $table) {
            $table->string('service_name', 255)->nullable()->after('service_id');
            
            // Make service_id nullable since medications won't have a service_id
            $table->uuid('service_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('patient_services', function (Blueprint $table) {
            $table->dropColumn('service_name');
            
            // Revert service_id to required
            $table->uuid('service_id')->nullable(false)->change();
        });
    }
};
