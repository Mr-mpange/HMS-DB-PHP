<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->string('description')->nullable();
            $table->timestamps();
        });
        
        // Insert default settings
        DB::table('settings')->insert([
            [
                'key' => 'hospital_name',
                'value' => 'Hospital Management System',
                'description' => 'Hospital name displayed in the system',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'hospital_logo',
                'value' => null,
                'description' => 'Hospital logo URL or base64 encoded image',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
