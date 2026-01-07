<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\LabTest;
use App\Models\Medication;
use App\Models\PatientService;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Payment;
use App\Models\User;
use Carbon\Carbon;

class CompletePatientJourneySeeder extends Seeder
{
    public function run()
    {
        $this->command->info('🏥 Creating complete patient journey with medications and lab tests...');

        // Get existing users (doctor, nurse, etc.)
        $doctor = User::where('role', 'doctor')->first();
        $nurse = User::where('role', 'nurse')->first();
        $pharmacist = User::where('role', 'pharmacist')->first();
        $labTechnician = User::where('role', 'lab_technician')->first();

        if (!$doctor || !$nurse) {
            $this->command->error('❌ Please run UserSeeder first to create doctor and nurse users');
            return;
        }

        // Ensure we have medications
        $this->createMedications();

        // Get available medications to ensure they exist
        $availableMedications = Medication::all();
        if ($availableMedications->count() === 0) {
            $this->command->error('❌ No medications found. Creating medications first...');
            $this->createMedications();
            $availableMedications = Medication::all();
        }

        // Create test patients with complete journey
        $patients = [
            [
                'full_name' => 'John Doe',
                'date_of_birth' => '1985-03-15',
                'gender' => 'Male',
                'phone' => '0712345678',
                'email' => 'john.doe@example.com',
                'address' => '123 Main Street, Dar es Salaam',
                'emergency_contact' => 'Jane Doe - 0712345679',
                'medical_history' => 'Hypertension, Diabetes Type 2',
                'allergies' => 'Penicillin',
            ],
            [
                'full_name' => 'Mary Johnson',
                'date_of_birth' => '1990-07-22',
                'gender' => 'Female',
                'phone' => '0723456789',
                'email' => 'mary.johnson@example.com',
                'address' => '456 Oak Avenue, Arusha',
                'emergency_contact' => 'Peter Johnson - 0723456780',
                'medical_history' => 'Asthma, Migraine',
                'allergies' => 'Aspirin, Shellfish',
            ],
            [
                'full_name' => 'Ahmed Hassan',
                'date_of_birth' => '1978-11-08',
                'gender' => 'Male',
                'phone' => '0734567890',
                'email' => 'ahmed.hassan@example.com',
                'address' => '789 Uhuru Street, Mwanza',
                'emergency_contact' => 'Fatima Hassan - 0734567891',
                'medical_history' => 'High cholesterol, Back pain',
                'allergies' => 'None known',
            ]
        ];

        foreach ($patients as $patientData) {
            $this->createCompletePatientJourney($patientData, $doctor, $nurse, $pharmacist, $labTechnician, $availableMedications);
        }

        $this->command->info('✅ Complete patient journey seeder completed successfully!');
        $this->command->info('📋 Created patients with:');
        $this->command->info('   - Patient registration');
        $this->command->info('   - Nurse assessment');
        $this->command->info('   - Doctor consultation with diagnosis');
        $this->command->info('   - Prescriptions with detailed medications');
        $this->command->info('   - Lab tests with results');
        $this->command->info('   - Pharmacy dispensing');
        $this->command->info('   - Billing and payments');
        $this->command->info('🎯 Now test the medical reports to see all data!');
    }

