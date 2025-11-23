<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

echo "=== CREATING MOBILE PAYMENTS TABLE ===\n\n";

try {
    if (Schema::hasTable('mobile_payments')) {
        echo "✅ Table mobile_payments already exists\n";
    } else {
        Schema::create('mobile_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('patient_id')->nullable();
            $table->uuid('invoice_id')->nullable();
            $table->string('phone_number');
            $table->decimal('amount', 10, 2);
            $table->string('provider'); // M-Pesa, Airtel Money, Tigo Pesa, Halopesa
            $table->string('transaction_id')->nullable();
            $table->string('reference_number')->unique();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->text('provider_response')->nullable();
            $table->timestamp('initiated_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('set null');
            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('set null');
        });
        
        echo "✅ Created mobile_payments table\n";
    }
    
    echo "\n✅ Database updated successfully!\n";
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
