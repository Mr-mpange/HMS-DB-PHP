<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MinimalPharmacyTestSeeder extends Seeder
{
    /**
     * Run the database seeds for testing pharmacy queue separation
     * Only uses basic tables that should exist
     */
    public function run(): void
    {
        $now = Carbon::now();
        
        echo "🏥 Creating Minimal Pharmacy Test Data...\n\n";
        
        try {
            // First, let's check what tables exist
            echo "📋 Checking available tables...\n";
            $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table'");
            foreach ($tables as $table) {
                echo "  • {$table->name}\n";
            }
            echo "\n";

            // Create test patients
            echo "👥 Creating test patients...\n";
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

            foreach ($patients as $patient) {
                DB::table('patients')->updateOrInsert(['id' => $patient['id']], $patient);
                echo "✅ Created patient: {$patient['full_name']} (ID: {$patient['id']})\n";
            }

            // Create test medications
            echo "\n💊 Creating test medications...\n";
            $medications = [
                [
                    'id' => 'med_test_001',
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
                    'id' => 'med_test_002',
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
                    'id' => 'med_test_003',
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
                    'id' => 'med_test_004',
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
                    'id' => 'med_test_005',
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

            echo "\n🎉 BASIC TEST DATA CREATED SUCCESSFULLY!\n\n";
            
            echo "📋 SUMMARY:\n";
            echo "=========\n\n";
            
            echo "👥 TEST PATIENTS:\n";
            echo "  • John Doe (pat_test_001) - 0712345678\n";
            echo "  • Mary Smith (pat_test_002) - 0723456789\n";
            echo "  • David Wilson (pat_test_003) - 0734567890\n\n";
            
            echo "💊 TEST MEDICATIONS:\n";
            echo "  • Paracetamol 500mg: 100 units ✅\n";
            echo "  • Amoxicillin 250mg: 75 units ✅\n";
            echo "  • Ibuprofen 400mg: 50 units ✅\n";
            echo "  • Metformin 500mg: 5 units ⚠️ (LOW STOCK)\n";
            echo "  • Cetirizine 10mg: 0 units ❌ (OUT OF STOCK)\n\n";
            
            echo "🧪 NEXT STEPS:\n";
            echo "=============\n";
            echo "1. ✅ Basic data created (patients + medications)\n";
            echo "2. 📝 You may need to manually create visits/prescriptions\n";
            echo "3. 🏥 Or check if your system has different table names\n";
            echo "4. 🔍 Use: php artisan tinker to explore your database\n\n";
            
            echo "💡 MANUAL TESTING:\n";
            echo "  • Use the pharmacy dashboard to create prescriptions\n";
            echo "  • Test stock validation with Metformin (low stock)\n";
            echo "  • Test out-of-stock prevention with Cetirizine\n";
            echo "  • Test medication removal and stock restoration\n\n";
            
            echo "🎯 Ready for manual pharmacy testing!\n";

        } catch (\Exception $e) {
            echo "\n❌ ERROR: " . $e->getMessage() . "\n";
            echo "\n💡 TIP: Check your database schema and table names\n";
            throw $e;
        }
    }
}