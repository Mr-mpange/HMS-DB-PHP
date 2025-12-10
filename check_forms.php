<?php
// Simple script to check and populate service forms

require_once 'backend/vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Database connection
$host = $_ENV['DB_HOST'] ?? 'localhost';
$dbname = $_ENV['DB_DATABASE'] ?? 'u232077031_haset_hospital';
$username = $_ENV['DB_USERNAME'] ?? 'u232077031_haset_dbs';
$password = $_ENV['DB_PASSWORD'] ?? '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to database successfully!\n\n";
    
    // Check current services with forms
    echo "=== CURRENT SERVICES WITH FORMS ===\n";
    $stmt = $pdo->query("SELECT service_name, service_type, requires_form, 
                         CASE WHEN form_template IS NOT NULL THEN 'HAS_TEMPLATE' ELSE 'NO_TEMPLATE' END as template_status
                         FROM medical_services 
                         WHERE requires_form = 1");
    
    $servicesWithForms = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($servicesWithForms)) {
        echo "No services currently require forms.\n\n";
    } else {
        foreach ($servicesWithForms as $service) {
            echo "- {$service['service_name']} ({$service['service_type']}) - {$service['template_status']}\n";
        }
        echo "\n";
    }
    
    // Check all services to find potential candidates
    echo "=== ALL SERVICES (first 10) ===\n";
    $stmt = $pdo->query("SELECT service_name, service_type FROM medical_services LIMIT 10");
    $allServices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($allServices as $service) {
        echo "- {$service['service_name']} ({$service['service_type']})\n";
    }
    
    echo "\n=== LOOKING FOR SPECIFIC SERVICES ===\n";
    
    // Look for vaccination services
    $stmt = $pdo->prepare("SELECT service_name, service_type FROM medical_services 
                          WHERE service_name LIKE '%COVID%' OR service_name LIKE '%Vaccination%' OR service_name LIKE '%Vaccine%'");
    $stmt->execute();
    $vaccineServices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Vaccination services found:\n";
    if (empty($vaccineServices)) {
        echo "- None found\n";
    } else {
        foreach ($vaccineServices as $service) {
            echo "- {$service['service_name']} ({$service['service_type']})\n";
        }
    }
    
    // Look for wound/dressing services
    $stmt = $pdo->prepare("SELECT service_name, service_type FROM medical_services 
                          WHERE service_name LIKE '%Wound%' OR service_name LIKE '%Dressing%'");
    $stmt->execute();
    $woundServices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nWound/Dressing services found:\n";
    if (empty($woundServices)) {
        echo "- None found\n";
    } else {
        foreach ($woundServices as $service) {
            echo "- {$service['service_name']} ({$service['service_type']})\n";
        }
    }
    
    // Look for IV services
    $stmt = $pdo->prepare("SELECT service_name, service_type FROM medical_services 
                          WHERE service_name LIKE '%IV%' OR service_name LIKE '%Drip%'");
    $stmt->execute();
    $ivServices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nIV/Drip services found:\n";
    if (empty($ivServices)) {
        echo "- None found\n";
    } else {
        foreach ($ivServices as $service) {
            echo "- {$service['service_name']} ({$service['service_type']})\n";
        }
    }
    
} catch (PDOException $e) {
    echo "Database connection failed: " . $e->getMessage() . "\n";
}