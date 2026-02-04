<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\User;
use App\Models\Medication;
use Carbon\Carbon;

class PharmacyDispenseTestSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('💊 Creating prescriptions ready for pharmacy dispensing...');

        // Get users
        $doctor = User::where('role', 'doctor')->first();
        $pharmacist = User::where('role', 'pharmacist')->first();
        
        if (!$doctor) {
            $this->command->error('❌ No doctor found. Please run TestUserSeeder first.');
            return;
        }

        // Ensure medications exist
        $this->createMedications();

        // Create patients with prescriptions ready for dispensing
        $patientsData = [
            [
                'patient' => [
                    'full_name' => 'Emma Wilson',
                    'date_of_birth' => '2015-04-12', // Child - 8 years old
                    'gender' => 'Female',
                    'phone' => '0712000001',
                    'email' => 'emma.parent@example.com',
                    'address' => '123 Kids Street, Dar es Salaam',
                    'emergency_contact' => 'Sarah Wilson (Mother) - 0712000002',
                    'medical_history' => 'No significant medical history',
                    'allergies' => 'Penicillin',
                    'blood_group' => 'A+'
                ],
                'visit' => [
                    'chief_complaint' => 'Fever and ear pain for 2 days',
                    'provisional_diagnosis' => 'Acute otitis media',
                    'vital_signs' => [
                        'temperature' => '38.5°C',
                        'weight' => '25',
                        'height' => '125 cm',
                        'heart_rate' => '110 bpm'
                    ]
                ],
                'medications' => [
                    ['name' => 'Amoxicillin', 'dosage' => '250mg', 'frequency' => '3', 'duration' => '7', 'quantity' => 21, 'instructions' => 'Take with food'],
                    ['name' => 'Paracetamol', 'dosage' => '250mg', 'frequency' => '4', 'duration' => '5', 'quantity' => 20, 'instructions' => 'For fever and pain']
                ]
            ],
            [
                'patient' => [
                    'full_name' => 'Robert Anderson',
                    'date_of_birth' => '1950-08-15', // Elderly - 73 years old
                    'gender' => 'Male',
                    'phone' => '0723000001',
                    'email' => 'robert.anderson@example.com',
                    'address' => '456 Senior Avenue, Arusha',
                    'emergency_contact' => 'Mary Anderson (Wife) - 0723000002',
                    'medical_history' => 'Hypertension, Type 2 Diabetes, Chronic kidney disease',
                    'allergies' => 'Sulfa drugs, NSAIDs',
                    'blood_group' => 'O+'
                ],
                'visit' => [
                    'chief_complaint' => 'Routine follow-up for diabetes and hypertension',
                    'provisional_diagnosis' => 'Type 2 Diabetes Mellitus, Essential Hypertension',
                    'vital_signs' => [
                        'temperature' => '36.8°C',
                        'weight' => '78',
                        'height' => '172 cm',
                        'blood_pressure' => '145/88 mmHg',
                        'heart_rate' => '72 bpm'
                    ]
                ],
                'medications' => [
                    ['name' => 'Metformin', 'dosage' => '500mg', 'frequency' => '2', 'duration' => '30', 'quantity' => 60, 'instructions' => 'Take with meals'],
                    ['name' => 'Lisinopril', 'dosage' => '10mg', 'frequency' => '1', 'duration' => '30', 'quantity' => 30, 'instructions' => 'Take in the morning'],
                    ['name' => 'Atorvastatin', 'dosage' => '20mg', 'frequency' => '1', 'duration' => '30', 'quantity' => 30, 'instructions' => 'Take at bedtime']
                ]
            ],
            [
                'patient' => [
                    'full_name' => 'Priya Sharma',
                    'date_of_birth' => '1988-12-03', // Adult female - 35 years old
                    'gender' => 'Female',
                    'phone' => '0734000001',
                    'email' => 'priya.sharma@example.com',
                    'address' => '789 Health Road, Mwanza',
                    'emergency_contact' => 'Raj Sharma (Husband) - 0734000002',
                    'medical_history' => 'Migraine headaches, Iron deficiency anemia',
                    'allergies' => 'None known',
                    'blood_group' => 'B-'
                ],
                'visit' => [
                    'chief_complaint' => 'Severe migraine headache',
                    'provisional_diagnosis' => 'Migraine headache with aura',
                    'vital_signs' => [
                        'temperature' => '36.9°C',
                        'weight' => '58',
                        'height' => '160 cm',
                        'blood_pressure' => '118/75 mmHg',
                        'heart_rate' => '88 bpm'
                    ]
                ],
                'medications' => [
                    ['name' => 'Sumatriptan', 'dosage' => '50mg', 'frequency' => '1', 'duration' => '1', 'quantity' => 2, 'instructions' => 'Take at onset of migraine'],
                    ['name' => 'Ibuprofen', 'dosage' => '400mg', 'frequency' => '3', 'duration' => '3', 'quantity' => 9, 'instructions' => 'Take with food for pain']
                ]
            ]
        ];

        foreach ($patientsData as $data) {
            $this->createPatientWithPrescription($data, $doctor);
        }

        $this->command->info('✅ Pharmacy dispense test data created successfully!');
        $this->command->info('📋 Created 3 patients with prescriptions ready for dispensing:');
        $this->command->info('   - Emma Wilson (8 years): Pediatric patient with ear infection');
        $this->command->info('   - Robert Anderson (73 years): Elderly patient with multiple medications');
        $this->command->info('   - Priya Sharma (35 years): Adult female with migraine medications');
        $this->command->info('🎯 Login as pharmacist and test the enhanced dispense dialog!');
    }

    private function createPatientWithPrescription($data, $doctor)
    {
        // Create patient
        $patient = Patient::create([
            'id' => Str::uuid(),
            ...$data['patient'],
            'created_at' => Carbon::now()->subHours(rand(1, 24)),
        ]);

        // Create visit
        $visitData = $data['visit'];
        $visit = PatientVisit::create([
            'id' => Str::uuid(),
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'visit_date' => Carbon::now()->subHours(rand(1, 6)),
            'status' => 'Active',
            'overall_status' => 'Active',
            'current_stage' => 'pharmacy',
            'reception_status' => 'Completed',
            'reception_completed_at' => Carbon::now()->subHours(rand(4, 8)),
            'nurse_status' => 'Completed',
            'nurse_completed_at' => Carbon::now()->subHours(rand(3, 6)),
            'doctor_status' => 'Completed',
            'doctor_completed_at' => Carbon::now()->subHours(rand(1, 3)),
            'lab_status' => 'Not Required',
            'pharmacy_status' => 'Pending',
            'billing_status' => 'Pending',
            ...$visitData,
            'vital_signs' => json_encode($visitData['vital_signs']),
        ]);

        // Create prescription
        $prescription = Prescription::create([
            'id' => Str::uuid(),
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'visit_id' => $visit->id,
            'prescription_date' => Carbon::now()->subHours(rand(1, 3)),
            'diagnosis' => $visitData['provisional_diagnosis'],
            'notes' => 'Prescription ready for pharmacy dispensing',
            'status' => 'Active',
        ]);

        // Create prescription items
        foreach ($data['medications'] as $medData) {
            $medication = Medication::where('name', $medData['name'])->first();
            if ($medication) {
                PrescriptionItem::create([
                    'id' => Str::uuid(),
                    'prescription_id' => $prescription->id,
                    'medication_id' => $medication->id,
                    'medication_name' => $medication->name,
                    'dosage' => $medData['dosage'],
                    'frequency' => $medData['frequency'],
                    'duration' => $medData['duration'],
                    'quantity' => $medData['quantity'],
                    'instructions' => $medData['instructions'],
                ]);
            }
        }

        $this->command->info("👤 Created patient: {$patient->full_name} - Age: " . 
            (Carbon::now()->year - Carbon::parse($patient->date_of_birth)->year) . " years");
    }

    private function createMedications()
    {
        $medications = [
            // Pediatric medications
            ['name' => 'Amoxicillin', 'generic_name' => 'Amoxicillin', 'strength' => '250mg', 'dosage_form' => 'Suspension', 'unit_price' => 1500, 'stock' => 500],
            ['name' => 'Paracetamol', 'generic_name' => 'Acetaminophen', 'strength' => '250mg', 'dosage_form' => 'Syrup', 'unit_price' => 800, 'stock' => 1000],
            
            // Adult medications
            ['name' => 'Metformin', 'generic_name' => 'Metformin HCl', 'strength' => '500mg', 'dosage_form' => 'Tablet', 'unit_price' => 600, 'stock' => 800],
            ['name' => 'Lisinopril', 'generic_name' => 'Lisinopril', 'strength' => '10mg', 'dosage_form' => 'Tablet', 'unit_price' => 1200, 'stock' => 400],
            ['name' => 'Atorvastatin', 'generic_name' => 'Atorvastatin Calcium', 'strength' => '20mg', 'dosage_form' => 'Tablet', 'unit_price' => 1800, 'stock' => 300],
            ['name' => 'Sumatriptan', 'generic_name' => 'Sumatriptan Succinate', 'strength' => '50mg', 'dosage_form' => 'Tablet', 'unit_price' => 5000, 'stock' => 100],
            ['name' => 'Ibuprofen', 'generic_name' => 'Ibuprofen', 'strength' => '400mg', 'dosage_form' => 'Tablet', 'unit_price' => 400, 'stock' => 1200],
        ];

        foreach ($medications as $medData) {
            Medication::updateOrCreate(
                ['name' => $medData['name']],
                [
                    'id' => Str::uuid(),
                    'generic_name' => $medData['generic_name'],
                    'strength' => $medData['strength'],
                    'dosage_form' => $medData['dosage_form'],
                    'manufacturer' => 'SafeMeds Pharmaceuticals',
                    'unit_price' => $medData['unit_price'],
                    'stock_quantity' => $medData['stock'],
                    'reorder_level' => 50,
                    'expiry_date' => Carbon::now()->addYears(2),
                    'category' => $this->getMedicationCategory($medData['name']),
                ]
            );
        }
    }

    private function getMedicationCategory($name)
    {
        $categories = [
            'Amoxicillin' => 'Antibiotic',
            'Paracetamol' => 'Analgesic',
            'Metformin' => 'Antidiabetic',
            'Lisinopril' => 'Cardiovascular',
            'Atorvastatin' => 'Cardiovascular',
            'Sumatriptan' => 'Neurological',
            'Ibuprofen' => 'NSAID',
        ];

        return $categories[$name] ?? 'General';
    }
}