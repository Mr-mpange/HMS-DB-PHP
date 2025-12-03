-- Insert test patient
INSERT INTO patients (id, full_name, date_of_birth, gender, phone, address, status, created_at, updated_at)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'John Test Patient', '1985-05-15', 'Male', '0756789012', '123 Test St', 'Active', datetime('now'), datetime('now'));

-- Insert lab test (Pending)
INSERT INTO lab_tests (id, patient_id, doctor_id, test_name, test_type, test_date, status, notes, created_at, updated_at)
SELECT '550e8400-e29b-41d4-a716-446655440002', 
       '550e8400-e29b-41d4-a716-446655440001',
       id,
       'Complete Blood Count (CBC)',
       'Hematology',
       date('now'),
       'Pending',
       'Urgent - check for infection',
       datetime('now'),
       datetime('now')
FROM users WHERE email = 'doctor@test.com' LIMIT 1;

-- Insert lab test (In Progress)
INSERT INTO lab_tests (id, patient_id, doctor_id, test_name, test_type, test_date, status, notes, performed_by, created_at, updated_at)
SELECT '550e8400-e29b-41d4-a716-446655440003',
       '550e8400-e29b-41d4-a716-446655440001',
       d.id,
       'Malaria Test (RDT)',
       'Parasitology',
       date('now'),
       'In Progress',
       'Sample collected - processing',
       l.id,
       datetime('now'),
       datetime('now')
FROM users d, users l 
WHERE d.email = 'doctor@test.com' AND l.email = 'lab@test.com' 
LIMIT 1;

-- Insert completed lab test with results
INSERT INTO lab_tests (id, patient_id, doctor_id, test_name, test_type, test_date, status, results, notes, performed_by, created_at, updated_at)
SELECT '550e8400-e29b-41d4-a716-446655440004',
       '550e8400-e29b-41d4-a716-446655440001',
       d.id,
       'Blood Sugar (Fasting)',
       'Clinical Chemistry',
       date('now', '-1 day'),
       'Completed',
       '{"test_date":"2025-12-03 18:00:00","performed_by":"Lab Technician","results":{"Glucose":{"value":"95","unit":"mg/dL","normal_range":"70-100","status":"Normal"}},"interpretation":"Fasting blood glucose within normal limits."}',
       'Results verified and ready for review',
       l.id,
       datetime('now', '-3 hours'),
       datetime('now', '-2 hours')
FROM users d, users l 
WHERE d.email = 'doctor@test.com' AND l.email = 'lab@test.com' 
LIMIT 1;