    private function createCompletePatientJourney($patientData, $doctor, $nurse, $pharmacist, $labTechnician, $availableMedications)
    {
        // 1. Create Patient
        $patient = Patient::create([
            'id' => Str::uuid(),
            'full_name' => $patientData['full_name'],
            'date_of_birth' => $patientData['date_of_birth'],
            'gender' => $patientData['gender'],
            'phone' => $patientData['phone'],
            'email' => $patientData['email'],
            'address' => $patientData['address'],
            'emergency_contact' => $patientData['emergency_contact'],
            'medical_history' => $patientData['medical_history'],
            'allergies' => $patientData['allergies'],
            'created_at' => Carbon::now()->subDays(rand(1, 30)),
        ]);

        $this->command->info("👤 Created patient: {$patient->full_name}");

        // 2. Create Patient Visit (Complete Journey)
        $visitDate = Carbon::now()->subDays(rand(1, 7));
        $visit = PatientVisit::create([
            'id' => Str::uuid(),
            'patient_id' => $patient->id,
            'visit_date' => $visitDate,
            'visit_type' => 'Consultation',
            'chief_complaint' => $this->getRandomComplaint(),
            'vital_signs' => json_encode([
                'temperature' => rand(360, 390) / 10,
                'blood_pressure' => rand(110, 140) . '/' . rand(70, 90),
                'heart_rate' => rand(60, 100),
                'respiratory_rate' => rand(12, 20),
                'weight' => rand(50, 100),
                'height' => rand(150, 190),
            ]),
            'nurse_notes' => 'Patient appears stable. Vital signs recorded. Ready for doctor consultation.',
            'doctor_diagnosis' => $this->getRandomDiagnosis(),
            'doctor_notes' => 'Patient examined thoroughly. Prescribed medications and ordered lab tests for further evaluation.',
            'treatment_plan' => 'Medication therapy, lab tests, follow-up in 2 weeks',
            'reception_status' => 'Completed',
            'reception_completed_at' => $visitDate,
            'nurse_status' => 'Completed',
            'nurse_completed_at' => $visitDate->copy()->addMinutes(30),
            'doctor_status' => 'Completed',
            'doctor_completed_at' => $visitDate->copy()->addMinutes(60),
            'lab_status' => 'Completed',
            'lab_completed_at' => $visitDate->copy()->addHours(2),
            'pharmacy_status' => 'Completed',
            'pharmacy_completed_at' => $visitDate->copy()->addHours(3),
            'billing_status' => 'Paid',
            'billing_completed_at' => $visitDate->copy()->addHours(4),
            'current_stage' => 'completed',
            'overall_status' => 'Completed',
        ]);

        // 3. Create Prescription with Multiple Medications
        $prescription = Prescription::create([
            'id' => Str::uuid(),
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'visit_id' => $visit->id,
            'prescription_date' => $visitDate->copy()->addMinutes(60),
            'diagnosis' => $visit->doctor_diagnosis,
            'notes' => 'Take medications as prescribed. Return if symptoms worsen.',
            'status' => 'Completed',
        ]);

        // Get available medications
        $prescriptionMedications = $this->getRandomMedications($availableMedications);

        foreach ($prescriptionMedications as $medData) {
            PrescriptionItem::create([
                'id' => Str::uuid(),
                'prescription_id' => $prescription->id,
                'medication_id' => $medData['medication']->id,
                'medication_name' => $medData['medication']->name,
                'dosage' => $medData['dosage'],
                'frequency' => $medData['frequency'],
                'duration' => $medData['duration'],
                'quantity' => $medData['quantity'],
                'instructions' => $medData['instructions'],
            ]);

            // Update medication stock
            $medData['medication']->decrement('stock_quantity', $medData['quantity']);
        }

        $this->command->info("💊 Created prescription with " . count($prescriptionMedications) . " medications");

        // 4. Create Lab Tests with Results
        $labTests = $this->getRandomLabTests();
        foreach ($labTests as $testData) {
            LabTest::create([
                'id' => Str::uuid(),
                'patient_id' => $patient->id,
                'visit_id' => $visit->id,
                'doctor_id' => $doctor->id,
                'test_name' => $testData['name'],
                'test_type' => $testData['type'],
                'test_date' => $visitDate->copy()->addMinutes(90),
                'status' => 'Completed',
                'results' => json_encode($testData['results']),
                'notes' => 'Test completed successfully. ' . $testData['interpretation'],
                'performed_by' => $labTechnician?->id,
            ]);
        }

        $this->command->info("🧪 Created " . count($labTests) . " lab tests with results");

        // 5. Create Patient Services (for billing)
        $services = [];
        
        // Consultation fee
        $services[] = [
            'service_name' => 'Doctor Consultation',
            'quantity' => 1,
            'unit_price' => 50000,
            'total_price' => 50000,
        ];

        // Medication services
        foreach ($prescriptionMedications as $medData) {
            $services[] = [
                'service_name' => $medData['medication']->name . ' - ' . $medData['dosage'],
                'quantity' => $medData['quantity'],
                'unit_price' => $medData['medication']->unit_price,
                'total_price' => $medData['medication']->unit_price * $medData['quantity'],
            ];
        }

        // Lab test services
        foreach ($labTests as $testData) {
            $services[] = [
                'service_name' => $testData['name'],
                'quantity' => 1,
                'unit_price' => $testData['price'],
                'total_price' => $testData['price'],
            ];
        }

        foreach ($services as $serviceData) {
            PatientService::create([
                'id' => Str::uuid(),
                'patient_id' => $patient->id,
                'service_name' => $serviceData['service_name'],
                'quantity' => $serviceData['quantity'],
                'unit_price' => $serviceData['unit_price'],
                'total_price' => $serviceData['total_price'],
                'service_date' => $visitDate->toDateString(),
                'status' => 'Completed',
            ]);
        }

        // 6. Create Invoice
        $totalAmount = array_sum(array_column($services, 'total_price'));
        $invoice = Invoice::create([
            'id' => Str::uuid(),
            'patient_id' => $patient->id,
            'invoice_number' => 'INV-' . date('Ymd') . '-' . rand(1000, 9999),
            'invoice_date' => $visitDate->copy()->addHours(3),
            'total_amount' => $totalAmount,
            'paid_amount' => $totalAmount,
            'balance' => 0,
            'status' => 'Paid',
            'notes' => 'Complete medical services - consultation, medications, lab tests',
        ]);

        // Create invoice items
        foreach ($services as $serviceData) {
            InvoiceItem::create([
                'id' => Str::uuid(),
                'invoice_id' => $invoice->id,
                'description' => $serviceData['service_name'],
                'quantity' => $serviceData['quantity'],
                'unit_price' => $serviceData['unit_price'],
                'total_price' => $serviceData['total_price'],
            ]);
        }

        // 7. Create Payment
        Payment::create([
            'id' => Str::uuid(),
            'patient_id' => $patient->id,
            'invoice_id' => $invoice->id,
            'amount' => $totalAmount,
            'payment_method' => 'Cash',
            'payment_date' => $visitDate->copy()->addHours(4),
            'reference_number' => 'PAY-' . date('Ymd') . '-' . rand(1000, 9999),
            'status' => 'Completed',
            'notes' => 'Full payment for medical services',
        ]);

        $this->command->info("💰 Created invoice (TSh " . number_format($totalAmount) . ") and payment");
        $this->command->info("✅ Complete journey for {$patient->full_name} finished\n");
    }

