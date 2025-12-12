<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class CompletePharmacyTestSeeder extends Seeder
{
    /**
     * Run the database seeds for testing pharmacy queue separation
     * Uses correct table names: patient_visits instead of visits
     */
    public function run(): void
    {
        $now = Carbon::now();
        
        echo "🏥 Creating Complete Pharmacy Test Data...\n\n";
        
        try {
            // Create test patients with proper UUIDs
            echo "👥 Creating test patients...\n";
            
            // Generate consistent UUIDs for test patients
            $patientIds = [
                'john' => Str::uuid()->toString(),
                'mary' => Str::uuid()->toString(), 
                'david' => Str::uuid()->toString()
            ];
            
            $patients = [
                [
                    'id' => $patientIds['john'],
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
                    'id' => $patientIds['mary'],
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
                    'id' => $patientIds['david'],
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

            foreach ($patients as $patient) {
                DB::table('patients')->updateOrInsert(['id' => $patient['id']], $patient);
                echo "✅ Created patient: {$patient['full_name']} (ID: {$patient['id']})\n";
            }

            // Create test medications with proper UUIDs
            echo "\n💊 Creating test medications...\n";
            $medications = [
                [
                    'id' => Str::uuid()->toString(),
                    'name' => 'Paracetamol',
                    'generic_name' => 'Acetaminophen',
                    'strength' => '500mg',
                    'dosage_form' => 'Tablet',
                    'stock_quantity' => 100,
                    'unit_price' => 2.50,
                    'reorder_level' => 10,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'id' => Str::uuid()->toString(),
                    'name' => 'Amoxicillin',
                    'generic_name' => 'Amoxicillin',
                    'strength' => '250mg',
                    'dosage_form' => 'Capsule',
                    'stock_quantity' => 75,
                    'unit_price' => 5.00,
                    'reorder_level' => 15,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'id' => Str::uuid()->toString(),
                    'name' => 'Ibuprofen',
                    'generic_name' => 'Ibuprofen',
                    'strength' => '400mg',
                    'dosage_form' => 'Tablet',
                    'stock_quantity' => 50,
                    'unit_price' => 3.00,
                    'reorder_level' => 10,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'id' => Str::uuid()->toString(),
                    'name' => 'Metformin',
                    'generic_name' => 'Metformin HCl',
                    'strength' => '500mg',
                    'dosage_form' => 'Tablet',
                    'stock_quantity' => 5, // Low stock for testing
                    'unit_price' => 4.50,
                    'reorder_level' => 10,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'id' => Str::uuid()->toString(),
                    'name' => 'Cetirizine',
                    'generic_name' => 'Cetirizine HCl',
                    'strength' => '10mg',
                    'dosage_form' => 'Tablet',
                    'stock_quantity' => 0, // Out of stock for testing
                    'unit_price' => 1.50,
                    'reorder_level' => 15,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            ];

            foreach ($medications as $med) {
                DB::table('medications')->updateOrInsert(['id' => $med['id']], $med);
                echo "✅ Created medication: {$med['name']} {$med['strength']} (Stock: {$med['stock_quantity']})\n";
            }

            // Create patient visits using correct table name and UUIDs
            echo "\n🏥 Creating patient visits...\n";
            $visits = [
                // Direct Pharmacy Queue (Green)
                [
                    'id' => Str::uuid()->toString(),
                    'patient_id' => $patientIds['john'], // John Doe
                    'visit_date' => $now->format('Y-m-d H:i:s'),
                    'visit_type' => 'Pharmacy Only',
                    'chief_complaint' => 'Need pain medication',
                    'notes' => 'Direct pharmacy visit - no doctor consultation needed',
                    'doctor_status' => 'Not Required',
                    'nurse_status' => 'Not Required',
                    'pharmacy_status' => 'Pending',
                    'billing_status' => 'Pending',
                    'current_stage' => 'pharmacy',
                    'status' => 'Active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'id' => Str::uuid()->toString(),
                    'patient_id' => $patientIds['mary'], // Mary Smith
                    'visit_date' => $now->subMinutes(15)->format('Y-m-d H:i:s'),
                    'visit_type' => 'Direct Pharmacy',
                    'chief_complaint' => 'Stomach upset medication',
                    'notes' => 'Direct pharmacy visit - over-the-counter medication',
                    'doctor_status' => 'Not Required',
                    'nurse_status' => 'Not Required',
                    'pharmacy_status' => 'Pending',
                    'billing_status' => 'Pending',
                    'current_stage' => 'pharmacy',
                    'status' => 'Active',
                    'created_at' => $now->subMinutes(15),
                    'updated_at' => $now->subMinutes(15),
                ],
                // Doctor Prescription Queue (Blue)
                [
                    'id' => Str::uuid()->toString(),
                    'patient_id' => $patientIds['david'], // David Wilson
                    'visit_date' => $now->subMinutes(30)->format('Y-m-d H:i:s'),
                    'visit_type' => 'Consultation',
                    'chief_complaint' => 'Bacterial infection symptoms',
                    'notes' => 'Doctor consultation completed, prescriptions written',
                    'doctor_status' => 'Completed',
                    'nurse_status' => 'Completed',
                    'pharmacy_status' => 'Pending',
                    'billing_status' => 'Pending',
                    'current_stage' => 'pharmacy',
                    'status' => 'Active',
                    'created_at' => $now->subMinutes(30),
                    'updated_at' => $now->subMinutes(5),
                ]
            ];

            foreach ($visits as $visit) {
                DB::table('patient_visits')->updateOrInsert(['id' => $visit['id']], $visit);
                echo "✅ Created visit: {$visit['visit_type']} for {$visit['patient_id']} (ID: {$visit['id']})\n";
            }

            // Create prescription for David Wilson (doctor prescription queue patient)
            echo "\n📋 Creating doctor prescriptions...\n";
            $prescriptionId = Str::uuid()->toString();
            $prescriptionData = [
                'id' => $prescriptionId,
                'patient_id' => $patientIds['david'], // David Wilson
                'doctor_id' => 'user_001', // Generic doctor ID
                'visit_id' => $visits[2]['id'], // David's visit
                'prescription_date' => $now->subMinutes(25)->format('Y-m-d'),
                'diagnosis' => 'Bacterial respiratory tract infection',
                'notes' => 'Complete full course of antibiotics as prescribed',
                'status' => 'Active',
                'created_at' => $now->subMinutes(25),
                'updated_at' => $now->subMinutes(25),
            ];

            DB::table('prescriptions')->updateOrInsert(['id' => $prescriptionData['id']], $prescriptionData);
            echo "✅ Created prescription for David Wilson (ID: {$prescriptionData['id']})\n";

            // Create prescription items
            $prescriptionItems = [
                [
                    'id' => Str::uuid()->toString(),
                    'prescription_id' => $prescriptionId,
                    'medication_id' => $medications[1]['id'], // Amoxicillin
                    'medication_name' => 'Amoxicillin',
                    'dosage' => '250mg',
                    'frequency' => 'Three times daily',
                    'duration' => '7 days',
                    'quantity' => 21,
                    'instructions' => 'Take with food to avoid stomach upset',
                    'created_at' => $now->subMinutes(25),
                    'updated_at' => $now->subMinutes(25),
                ],
                [
                    'id' => Str::uuid()->toString(),
                    'prescription_id' => $prescriptionId,
                    'medication_id' => $medications[0]['id'], // Paracetamol
                    'medication_name' => 'Paracetamol',
                    'dosage' => '500mg',
                    'frequency' => 'Every 6 hours as needed',
                    'duration' => '5 days',
                    'quantity' => 20,
                    'instructions' => 'For fever and pain relief',
                    'created_at' => $now->subMinutes(25),
                    'updated_at' => $now->subMinutes(25),
                ]
            ];

            foreach ($prescriptionItems as $item) {
                DB::table('prescription_items')->updateOrInsert(['id' => $item['id']], $item);
                echo "✅ Added prescription item: {$item['medication_name']} x{$item['quantity']}\n";
            }

            echo "\n🎉 COMPLETE PHARMACY TEST DATA CREATED SUCCESSFULLY!\n\n";
            
            echo "📋 SUMMARY:\n";
            echo "=========\n\n";
            
            echo "🟢 DIRECT PHARMACY QUEUE (Green):\n";
            echo "  • John Doe (ID: {$patientIds['john']}) - Pain medication (Pharmacy Only)\n";
            echo "  • Mary Smith (ID: {$patientIds['mary']}) - Stomach upset (Direct Pharmacy)\n\n";
            
            echo "🔵 DOCTOR PRESCRIPTION QUEUE (Blue):\n";
            echo "  • David Wilson (ID: {$patientIds['david']}) - Bacterial infection (Has prescriptions)\n";
            echo "    └── Amoxicillin 250mg x21 + Paracetamol 500mg x20\n\n";
            
            echo "💊 MEDICATION STOCK LEVELS:\n";
            echo "  • Paracetamol 500mg: 100 units ✅\n";
            echo "  • Amoxicillin 250mg: 75 units ✅\n";
            echo "  • Ibuprofen 400mg: 50 units ✅\n";
            echo "  • Metformin 500mg: 5 units ⚠️ (LOW STOCK)\n";
            echo "  • Cetirizine 10mg: 0 units ❌ (OUT OF STOCK)\n\n";
            
            echo "🧪 TEST SCENARIOS:\n";
            echo "=================\n";
            echo "1. ✅ Direct Pharmacy: Add medications for John/Mary\n";
            echo "2. ✅ Doctor Prescriptions: Dispense David's prescriptions\n";
            echo "3. ⚠️ Stock Validation: Try adding large quantities of Metformin\n";
            echo "4. ❌ Out of Stock: Try adding Cetirizine (should prevent)\n";
            echo "5. 🗑️ Remove Medications: Test stock restoration\n";
            echo "6. ➕ Add Additional: Add extra meds to prescription patients\n\n";
            
            echo "🎯 Ready to test complete pharmacy queue separation!\n";
            echo "\n🚀 Next Steps:\n";
            echo "  1. Open Pharmacy Dashboard\n";
            echo "  2. Go to 'Queue' tab\n";
            echo "  3. See patients in Green and Blue queues\n";
            echo "  4. Test all functionality!\n";

        } catch (\Exception $e) {
            echo "\n❌ ERROR: " . $e->getMessage() . "\n";
            throw $e;
        }
    }
}