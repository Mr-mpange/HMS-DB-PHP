<?php
// Database Verification Script
// Run with: cd backend && php ../verify_database.php

require __DIR__.'/backend/vendor/autoload.php';

try {
    $app = require_once __DIR__.'/backend/bootstrap/app.php';
    $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
    
    echo "🗄️  Database Verification\n";
    echo "========================\n\n";
    
    // Test 1: Check if tables exist
    $tables = ['medical_services', 'service_forms', 'visits', 'patients', 'users'];
    foreach ($tables as $table) {
        if (Schema::hasTable($table)) {
            echo "✅ Table '$table' exists\n";
        } else {
            echo "❌ Table '$table' missing\n";
        }
    }
    
    echo "\n";
    
    // Test 2: Check if new columns exist
    $columns = [
        'medical_services' => ['requires_form', 'form_template'],
    ];
    
    foreach ($columns as $table => $cols) {
        foreach ($cols as $col) {
            if (Schema::hasColumn($table, $col)) {
                echo "✅ Column '$table.$col' exists\n";
            } else {
                echo "❌ Column '$table.$col' missing\n";
            }
        }
    }
    
    echo "\n";
    
    // Test 3: Check data
    try {
        $servicesCount = DB::table('medical_services')->count();
        echo "📊 Medical services count: $servicesCount\n";
        
        $formsCount = DB::table('service_forms')->count();
        echo "📊 Service forms count: $formsCount\n";
        
        $servicesWithForms = DB::table('medical_services')
            ->where('requires_form', true)
            ->count();
        echo "📊 Services with forms: $servicesWithForms\n";
        
        // Show services with forms
        if ($servicesWithForms > 0) {
            echo "\n📋 Services that require forms:\n";
            $services = DB::table('medical_services')
                ->where('requires_form', true)
                ->select('id', 'service_name', 'service_type')
                ->get();
                
            foreach ($services as $service) {
                echo "   - {$service->service_name} ({$service->service_type})\n";
            }
        }
        
    } catch (Exception $e) {
        echo "⚠️  Could not fetch data: " . $e->getMessage() . "\n";
    }
    
    echo "\n";
    
    // Test 4: Test API endpoint structure
    try {
        $sampleService = DB::table('medical_services')->first();
        if ($sampleService) {
            echo "📝 Sample service structure:\n";
            echo "   ID: {$sampleService->id}\n";
            echo "   Name: {$sampleService->service_name}\n";
            echo "   Type: {$sampleService->service_type}\n";
            echo "   Requires Form: " . ($sampleService->requires_form ? 'Yes' : 'No') . "\n";
            
            if ($sampleService->form_template) {
                $template = json_decode($sampleService->form_template, true);
                echo "   Form Template: " . ($template['title'] ?? 'Untitled') . "\n";
                echo "   Form Fields: " . count($template['fields'] ?? []) . "\n";
            }
        }
    } catch (Exception $e) {
        echo "⚠️  Could not fetch sample service: " . $e->getMessage() . "\n";
    }
    
    echo "\n✅ Database verification complete!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Make sure you're running this from the project root and Laravel is properly configured.\n";
}
?>