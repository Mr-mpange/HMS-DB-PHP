<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "Checking for existing users...\n";

$users = User::all();

if ($users->count() > 0) {
    echo "\nExisting users:\n";
    echo "================\n";
    foreach ($users as $user) {
        echo "Email: " . $user->email . "\n";
        echo "Role: " . $user->role . "\n";
        echo "Active: " . ($user->is_active ? 'Yes' : 'No') . "\n";
        echo "----------------\n";
    }
} else {
    echo "No users found. Creating admin user...\n";
    
    $admin = User::create([
        'name' => 'Admin',
        'email' => 'admin@test.com',
        'password' => bcrypt('Admin@123'),
        'role' => 'admin',
        'is_active' => true
    ]);
    
    echo "\n✓ Admin user created!\n";
    echo "Email: " . $admin->email . "\n";
    echo "Password: Admin@123\n";
}

echo "\n========================================\n";
echo "LOCAL LOGIN CREDENTIALS\n";
echo "========================================\n";
echo "URL: http://localhost:8080\n";
echo "Email: admin@test.com\n";
echo "Password: Admin@123\n";
echo "========================================\n";