    private function createMedications()
    {
        $medications = [
            ['name' => 'Paracetamol', 'generic_name' => 'Acetaminophen', 'strength' => '500mg', 'dosage_form' => 'Tablet', 'unit_price' => 500, 'stock' => 1000],
            ['name' => 'Amoxicillin', 'generic_name' => 'Amoxicillin', 'strength' => '250mg', 'dosage_form' => 'Capsule', 'unit_price' => 1200, 'stock' => 500],
            ['name' => 'Metformin', 'generic_name' => 'Metformin HCl', 'strength' => '500mg', 'dosage_form' => 'Tablet', 'unit_price' => 800, 'stock' => 800],
            ['name' => 'Lisinopril', 'generic_name' => 'Lisinopril', 'strength' => '10mg', 'dosage_form' => 'Tablet', 'unit_price' => 1500, 'stock' => 300],
            ['name' => 'Omeprazole', 'generic_name' => 'Omeprazole', 'strength' => '20mg', 'dosage_form' => 'Capsule', 'unit_price' => 2000, 'stock' => 400],
            ['name' => 'Salbutamol', 'generic_name' => 'Salbutamol', 'strength' => '100mcg', 'dosage_form' => 'Inhaler', 'unit_price' => 3500, 'stock' => 200],
        ];

        foreach ($medications as $medData) {
            Medication::updateOrCreate(
                ['name' => $medData['name']],
                [
                    'id' => Str::uuid(),
                    'generic_name' => $medData['generic_name'],
                    'strength' => $medData['strength'],
                    'dosage_form' => $medData['dosage_form'],
                    'manufacturer' => 'Generic Pharma Ltd',
                    'unit_price' => $medData['unit_price'],
                    'stock_quantity' => $medData['stock'],
                    'reorder_level' => 50,
                    'expiry_date' => Carbon::now()->addYears(2),
                ]
            );
        }
    }

