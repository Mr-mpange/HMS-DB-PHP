<?php
$dbPath = __DIR__ . '/database/database.sqlite';

try {
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== CREATING LAB TEST CATALOG ===\n\n";
    
    // First, check if lab tests already exist
    $stmt = $pdo->query("SELECT COUNT(*) FROM medical_services WHERE service_type = 'Laboratory'");
    $existing = $stmt->fetchColumn();
    
    if ($existing > 0) {
        echo "Found $existing existing laboratory services. Skipping creation.\n";
        exit(0);
    }
    
    // Define lab test catalog
    $labTests = [
        ['code' => 'LAB-CBC', 'name' => 'Complete Blood Count', 'type' => 'Hematology', 'price' => 50],
        ['code' => 'LAB-BMP', 'name' => 'Basic Metabolic Panel', 'type' => 'Chemistry', 'price' => 75],
        ['code' => 'LAB-LFT', 'name' => 'Liver Function Test', 'type' => 'Chemistry', 'price' => 80],
        ['code' => 'LAB-RFT', 'name' => 'Renal Function Test', 'type' => 'Chemistry', 'price' => 70],
        ['code' => 'LAB-LIPID', 'name' => 'Lipid Profile', 'type' => 'Chemistry', 'price' => 60],
        ['code' => 'LAB-HBA1C', 'name' => 'HbA1c (Diabetes)', 'type' => 'Chemistry', 'price' => 55],
        ['code' => 'LAB-TSH', 'name' => 'Thyroid Function Test', 'type' => 'Endocrinology', 'price' => 65],
        ['code' => 'LAB-UA', 'name' => 'Urinalysis', 'type' => 'Microbiology', 'price' => 30],
        ['code' => 'LAB-STOOL', 'name' => 'Stool Analysis', 'type' => 'Microbiology', 'price' => 35],
        ['code' => 'LAB-MALARIA', 'name' => 'Malaria Test', 'type' => 'Parasitology', 'price' => 25],
        ['code' => 'LAB-HIV', 'name' => 'HIV Test', 'type' => 'Serology', 'price' => 40],
        ['code' => 'LAB-PREG', 'name' => 'Pregnancy Test', 'type' => 'Serology', 'price' => 20],
    ];
    
    $insertStmt = $pdo->prepare("
        INSERT INTO medical_services (id, service_code, service_name, service_type, description, base_price, currency, is_active, created_at, updated_at)
        VALUES (?, ?, ?, 'Laboratory', ?, ?, 'TZS', 1, datetime('now'), datetime('now'))
    ");
    
    $count = 0;
    foreach ($labTests as $test) {
        $id = sprintf(
            '%08x-%04x-%04x-%04x-%012x',
            mt_rand(0, 0xffffffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffffffffffff)
        );
        
        $description = "{$test['name']} - {$test['type']} test";
        
        $insertStmt->execute([
            $id,
            $test['code'],
            $test['name'],
            $description,
            $test['price']
        ]);
        
        $count++;
        echo "✅ Created: {$test['name']} ({$test['type']}) - TZS {$test['price']}\n";
    }
    
    echo "\n✅ Successfully created $count lab test services!\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
