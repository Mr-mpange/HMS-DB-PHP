<?php

/**
 * Quick script to run the Pharmacy Queue Test Seeder
 * 
 * Usage: php run_pharmacy_test_seeder.php
 */

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;
use Database\Seeders\PharmacyQueueTestSeeder;

// Load environment variables
if (file_exists(__DIR__ . '/.env')) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
}

// Database configuration
$capsule = new Capsule;
$capsule->addConnection([
    'driver' => $_ENV['DB_CONNECTION'] ?? 'mysql',
    'host' => $_ENV['DB_HOST'] ?? '127.0.0.1',
    'port' => $_ENV['DB_PORT'] ?? '3306',
    'database' => $_ENV['DB_DATABASE'] ?? 'hospital_management',
    'username' => $_ENV['DB_USERNAME'] ?? 'root',
    'password' => $_ENV['DB_PASSWORD'] ?? '',
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
]);

$capsule->setAsGlobal();
$capsule->bootEloquent();

echo "🏥 RUNNING PHARMACY QUEUE TEST SEEDER...\n";
echo "=====================================\n\n";

try {
    $seeder = new PharmacyQueueTestSeeder();
    $seeder->run();
    
    echo "\n✅ SEEDER COMPLETED SUCCESSFULLY!\n";
    echo "\n🚀 You can now test the pharmacy queue system:\n";
    echo "   1. Open the Pharmacy Dashboard\n";
    echo "   2. Go to the 'Queue' tab\n";
    echo "   3. See patients separated into Green and Blue queues\n";
    echo "   4. Test adding/removing medications\n";
    echo "   5. Test stock validation and restoration\n\n";
    
} catch (Exception $e) {
    echo "\n❌ ERROR RUNNING SEEDER:\n";
    echo $e->getMessage() . "\n\n";
    echo "💡 Make sure your database connection is configured correctly in .env\n";
}