    private function getRandomMedications($availableMedications)
    {
        $prescriptionMeds = [];
        $selectedMeds = $availableMedications->random(rand(2, 4));

        foreach ($selectedMeds as $med) {
            $prescriptionMeds[] = [
                'medication' => $med,
                'dosage' => $med->strength,
                'frequency' => rand(1, 4),
                'duration' => rand(3, 30),
                'quantity' => rand(10, 60),
                'instructions' => $this->getRandomInstructions(),
            ];
        }

        return $prescriptionMeds;
    }

    private function getRandomLabTests()
    {
        $tests = [
            [
                'name' => 'Complete Blood Count (CBC)',
                'type' => 'Hematology',
                'price' => 25000,
                'results' => [
                    'results' => [
                        'WBC' => ['value' => rand(4000, 11000), 'unit' => '/μL', 'status' => 'Normal'],
                        'RBC' => ['value' => rand(4, 6), 'unit' => 'million/μL', 'status' => 'Normal'],
                        'Hemoglobin' => ['value' => rand(12, 16), 'unit' => 'g/dL', 'status' => 'Normal'],
                        'Hematocrit' => ['value' => rand(36, 48), 'unit' => '%', 'status' => 'Normal'],
                        'Platelets' => ['value' => rand(150000, 450000), 'unit' => '/μL', 'status' => 'Normal'],
                    ]
                ],
                'interpretation' => 'All blood parameters within normal limits. No signs of infection or anemia.',
            ],
            [
                'name' => 'Lipid Profile',
                'type' => 'Chemistry',
                'price' => 30000,
                'results' => [
                    'results' => [
                        'Total Cholesterol' => ['value' => rand(150, 200), 'unit' => 'mg/dL', 'status' => 'Normal'],
                        'HDL Cholesterol' => ['value' => rand(40, 60), 'unit' => 'mg/dL', 'status' => 'Normal'],
                        'LDL Cholesterol' => ['value' => rand(70, 130), 'unit' => 'mg/dL', 'status' => 'Normal'],
                        'Triglycerides' => ['value' => rand(50, 150), 'unit' => 'mg/dL', 'status' => 'Normal'],
                    ]
                ],
                'interpretation' => 'Lipid levels are within acceptable range. Continue healthy lifestyle.',
            ],
            [
                'name' => 'Blood Glucose (Fasting)',
                'type' => 'Chemistry',
                'price' => 15000,
                'results' => [
                    'results' => [
                        'Glucose' => ['value' => rand(70, 100), 'unit' => 'mg/dL', 'status' => 'Normal'],
                    ]
                ],
                'interpretation' => 'Fasting glucose level normal. No indication of diabetes.',
            ],
        ];

        return array_slice($tests, 0, rand(1, 3));
    }

    private function getRandomComplaint()
    {
        $complaints = [
            'Fever and headache for 3 days',
            'Chest pain and shortness of breath',
            'Abdominal pain and nausea',
            'Back pain and muscle stiffness',
            'Cough and sore throat',
            'Dizziness and fatigue',
            'Joint pain and swelling',
        ];

        return $complaints[array_rand($complaints)];
    }

    private function getRandomDiagnosis()
    {
        $diagnoses = [
            'Upper Respiratory Tract Infection',
            'Hypertension (Essential)',
            'Type 2 Diabetes Mellitus',
            'Gastroesophageal Reflux Disease (GERD)',
            'Lower Back Pain (Mechanical)',
            'Migraine Headache',
            'Bronchial Asthma',
        ];

        return $diagnoses[array_rand($diagnoses)];
    }

    private function getRandomInstructions()
    {
        $instructions = [
            'Take after meals',
            'Take before meals',
            'Take with plenty of water',
            'Take at bedtime',
            'Take on empty stomach',
            'Take with food to avoid stomach upset',
            'Do not crush or chew',
        ];

        return $instructions[array_rand($instructions)];
    }
}