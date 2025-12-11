<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Patient;
use App\Models\Invoice;
use App\Models\PatientVisit;
use App\Models\LabTest;

class BillingPolicyTestSeeder extends Seeder
{
    public function run()
    {
        echo "🧪 Creating Billing Policy Test Data...\n";
        
        // Test Case 1: Lab Service Partially Paid (SHOULD ALLOW PRINTING)
        echo "\n--- Test Case 1: Lab Service Partially Paid ---\n";
        $patient1 = Patient::create([
            'full_name' => 'Lab Partial Payment Patient',
            'phone' => '0701111001',
            'date_of_birth' => '1985-05-15',
            'gender' => 'Female',
            'address' => '123 Test Street, Lab City',
            'emergency_contact' => '0701111002',
            'medical_history' => 'No significant medical history'
        ]);
        
        // Consultation invoice (ignored)
        $consultationInv1 = Invoice::create([
            'patient_id' => $patient1->id,
            'invoice_number' => 'CONS-' . date('Ymd') . '-' . rand(10000, 99999),
            'invoice_date' => now(),
            'total_amount' => 30.00,
            'paid_amount' => 0.00,
            'balance' => 30.00,
            'status' => 'Pending',
            'notes' => 'Doctor consultation fee - routine checkup'
        ]);
        
        // Lab service invoice (partially paid - should allow printing)
        $labInv1 = Invoice::create([
            'patient_id' => $patient1->id,
            'invoice_number' => 'LAB-' . date('Ymd') . '-' . rand(10000, 99999),
            'invoice_date' => now(),
            'total_amount' => 200.00,
            'paid_amount' => 80.00,  // Partial payment
            'balance' => 120.00,
            'status' => 'Partial',
            'notes' => 'Laboratory tests - CBC, Blood Sugar, Lipid Panel'
        ]);
        
        // Create visit and lab tests
        $visit1 = PatientVisit::create([
            'patient_id' => $patient1->id,
            'visit_date' => now(),
            'visit_type' => 'Consultation',
            'current_stage' => 'completed',
            'overall_status' => 'Completed',
            'reception_status' => 'Completed',
            'nurse_status' => 'Completed',
            'doctor_status' => 'Completed',
            'lab_status' => 'Completed',
            'pharmacy_status' => 'Not Required',
            'billing_status' => 'Partial',
            'notes' => 'Lab tests completed - partial payment made'
        ]);
        
        // Get a doctor for the lab tests
        $doctor = \App\Models\User::where('role', 'doctor')->first();
        if (!$doctor) {
            $doctor = \App\Models\User::create([
                'name' => 'Dr. Test Doctor',
                'email' => 'testdoctor@hospital.com',
                'password' => bcrypt('password'),
                'role' => 'doctor'
            ]);
        }
        
        LabTest::create([
            'patient_id' => $patient1->id,
            'visit_id' => $visit1->id,
            'doctor_id' => $doctor->id,
            'test_name' => 'Complete Blood Count (CBC)',
            'test_type' => 'Laboratory',
            'test_date' => now(),
            'status' => 'Completed',
            'results' => json_encode([
                'test_date' => now()->toISOString(),
                'performed_by' => 'Lab Technician',
                'results' => [
                    'Complete Blood Count (CBC)' => [
                        'value' => 'Normal',
                        'unit' => '',
                        'normal_range' => 'Within normal limits',
                        'status' => 'Normal'
                    ]
                ]
            ])
        ]);
        
        echo "✅ Created: {$patient1->full_name}\n";
        echo "   Consultation: \$30.00 (unpaid) - IGNORED\n";
        echo "   Lab Service: \$200.00 total, \$80.00 paid - SHOULD ALLOW PRINTING ✅\n";
        
        // Test Case 2: Consultation Only Visit (SHOULD ALLOW PRINTING)
        echo "\n--- Test Case 2: Consultation Only Visit ---\n";
        $patient2 = Patient::create([
            'full_name' => 'Consultation Only Patient',
            'phone' => '0701111003',
            'date_of_birth' => '1990-03-20',
            'gender' => 'Male',
            'address' => '456 Consult Avenue, Medical City',
            'emergency_contact' => '0701111004',
            'medical_history' => 'Hypertension, well controlled'
        ]);
        
        $consultationOnlyInv = Invoice::create([
            'patient_id' => $patient2->id,
            'invoice_number' => 'CONS-' . date('Ymd') . '-' . rand(10000, 99999),
            'invoice_date' => now(),
            'total_amount' => 40.00,
            'paid_amount' => 0.00,
            'balance' => 40.00,
            'status' => 'Pending',
            'notes' => 'Doctor consultation only - follow-up visit'
        ]);
        
        $visit2 = PatientVisit::create([
            'patient_id' => $patient2->id,
            'visit_date' => now(),
            'visit_type' => 'Consultation',
            'current_stage' => 'completed',
            'overall_status' => 'Completed',
            'reception_status' => 'Completed',
            'nurse_status' => 'Completed',
            'doctor_status' => 'Completed',
            'lab_status' => 'Not Required',
            'pharmacy_status' => 'Not Required',
            'billing_status' => 'Pending',
            'notes' => 'Consultation only - no additional services'
        ]);
        
        echo "✅ Created: {$patient2->full_name}\n";
        echo "   Consultation: \$40.00 (unpaid) - IGNORED\n";
        echo "   No other services - SHOULD ALLOW PRINTING ✅\n";
        
        // Test Case 3: Lab Service Completely Unpaid (SHOULD BLOCK PRINTING)
        echo "\n--- Test Case 3: Lab Service Completely Unpaid ---\n";
        $patient3 = Patient::create([
            'full_name' => 'Lab Unpaid Patient',
            'phone' => '0701111005',
            'date_of_birth' => '1988-07-10',
            'gender' => 'Female',
            'address' => '789 Unpaid Road, Test City',
            'emergency_contact' => '0701111006',
            'medical_history' => 'Diabetes mellitus type 2'
        ]);
        
        $unpaidLabInv = Invoice::create([
            'patient_id' => $patient3->id,
            'invoice_number' => 'LAB-' . date('Ymd') . '-' . rand(10000, 99999),
            'invoice_date' => now(),
            'total_amount' => 150.00,
            'paid_amount' => 0.00,  // No payment
            'balance' => 150.00,
            'status' => 'Pending',
            'notes' => 'Laboratory tests - HbA1c, Glucose, Kidney function'
        ]);
        
        $visit3 = PatientVisit::create([
            'patient_id' => $patient3->id,
            'visit_date' => now(),
            'visit_type' => 'Consultation',
            'current_stage' => 'billing',
            'overall_status' => 'Active',
            'reception_status' => 'Completed',
            'nurse_status' => 'Completed',
            'doctor_status' => 'Completed',
            'lab_status' => 'Completed',
            'pharmacy_status' => 'Not Required',
            'billing_status' => 'Pending',
            'notes' => 'Lab tests completed - awaiting payment'
        ]);
        
        LabTest::create([
            'patient_id' => $patient3->id,
            'visit_id' => $visit3->id,
            'doctor_id' => $doctor->id,
            'test_name' => 'HbA1c Test',
            'test_type' => 'Laboratory',
            'test_date' => now(),
            'status' => 'Completed',
            'results' => json_encode([
                'test_date' => now()->toISOString(),
                'performed_by' => 'Lab Technician',
                'results' => [
                    'HbA1c Test' => [
                        'value' => '7.2%',
                        'unit' => '%',
                        'normal_range' => '<7.0%',
                        'status' => 'Abnormal'
                    ]
                ]
            ])
        ]);
        
        echo "✅ Created: {$patient3->full_name}\n";
        echo "   Lab Service: \$150.00 (completely unpaid) - SHOULD BLOCK PRINTING ❌\n";
        
        // Test Case 4: Pharmacy Service Fully Paid (SHOULD ALLOW PRINTING)
        echo "\n--- Test Case 4: Pharmacy Service Fully Paid ---\n";
        $patient4 = Patient::create([
            'full_name' => 'Pharmacy Paid Patient',
            'phone' => '0701111007',
            'date_of_birth' => '1992-11-25',
            'gender' => 'Male',
            'address' => '321 Pharmacy Lane, Med City',
            'emergency_contact' => '0701111008',
            'medical_history' => 'Allergic to penicillin'
        ]);
        
        $pharmacyInv = Invoice::create([
            'patient_id' => $patient4->id,
            'invoice_number' => 'PHARM-' . date('Ymd') . '-' . rand(10000, 99999),
            'invoice_date' => now(),
            'total_amount' => 75.00,
            'paid_amount' => 75.00,  // Fully paid
            'balance' => 0.00,
            'status' => 'Paid',
            'notes' => 'Prescription medications - Antibiotics, Pain relief'
        ]);
        
        $visit4 = PatientVisit::create([
            'patient_id' => $patient4->id,
            'visit_date' => now(),
            'visit_type' => 'Consultation',
            'current_stage' => 'completed',
            'overall_status' => 'Completed',
            'reception_status' => 'Completed',
            'nurse_status' => 'Completed',
            'doctor_status' => 'Completed',
            'lab_status' => 'Not Required',
            'pharmacy_status' => 'Completed',
            'billing_status' => 'Completed',
            'notes' => 'Prescription filled and paid'
        ]);
        
        echo "✅ Created: {$patient4->full_name}\n";
        echo "   Pharmacy Service: \$75.00 (fully paid) - SHOULD ALLOW PRINTING ✅\n";
        
        // Test Case 5: Mixed Services - Consultation + Lab + Pharmacy (Partial Payments)
        echo "\n--- Test Case 5: Mixed Services with Partial Payments ---\n";
        $patient5 = Patient::create([
            'full_name' => 'Mixed Services Patient',
            'phone' => '0701111009',
            'date_of_birth' => '1987-09-12',
            'gender' => 'Female',
            'address' => '654 Mixed Street, Complex City',
            'emergency_contact' => '0701111010',
            'medical_history' => 'Chronic fatigue syndrome'
        ]);
        
        // Consultation (ignored)
        $mixedConsultInv = Invoice::create([
            'patient_id' => $patient5->id,
            'invoice_number' => 'CONS-' . date('Ymd') . '-' . rand(10000, 99999),
            'invoice_date' => now(),
            'total_amount' => 50.00,
            'paid_amount' => 0.00,
            'balance' => 50.00,
            'status' => 'Pending',
            'notes' => 'Specialist consultation - endocrinology'
        ]);
        
        // Lab service (partially paid)
        $mixedLabInv = Invoice::create([
            'patient_id' => $patient5->id,
            'invoice_number' => 'LAB-' . date('Ymd') . '-' . rand(10000, 99999),
            'invoice_date' => now(),
            'total_amount' => 300.00,
            'paid_amount' => 100.00,  // Partial payment
            'balance' => 200.00,
            'status' => 'Partial',
            'notes' => 'Comprehensive metabolic panel, Thyroid function'
        ]);
        
        // Pharmacy service (unpaid)
        $mixedPharmInv = Invoice::create([
            'patient_id' => $patient5->id,
            'invoice_number' => 'PHARM-' . date('Ymd') . '-' . rand(10000, 99999),
            'invoice_date' => now(),
            'total_amount' => 120.00,
            'paid_amount' => 0.00,
            'balance' => 120.00,
            'status' => 'Pending',
            'notes' => 'Thyroid medication, Vitamin supplements'
        ]);
        
        $visit5 = PatientVisit::create([
            'patient_id' => $patient5->id,
            'visit_date' => now(),
            'visit_type' => 'Consultation',
            'current_stage' => 'billing',
            'overall_status' => 'Active',
            'reception_status' => 'Completed',
            'nurse_status' => 'Completed',
            'doctor_status' => 'Completed',
            'lab_status' => 'Completed',
            'pharmacy_status' => 'Pending',
            'billing_status' => 'Partial',
            'notes' => 'Lab completed, pharmacy pending, partial payments made'
        ]);
        
        echo "✅ Created: {$patient5->full_name}\n";
        echo "   Consultation: \$50.00 (unpaid) - IGNORED\n";
        echo "   Lab Service: \$300.00 total, \$100.00 paid - PARTIAL PAYMENT\n";
        echo "   Pharmacy: \$120.00 (unpaid)\n";
        echo "   Result: SHOULD ALLOW PRINTING (lab service has payment) ✅\n";
        
        echo "\n🎯 Test Summary:\n";
        echo "✅ Lab Partial Payment: SHOULD ALLOW printing\n";
        echo "✅ Consultation Only: SHOULD ALLOW printing\n";
        echo "❌ Lab Unpaid: SHOULD BLOCK printing\n";
        echo "✅ Pharmacy Paid: SHOULD ALLOW printing\n";
        echo "✅ Mixed Partial: SHOULD ALLOW printing\n";
        
        echo "\n📋 Testing Instructions:\n";
        echo "1. Try to print lab reports for each patient\n";
        echo "2. Check billing policy enforcement\n";
        echo "3. Verify consultation fees are ignored\n";
        echo "4. Confirm partial service payments allow printing\n";
        
        echo "\n✅ Billing Policy Test Data Created Successfully!\n";
    }
}