<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SimplePharmacyTestSeeder extends Seeder
{
    /**
     * Run the database seeds for testing pharmacy queue separation
     */
    public function run(): void
    {
        $now = Carbon::now();
        
        echo "🏥 Creating Simple Pharmacy Test Data...\n\n";
        
        try {
            // Create test patients with UUIDs
            $patients = [
                [
                    'id' => 'pat_test_001',
                    'full_name' => 'John Doe',
                    'phone' => '0712345678',
                    'email' => 'john.doe@test.com',
                    'date_of_birth' => '1985-05-15',
                    'gender' => 'Male',
                    'address' => '123 Main Street, Nairobi',
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'id' => 'pat_test_002',
                    'full_name' => 'Mary Smith',
                    'phone' => '0723456789',
                    'email' => 'mary.smith@test.com',
                    'date_of_birth' => '1990-08-22',
                    'gender' => 'Female',
                    'address' => '456 Oak Avenue, Nairobi',
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'id' => 'pat_test_003',
                    'full_name' => 'David Wilson',
                    'phone' => '0734567890',
                    'email' => 'david.wilson@test.com',
                    'date_of_birth' => '1978-12-10',
                    'gender' => 'Male',
                    'address' => '789 Pine Road, Nairobi',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            ];

            $patientIds = [];
            foreach ($patients as $patient) {
                // Use updateOrInsert to avoid duplicates
                DB::table('patients')->updateOrInsert(['id' => $patient['id']], $patient);
                $patientIds[] = $patient['id'];
                echo "✅ Created patient: {$patient['full_name']} (ID: {$patient['id']})\n";
            }

            // Create basic medications with UUIDs
            $medications = [
                ['id' => 'med_test_001', 'name' => 'Paracetamol', 'strength' => '500mg', 'stock_quantity' => 100, 'unit_price' => 2.50],
                ['id' => 'med_test_002', 'name' => 'Amoxicillin', 'strength' => '250mg', 'stock_quantity' => 75, 'unit_price' => 5.00],
                ['id' => 'med_test_003', 'name' => 'Ibuprofen', 'strength' => '400mg', 'stock_quantity' => 50, 'unit_price' => 3.00],
                ['id' => 'med_test_004', 'name' => 'Metformin', 'strength' => '500mg', 'stock_quantity' => 5, 'unit_price' => 4.50], // Low stock
            ];

            $medicationIds = [];
            foreach ($medications as $med) {
                $medData = array_merge($med, [
                    'generic_name' => $med['name'],
                    'dosage_form' => 'Tablet',
                    'reorder_level' => 10,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                
                DB::table('medications')->updateOrInsert(['id' => $med['id']], $medData);
                $medicationIds[] = $med['id'];
                echo "✅ Created medication: {$med['name']} (ID: {$med['id']})\n";
            }

            // Create visits for different queues
            $visits = [
                // Direct Pharmacy Queue (Green)
                [
                    'id' => 'visit_test_001',
                    'patient_id' => $patientIds[0], // John Doe
                    'visit_date' => $now->format('Y-m-d H:i:s'),
                    'visit_type' => 'Pharmacy Only',
                    'chief_complaint' => 'Need pain medication',
                    'notes' => 'Direct pharmacy visit',
                    'doctor_status' => 'Not Required',
                    'nurse_status' => 'Not Required',
                    'pharmacy_status' => 'Pending',
                    'billing_status' => 'Pending',
                    'visit_status' => 'Active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'id' => 'visit_test_002',
                    'patient_id' => $patientIds[1], // Mary Smith
                    'visit_date' => $now->subMinutes(15)->format('Y-m-d H:i:s'),
                    'visit_type' => 'Direct Pharmacy',
                    'chief_complaint' => 'Stomach upset',
                    'notes' => 'Direct pharmacy visit',
                    'doctor_status' => 'Not Required',
                    'nurse_status' => 'Not Required',
                    'pharmacy_status' => 'Pending',
                    'billing_status' => 'Pending',
                    'visit_status' => 'Active',
                    'created_at' => $now->subMinutes(15),
                    'updated_at' => $now->subMinutes(15),
                ],
                // Doctor Prescription Queue (Blue)
                [
                    'id' => 'visit_test_003',
                    'patient_id' => $patientIds[2], // David Wilson
                    'visit_date' => $now->subMinutes(30)->format('Y-m-d H:i:s'),
                    'visit_type' => 'Consultation',
                    'chief_complaint' => 'Bacterial infection',
                    'notes' => 'Doctor prescribed medications',
                    'doctor_status' => 'Completed',
                    'nurse_status' => 'Completed',
                    'pharmacy_status' => 'Pending',
                    'billing_status' => 'Pending',
                    'visit_status' => 'Active',
                    'created_at' => $now->subMinutes(30),
                    'updated_at' => $now->subMinutes(5),
                ]
            ];

            $visitIds = [];
            foreach ($visits as $visit) {
                DB::table('visits')->updateOrInsert(['id' => $visit['id']], $visit);
                $visitIds[] = $visit['id'];
                echo "✅ Created visit: {$visit['visit_type']} for patient {$visit['patient_id']} (Visit ID: {$visit['id']})\n";
            }

            // Create a prescription for David Wilson (doctor prescription queue patient)
            $prescriptionData = [
                'id' => 'presc_test_001',
                'patient_id' => $patientIds[2], // David Wilson
                'doctor_id' => 'user_001', // Generic doctor ID
                'visit_id' => $visitIds[2], // David's visit
                'prescription_date' => $now->subMinutes(25)->format('Y-m-d'),
                'diagnosis' => 'Bacterial infection',
                'notes' => 'Complete course of antibiotics',
                'status' => 'Active',
                'created_at' => $now->subMinutes(25),
                'updated_at' => $now->subMinutes(25),
            ];

            DB::table('prescriptions')->updateOrInsert(['id' => $prescriptionData['id']], $prescriptionData);
            echo "✅ Created prescription for David Wilson (ID: {$prescriptionData['id']})\n";

            // Create prescription items
            $prescriptionItems = [
                [
                    'id' => 'presc_item_test_001',
                    'prescription_id' => $prescriptionData['id'],
                    'medication_id' => $medicationIds[1], // Amoxicillin
                    'medication_name' => 'Amoxicillin',
                    'dosage' => '250mg',
                    'frequency' => 'Three times daily',
                    'duration' => '7 days',
                    'quantity' => 21,
                    'instructions' => 'Take with food',
                    'created_at' => $now->subMinutes(25),
                    'updated_at' => $now->subMinutes(25),
                ],
                [
                    'id' => 'presc_item_test_002',
                    'prescription_id' => $prescriptionData['id'],
                    'medication_id' => $medicationIds[0], // Paracetamol
                    'medication_name' => 'Paracetamol',
                    'dosage' => '500mg',
                    'frequency' => 'Every 6 hours',
                    'duration' => '5 days',
                    'quantity' => 20,
                    'instructions' => 'For pain relief',
                    'created_at' => $now->subMinutes(25),
                    'updated_at' => $now->subMinutes(25),
                ]
            ];

            foreach ($prescriptionItems as $item) {
                DB::table('prescription_items')->updateOrInsert(['id' => $item['id']], $item);
                echo "✅ Added prescription item: {$item['medication_name']}\n";
            }

            echo "\n🎉 PHARMACY TEST DATA CREATED SUCCESSFULLY!\n\n";
            
            echo "📋 SUMMARY:\n";
            echo "=========\n\n";
            
            echo "🟢 DIRECT PHARMACY QUEUE:\n";
            echo "  • John Doe - Pain medication (Pharmacy Only)\n";
            echo "  • Mary Smith - Stomach upset (Direct Pharmacy)\n\n";
            
            echo "🔵 DOCTOR PRESCRIPTION QUEUE:\n";
            echo "  • David Wilson - Bacterial infection (Has prescriptions)\n";
            echo "    └── Amoxicillin 250mg x21 + Paracetamol 500mg x20\n\n";
            
            echo "💊 MEDICATION STOCK:\n";
            echo "  • Paracetamol: 100 units ✅\n";
            echo "  • Amoxicillin: 75 units ✅\n";
            echo "  • Ibuprofen: 50 units ✅\n";
            echo "  • Metformin: 5 units ⚠️ (LOW STOCK)\n\n";
            
            echo "🧪 TEST SCENARIOS:\n";
            echo "1. ✅ Direct Pharmacy: Add medications for John/Mary\n";
            echo "2. ✅ Doctor Prescriptions: Dispense David's prescriptions\n";
            echo "3. ⚠️ Stock Validation: Try adding large quantities\n";
            echo "4. 🗑️ Remove Medications: Test stock restoration\n\n";
            
            echo "🎯 Ready to test pharmacy queue separation!\n";

        } catch (\Exception $e) {
            echo "\n❌ ERROR: " . $e->getMessage() . "\n";
            throw $e;
        }
    }
}