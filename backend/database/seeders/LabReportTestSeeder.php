<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\MedicalService;
use App\Models\PatientService;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\LabTest;
use App\Models\Payment;
use Illuminate\Support\Str;

class LabReportTestSeeder extends Seeder
{
    public function run()
    {
        echo "🧪 Creating Lab Report Test Data...\n\n";

        // Create test patient
        $patient = Patient::create([
            'id' => (string) Str::uuid(),
            'full_name' => 'Lab Report Test Patient',
            'phone' => '+255987654321',
            'gender' => 'Female',
            'date_of_birth' => '1985-05-15',
            'address' => 'Test Address for Lab Reports'
        ]);

        // Create visit
        $visit = PatientVisit::create([
            'id' => (string) Str::uuid(),
            'patient_id' => $patient->id,
            'visit_date' => now()->toDateString(),
            'current_stage' => 'billing',
            'billing_status' => 'Pending',
            'overall_status' => 'Active',
            'lab_status' => 'Completed',
            'lab_completed_at' => now()
        ]);

        // Create lab service
        $labService = MedicalService::create([
            'id' => (string) Str::uuid(),
            'service_name' => 'Complete Blood Count (CBC)',
            'service_code' => 'CBC-TEST-' . now()->format('His'),
            'service_type' => 'Laboratory',
            'base_price' => 150.00
        ]);

        // Create patient service (what patient owes)
        $patientService = PatientService::create([
            'id' => (string) Str::uuid(),
            'patient_id' => $patient->id,
            'service_id' => $labService->id,
            'quantity' => 1,
            'unit_price' => 150.00,
            'total_price' => 150.00,
            'service_date' => now()->toDateString(),
            'status' => 'Pending'
        ]);

        // Create invoice (UNPAID initially)
        $invoice = Invoice::create([
            'id' => (string) Str::uuid(),
            'patient_id' => $patient->id,
            'invoice_number' => 'INV-LAB-TEST-' . now()->format('YmdHis'),
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'total_amount' => 150.00,
            'paid_amount' => 0.00,
            'balance' => 150.00,
            'status' => 'Pending',
            'notes' => 'Lab Tests & Medications - Complete Blood Count (CBC) for Lab Report Test Patient'
        ]);

        // Create invoice item
        InvoiceItem::create([
            'id' => (string) Str::uuid(),
            'invoice_id' => $invoice->id,
            'description' => 'Complete Blood Count (CBC)',
            'quantity' => 1,
            'unit_price' => 150.00,
            'total_price' => 150.00
        ]);

        // Create completed lab test with results
        $labTest = LabTest::create([
            'id' => (string) Str::uuid(),
            'patient_id' => $patient->id,
            'visit_id' => $visit->id,
            'test_name' => 'Complete Blood Count (CBC)',
            'test_type' => 'Laboratory',
            'status' => 'Completed',
            'test_date' => now()->toDateString(),
            'results' => json_encode([
                'test_date' => now()->toISOString(),
                'performed_by' => 'Lab Technician John',
                'results' => [
                    'Hemoglobin' => [
                        'value' => '13.8',
                        'unit' => 'g/dL',
                        'normal_range' => '12.0-16.0',
                        'status' => 'Normal'
                    ],
                    'White Blood Cells' => [
                        'value' => '7200',
                        'unit' => '/μL',
                        'normal_range' => '4000-11000',
                        'status' => 'Normal'
                    ],
                    'Platelets' => [
                        'value' => '280000',
                        'unit' => '/μL',
                        'normal_range' => '150000-450000',
                        'status' => 'Normal'
                    ]
                ],
                'interpretation' => 'All blood count parameters are within normal limits.',
                'recommendations' => 'No immediate medical intervention required.'
            ])
        ]);

        echo "✅ Created Test Patient: {$patient->full_name} (ID: {$patient->id})\n";
        echo "✅ Created Invoice: {$invoice->invoice_number} - Amount: TSh {$invoice->total_amount} (UNPAID)\n";
        echo "✅ Created Lab Test: {$labTest->test_name} (COMPLETED with results)\n\n";

        echo "🧪 TEST SCENARIO:\n";
        echo "1. Patient has completed lab test with results\n";
        echo "2. Invoice exists for TSh 150.00 (UNPAID)\n";
        echo "3. Billing check should BLOCK printing until payment is made\n";
        echo "4. After payment, billing check should ALLOW printing\n\n";

        echo "📋 TESTING STEPS:\n";
        echo "1. Go to Nurse Dashboard → Lab Results Ready\n";
        echo "2. Try to print report for '{$patient->full_name}' → Should be BLOCKED\n";
        echo "3. Go to Billing Dashboard → Record payment for invoice\n";
        echo "4. Try to print report again → Should be ALLOWED\n\n";

        echo "🔍 Patient ID for testing: {$patient->id}\n";
        echo "💳 Invoice ID for payment: {$invoice->id}\n\n";

        echo "✅ Lab Report Test Data Created Successfully!\n";
    }
}