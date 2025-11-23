<?php
$db = new PDO('mysql:host=localhost;dbname=hospital_db', 'root', '');

$stmt = $db->query('SELECT COUNT(*) as count FROM appointments');
echo 'Total appointments: ' . $stmt->fetch()['count'] . "\n\n";

$stmt2 = $db->query('SELECT a.id, p.full_name, a.appointment_date, a.status 
                     FROM appointments a 
                     LEFT JOIN patients p ON a.patient_id = p.id 
                     ORDER BY a.appointment_date DESC 
                     LIMIT 10');

echo "Recent appointments:\n";
while($row = $stmt2->fetch(PDO::FETCH_ASSOC)) {
    echo $row['full_name'] . ' - ' . $row['appointment_date'] . ' - ' . $row['status'] . "\n";
}
