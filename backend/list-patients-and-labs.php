<?php
$db = new PDO('mysql:host=localhost;dbname=hospital_db', 'root', '');

echo "=== Recent Patients ===\n";
$stmt = $db->query('SELECT id, full_name FROM patients ORDER BY created_at DESC LIMIT 10');
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo $row['full_name'] . ' (ID: ' . substr($row['id'], 0, 8) . '...)' . "\n";
}

echo "\n=== Lab Tests Count ===\n";
$stmt2 = $db->query('SELECT COUNT(*) as count FROM lab_tests');
echo 'Total lab tests: ' . $stmt2->fetch()['count'] . "\n";

echo "\n=== Recent Lab Tests ===\n";
$stmt3 = $db->query("SELECT lt.*, p.full_name as patient_name 
                     FROM lab_tests lt 
                     LEFT JOIN patients p ON lt.patient_id = p.id 
                     ORDER BY lt.created_at DESC 
                     LIMIT 10");
while ($row = $stmt3->fetch(PDO::FETCH_ASSOC)) {
    echo "{$row['patient_name']}: {$row['test_name']} ({$row['status']})\n";
    
    // Count results for this test
    $stmt4 = $db->prepare("SELECT COUNT(*) as count FROM lab_results WHERE lab_test_id = ?");
    $stmt4->execute([$row['id']]);
    $resultCount = $stmt4->fetch()['count'];
    echo "  -> {$resultCount} result(s)\n";
}
