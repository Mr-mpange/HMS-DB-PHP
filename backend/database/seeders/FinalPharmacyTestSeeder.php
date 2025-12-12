<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FinalPharmacyTestSeeder extends Seeder
{
    /**
     * Run the database seeds for testing pharmacy queue separation
     * Uses only essential columns that should exist
     */
    public function run(): void
    {
        $now = Carbon::now();
        
        echo "🏥 Creating Final Pharmacy Test Data...\n\n";
        
        try {
            // Check patient_visits table structure
            echo "🔍 Checking patient_visits table structure...\n";
            $columns = DB::select('PRAGMA table_info(patient_visits)');
            $columnNames = array_map(function($col) { return $col->name; }, $columns);
            echo "Available columns: " . implode(', ', $columnNames) . "\n\n";

            // Create patient visits with only essential columns
            echo "🏥 Creating patient visits...\n";
            $visits = [
                // Direct Pharmacy Queue (Green)
                [
                    'id' => 'visit_test_001',
                    'patient_id' => 'pat_test_001', // John Doe
                    'visit_date' => $now->format('Y-m-d H:i:s'),
                    'visit_type' => 'Pharmacy Only',
                    'chief_complaint' => 'Need pain medication',
                    'notes' => 'Direct pharmacy visit',
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'id' => 'visit_test_002',
                    'patient_id' => 'pat_test_002', // Mary Smith
                    'visit_date' => $now->subMinutes(15)->format('Y-m-d H:i:s'),
                    'visit_type' => 'Direct Pharmacy',
                    'chief_complaint' => 'Stomach upset',
                    'notes' => 'Direct pharmacy visit',
                    'created_at' => $now->subMinutes(15),
                    'updated_at' => $now->subMinutes(15),
                ],
                // Doctor Prescription Queue (Blue)
                [
                    'id' => 'visit_test_003',
                    'patient_id' => 'pat_test_003', // David Wilson
                    'visit_date' => $now->subMinutes(30)->format('Y-m-d H:i:s'),
                    'visit_type' => 'Consultation',
                    'chief_complaint' => 'Bacterial infection',
                    'notes' => 'Doctor consultation completed',
                    'created_at' => $now->subMinutes(30),
                    'updated_at' => $now->subMinutes(5),
                ]
            ];

            foreach ($visits as $visit) {
                // Only include columns that exist in the table
                $filteredVisit = [];
                foreach ($visit as $key => $value) {
                    if (in_array($key, $columnNames)) {
                        $filteredVisit[$key] = $value;
                    }
                }
                
                DB::table('patient_visits')->updateOrInsert(['id' => $visit['id']], $filteredVisit);
                echo "✅ Created visit: {$visit['visit_type']} for {$visit['patient_id']} (ID: {$visit['id']})\n";
            }

            // Create prescription for David Wilson
            echo "\n📋 Creating doctor prescriptions...\n";
            $prescriptionData = [
                'id' => 'presc_test_001',
                'patient_id' => 'pat_test_003', // David Wilson
                'doctor_id' => 'user_001',
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
                    'prescription_id' => 'presc_test_001',
                    'medication_id' => 'med_test_002', // Amoxicillin
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
                    'prescription_id' => 'presc_test_001',
                    'medication_id' => 'med_test_001', // Paracetamol
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
                echo "✅ Added prescription item: {$item['medication_name']} x{$item['quantity']}\n";
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
            echo "  • Metformin: 5 units ⚠️ (LOW STOCK)\n";
            echo "  • Cetirizine: 0 units ❌ (OUT OF STOCK)\n\n";
            
            echo "🧪 TEST SCENARIOS:\n";
            echo "1. ✅ Queue Separation: Check Green vs Blue queues\n";
            echo "2. ✅ Direct Pharmacy: Add medications for John/Mary\n";
            echo "3. ✅ Doctor Prescriptions: Dispense David's prescriptions\n";
            echo "4. ⚠️ Stock Validation: Test low stock warnings\n";
            echo "5. 🗑️ Remove Medications: Test stock restoration\n\n";
            
            echo "🎯 Ready to test pharmacy queue separation!\n";
            echo "\n🚀 Open Pharmacy Dashboard → Queue tab to see the separated queues!\n";

        } catch (\Exception $e) {
            echo "\n❌ ERROR: " . $e->getMessage() . "\n";
            throw $e;
        }
    }
}