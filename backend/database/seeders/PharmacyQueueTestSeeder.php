<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PharmacyQueueTestSeeder extends Seeder
{
    /**
     * Run the database seeds for testing pharmacy queue separation
     */
    public function run(): void
    {
        $now = Carbon::now();
        
        // Create test patients for pharmacy queue
        $patients = [
            [
                'id' => 'pat_direct_001',
                'full_name' => 'John Doe',
                'phone' => '0712345678',
                'email' => 'john.doe@example.com',
                'date_of_birth' => '1985-05-15',
                'gender' => 'Male',
                'address' => '123 Main Street, Nairobi',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'pat_direct_002',
                'full_name' => 'Mary Smith',
                'phone' => '0723456789',
                'email' => 'mary.smith@example.com',
                'date_of_birth' => '1990-08-22',
                'gender' => 'Female',
                'address' => '456 Oak Avenue, Nairobi',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'pat_prescription_001',
                'full_name' => 'David Wilson',
                'phone' => '0734567890',
                'email' => 'david.wilson@example.com',
                'date_of_birth' => '1978-12-10',
                'gender' => 'Male',
                'address' => '789 Pine Road, Nairobi',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'pat_prescription_002',
                'full_name' => 'Sarah Johnson',
                'phone' => '0745678901',
                'email' => 'sarah.johnson@example.com',
                'date_of_birth' => '1992-03-18',
                'gender' => 'Female',
                'address' => '321 Cedar Lane, Nairobi',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'pat_prescription_003',
                'full_name' => 'Michael Brown',
                'phone' => '0756789012',
                'email' => 'michael.brown@example.com',
                'date_of_birth' => '1980-07-25',
                'gender' => 'Male',
                'address' => '654 Elm Street, Nairobi',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        ];

        foreach ($patients as $patient) {
            DB::table('patients')->updateOrInsert(['id' => $patient['id']], $patient);
        }

        // Create test medications with good stock levels (using basic columns only)
        $medications = [
            [
                'id' => 'med_001',
                'name' => 'Paracetamol',
                'generic_name' => 'Acetaminophen',
                'strength' => '500mg',
                'dosage_form' => 'Tablet',
                'stock_quantity' => 100,
                'unit_price' => 2.50,
                'reorder_level' => 20,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'med_002',
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
                'id' => 'med_003',
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
                'id' => 'med_004',
                'name' => 'Omeprazole',
                'generic_name' => 'Omeprazole',
                'strength' => '20mg',
                'dosage_form' => 'Capsule',
                'stock_quantity' => 30,
                'unit_price' => 8.00,
                'reorder_level' => 8,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'med_005',
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
                'id' => 'med_006',
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

        foreach ($medications as $medication) {
            DB::table('medications')->updateOrInsert(['id' => $medication['id']], $medication);
        }

        // Create visits for DIRECT PHARMACY QUEUE (Green Queue)
        $directPharmacyVisits = [
            [
                'id' => 'visit_direct_001',
                'patient_id' => 'pat_direct_001',
                'visit_date' => $now->format('Y-m-d H:i:s'),
                'visit_type' => 'Pharmacy Only',
                'chief_complaint' => 'Need pain medication',
                'notes' => 'Patient came directly to pharmacy for over-the-counter pain relief',
                'doctor_status' => 'Not Required',
                'nurse_status' => 'Not Required',
                'pharmacy_status' => 'Pending',
                'billing_status' => 'Pending',
                'visit_status' => 'Active',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'visit_direct_002',
                'patient_id' => 'pat_direct_002',
                'visit_date' => $now->subMinutes(15)->format('Y-m-d H:i:s'),
                'visit_type' => 'Direct Pharmacy',
                'chief_complaint' => 'Stomach upset medication',
                'notes' => 'Patient needs antacid medication, no prescription required',
                'doctor_status' => 'Not Required',
                'nurse_status' => 'Not Required',
                'pharmacy_status' => 'Pending',
                'billing_status' => 'Pending',
                'visit_status' => 'Active',
                'created_at' => $now->subMinutes(15),
                'updated_at' => $now->subMinutes(15),
            ]
        ];

        foreach ($directPharmacyVisits as $visit) {
            DB::table('visits')->updateOrInsert(['id' => $visit['id']], $visit);
        }

        // Create visits for DOCTOR PRESCRIPTION QUEUE (Blue Queue)
        $prescriptionVisits = [
            [
                'id' => 'visit_prescription_001',
                'patient_id' => 'pat_prescription_001',
                'visit_date' => $now->subMinutes(30)->format('Y-m-d H:i:s'),
                'visit_type' => 'Consultation',
                'chief_complaint' => 'Bacterial infection',
                'notes' => 'Doctor prescribed antibiotics and pain relief',
                'doctor_status' => 'Completed',
                'nurse_status' => 'Completed',
                'pharmacy_status' => 'Pending',
                'billing_status' => 'Pending',
                'visit_status' => 'Active',
                'created_at' => $now->subMinutes(30),
                'updated_at' => $now->subMinutes(5),
            ],
            [
                'id' => 'visit_prescription_002',
                'patient_id' => 'pat_prescription_002',
                'visit_date' => $now->subMinutes(45)->format('Y-m-d H:i:s'),
                'visit_type' => 'Follow-up',
                'chief_complaint' => 'Diabetes management',
                'notes' => 'Doctor adjusted diabetes medication dosage',
                'doctor_status' => 'Completed',
                'nurse_status' => 'Completed',
                'pharmacy_status' => 'Pending',
                'billing_status' => 'Pending',
                'visit_status' => 'Active',
                'created_at' => $now->subMinutes(45),
                'updated_at' => $now->subMinutes(10),
            ],
            [
                'id' => 'visit_prescription_003',
                'patient_id' => 'pat_prescription_003',
                'visit_date' => $now->subHour()->format('Y-m-d H:i:s'),
                'visit_type' => 'Consultation',
                'chief_complaint' => 'Gastric issues',
                'notes' => 'Doctor prescribed proton pump inhibitor and antacid',
                'doctor_status' => 'In Progress', // Still being seen by doctor
                'nurse_status' => 'Completed',
                'pharmacy_status' => 'Pending',
                'billing_status' => 'Pending',
                'visit_status' => 'Active',
                'created_at' => $now->subHour(),
                'updated_at' => $now->subMinutes(20),
            ]
        ];

        foreach ($prescriptionVisits as $visit) {
            DB::table('visits')->updateOrInsert(['id' => $visit['id']], $visit);
        }

        // Create doctor prescriptions for prescription queue patients
        $prescriptions = [
            [
                'id' => 'presc_001',
                'patient_id' => 'pat_prescription_001',
                'doctor_id' => 'user_doctor_001', // Assuming doctor user exists
                'visit_id' => 'visit_prescription_001',
                'prescription_date' => $now->subMinutes(25)->format('Y-m-d'),
                'diagnosis' => 'Bacterial respiratory tract infection',
                'notes' => 'Complete full course of antibiotics',
                'status' => 'Active',
                'created_at' => $now->subMinutes(25),
                'updated_at' => $now->subMinutes(25),
            ],
            [
                'id' => 'presc_002',
                'patient_id' => 'pat_prescription_002',
                'doctor_id' => 'user_doctor_001',
                'visit_id' => 'visit_prescription_002',
                'prescription_date' => $now->subMinutes(40)->format('Y-m-d'),
                'diagnosis' => 'Type 2 Diabetes Mellitus',
                'notes' => 'Monitor blood sugar levels regularly',
                'status' => 'Active',
                'created_at' => $now->subMinutes(40),
                'updated_at' => $now->subMinutes(40),
            ],
            [
                'id' => 'presc_003',
                'patient_id' => 'pat_prescription_003',
                'doctor_id' => 'user_doctor_001',
                'visit_id' => 'visit_prescription_003',
                'prescription_date' => $now->subMinutes(55)->format('Y-m-d'),
                'diagnosis' => 'Gastroesophageal reflux disease (GERD)',
                'notes' => 'Take medication before meals',
                'status' => 'Pending', // Doctor still writing prescription
                'created_at' => $now->subMinutes(55),
                'updated_at' => $now->subMinutes(30),
            ]
        ];

        foreach ($prescriptions as $prescription) {
            DB::table('prescriptions')->updateOrInsert(['id' => $prescription['id']], $prescription);
        }

        // Create prescription items (doctor's prescribed medications)
        $prescriptionItems = [
            // For prescription 1 (Bacterial infection)
            [
                'id' => 'presc_item_001',
                'prescription_id' => 'presc_001',
                'medication_id' => 'med_002', // Amoxicillin
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
                'id' => 'presc_item_002',
                'prescription_id' => 'presc_001',
                'medication_id' => 'med_001', // Paracetamol
                'medication_name' => 'Paracetamol',
                'dosage' => '500mg',
                'frequency' => 'Every 6 hours as needed',
                'duration' => '5 days',
                'quantity' => 20,
                'instructions' => 'For fever and pain relief',
                'created_at' => $now->subMinutes(25),
                'updated_at' => $now->subMinutes(25),
            ],
            
            // For prescription 2 (Diabetes)
            [
                'id' => 'presc_item_003',
                'prescription_id' => 'presc_002',
                'medication_id' => 'med_005', // Metformin (low stock!)
                'medication_name' => 'Metformin',
                'dosage' => '500mg',
                'frequency' => 'Twice daily',
                'duration' => '30 days',
                'quantity' => 60, // This will exceed available stock (5)!
                'instructions' => 'Take with meals to reduce stomach upset',
                'created_at' => $now->subMinutes(40),
                'updated_at' => $now->subMinutes(40),
            ],
            
            // For prescription 3 (GERD)
            [
                'id' => 'presc_item_004',
                'prescription_id' => 'presc_003',
                'medication_id' => 'med_004', // Omeprazole
                'medication_name' => 'Omeprazole',
                'dosage' => '20mg',
                'frequency' => 'Once daily',
                'duration' => '14 days',
                'quantity' => 14,
                'instructions' => 'Take 30 minutes before breakfast',
                'created_at' => $now->subMinutes(55),
                'updated_at' => $now->subMinutes(30),
            ],
            [
                'id' => 'presc_item_005',
                'prescription_id' => 'presc_003',
                'medication_id' => 'med_003', // Ibuprofen
                'medication_name' => 'Ibuprofen',
                'dosage' => '400mg',
                'frequency' => 'Twice daily as needed',
                'duration' => '7 days',
                'quantity' => 14,
                'instructions' => 'Take with food, for pain relief only',
                'created_at' => $now->subMinutes(55),
                'updated_at' => $now->subMinutes(30),
            ]
        ];

        foreach ($prescriptionItems as $item) {
            DB::table('prescription_items')->updateOrInsert(['id' => $item['id']], $item);
        }

        echo "\n🏥 PHARMACY QUEUE TEST DATA CREATED SUCCESSFULLY!\n\n";
        
        echo "📋 SUMMARY:\n";
        echo "=========\n\n";
        
        echo "🟢 DIRECT PHARMACY QUEUE (Green):\n";
        echo "  • John Doe - Need pain medication (Pharmacy Only)\n";
        echo "  • Mary Smith - Stomach upset medication (Direct Pharmacy)\n\n";
        
        echo "🔵 DOCTOR PRESCRIPTION QUEUE (Blue):\n";
        echo "  • David Wilson - Bacterial infection (Doctor Completed)\n";
        echo "    └── Amoxicillin 250mg x21 + Paracetamol 500mg x20\n";
        echo "  • Sarah Johnson - Diabetes management (Doctor Completed)\n";
        echo "    └── Metformin 500mg x60 ⚠️ (EXCEEDS STOCK: 5 available!)\n";
        echo "  • Michael Brown - Gastric issues (Doctor In Progress)\n";
        echo "    └── Omeprazole 20mg x14 + Ibuprofen 400mg x14\n\n";
        
        echo "💊 MEDICATION STOCK LEVELS:\n";
        echo "  • Paracetamol 500mg: 100 units ✅\n";
        echo "  • Amoxicillin 250mg: 75 units ✅\n";
        echo "  • Ibuprofen 400mg: 50 units ✅\n";
        echo "  • Omeprazole 20mg: 30 units ✅\n";
        echo "  • Metformin 500mg: 5 units ⚠️ (LOW STOCK)\n";
        echo "  • Cetirizine 10mg: 0 units ❌ (OUT OF STOCK)\n\n";
        
        echo "🧪 TEST SCENARIOS:\n";
        echo "=================\n";
        echo "1. ✅ Direct Pharmacy: Add any medications for walk-in patients\n";
        echo "2. ✅ Doctor Prescriptions: Dispense prescribed medications\n";
        echo "3. ⚠️ Stock Validation: Try dispensing 60 Metformin (only 5 available)\n";
        echo "4. 🗑️ Remove Medications: Test stock restoration when removing items\n";
        echo "5. ➕ Add Additional: Add extra medications to prescription patients\n";
        echo "6. 📊 Queue Separation: Verify patients appear in correct queues\n\n";
        
        echo "🎯 Ready to test the pharmacy queue separation system!\n";
    }
}