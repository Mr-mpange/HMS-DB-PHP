<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prescription_items', function (Blueprint $table) {
            if (!Schema::hasColumn('prescription_items', 'medication_id')) {
                $table->uuid('medication_id')->nullable()->after('prescription_id');
                $table->index('medication_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('prescription_items', function (Blueprint $table) {
            $table->dropColumn('medication_id');
        });
    }
};
