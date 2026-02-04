<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\User;
use App\Models\Medication;
use Carbon\Carbon;

class PrescriptionTestSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('🏥 Creating patients ready for prescription...');

        // Get doctor
        $doctor = User::where('role', 'doctor')->first();
        if (!$doctor) {
            $this->command->error('❌ No doctor found. Please run TestUserSeeder first.');
            return;
        }

        // Ensure we have medications
        $this->createMedications();

        // Create patients with different medical conditions ready for prescription
        $patientsData = [
            [
                'patient' => [
                    'full_name' => 'Sarah Johnson',
                    'date_of_birth' => '1985-06-15',
                    'gender' => 'Female',
                    'phone' => '0712345001',
                    'email' => 'sarah.johnson@example.com',
                    'address' => '123 Health Street, Dar es Salaam',
                    'emergency_contact' => 'John Johnson - 0712345002',
                    'medical_history' => 'Hypertension, Type 2 Diabetes',
                    'allergies' => 'Penicillin, Sulfa drugs',
                    'blood_group' => 'A+'
                ],
                'visit' => [
                    'chief_complaint' => 'Chest pain and shortness of breath',
                    'chief_complaint_detailed' => 'Patient reports sharp chest pain that started 2 hours ago, associated with shortness of breath and sweating. Pain is 7/10 in intensity.',
                    'history_present_illness' => 'Patient was at rest when sudden onset of sharp, stabbing chest pain began. Associated with dyspnea, diaphoresis, and mild nausea. No radiation of pain. No recent trauma or exertion.',
                    'review_of_systems' => 'Cardiovascular: Chest pain, dyspnea. Respiratory: Shortness of breath. GI: Mild nausea. Neurological: No headache or dizziness.',
                    'past_medical_history' => 'Hypertension diagnosed 5 years ago, well controlled on medication. Type 2 diabetes diagnosed 3 years ago, managed with metformin.',
                    'family_social_history' => 'Father died of MI at age 65. Mother has diabetes. Non-smoker, occasional alcohol use. Works as teacher.',
                    'provisional_diagnosis' => 'Acute coronary syndrome vs. Unstable angina',
                    'investigation_plan' => 'ECG, Cardiac enzymes (Troponin I), CBC, Basic metabolic panel, Chest X-ray',
                    'final_diagnosis' => 'Unstable angina',
                    'treatment_rx' => 'Aspirin 81mg daily, Atorvastatin 40mg daily, Metoprolol 25mg BID',
                    'other_management' => 'Cardiac diet, exercise as tolerated, follow-up with cardiology in 1 week',
                    'provisional_diagnosis_completed' => true,
                    'vital_signs' => [
                        'temperature' => '98.6°F',
                        'blood_pressure' => '145/92 mmHg',
                        'heart_rate' => '88 bpm',
                        'respiratory_rate' => '18/min',
                        'oxygen_saturation' => '97%',
                        'weight' => '68 kg',
                        'height' => '165 cm'
                    ]
                ]
            ],
            [
                'patient' => [
                    'full_name' => 'Michael Thompson',
                    'date_of_birth' => '1978-03-22',
                    'gender' => 'Male',
                    'phone' => '0723456001',
                    'email' => 'michael.thompson@example.com',
                    'address' => '456 Wellness Avenue, Arusha',
                    'emergency_contact' => 'Lisa Thompson - 0723456002',
                    'medical_history' => 'Asthma, GERD',
                    'allergies' => 'Aspirin, Shellfish',
                    'blood_group' => 'O-'
                ],
                'visit' => [
                    'chief_complaint' => 'Persistent cough and fever for 5 days',
                    'chief_complaint_detailed' => 'Patient presents with productive cough with yellow-green sputum, fever up to 101.5°F, and fatigue for the past 5 days.',
                    'history_present_illness' => 'Gradual onset of dry cough 5 days ago, became productive with purulent sputum. Fever started 3 days ago with chills. Associated with fatigue and mild chest discomfort.',
                    'review_of_systems' => 'Respiratory: Productive cough, mild dyspnea. Constitutional: Fever, chills, fatigue. GI: Decreased appetite.',
                    'past_medical_history' => 'Asthma since childhood, well controlled with inhaler. GERD diagnosed 2 years ago, managed with PPI.',
                    'family_social_history' => 'No significant family history of respiratory diseases. Smoker (10 pack-years), trying to quit. Works in construction.',
                    'provisional_diagnosis' => 'Community-acquired pneumonia',
                    'investigation_plan' => 'Chest X-ray, CBC with differential, Blood cultures, Sputum culture',
                    'final_diagnosis' => 'Community-acquired pneumonia, right lower lobe',
                    'treatment_rx' => 'Amoxicillin-clavulanate 875mg BID x 7 days, Albuterol inhaler PRN',
                    'other_management' => 'Rest, increased fluid intake, smoking cessation counseling, follow-up in 3 days',
                    'provisional_diagnosis_completed' => true,
                    'vital_signs' => [
                        'temperature' => '101.2°F',
                        'blood_pressure' => '128/78 mmHg',
                        'heart_rate' => '95 bpm',
                        'respiratory_rate' => '22/min',
                        'oxygen_saturation' => '94%',
                        'weight' => '82 kg',
                        'height' => '178 cm'
                    ]
                ]
            ],
            [
                'patient' => [
                    'full_name' => 'Grace Mwangi',
                    'date_of_birth' => '1992-11-08',
                    'gender' => 'Female',
                    'phone' => '0734567001',
                    'email' => 'grace.mwangi@example.com',
                    'address' => '789 Care Road, Mwanza',
                    'emergency_contact' => 'Peter Mwangi - 0734567002',
                    'medical_history' => 'Migraine headaches',
                    'allergies' => 'None known',
                    'blood_group' => 'B+'
                ],
                'visit' => [
                    'chief_complaint' => 'Severe abdominal pain and nausea',
                    'chief_complaint_detailed' => 'Patient reports severe cramping abdominal pain in the right lower quadrant, started 8 hours ago. Associated with nausea and one episode of vomiting.',
                    'history_present_illness' => 'Pain initially started around umbilicus, then migrated to right lower quadrant. Progressive worsening over 8 hours. Associated with nausea, vomiting, and low-grade fever.',
                    'review_of_systems' => 'GI: Abdominal pain, nausea, vomiting, no diarrhea. Constitutional: Low-grade fever, malaise.',
                    'past_medical_history' => 'Migraine headaches since teenage years, managed with sumatriptan PRN. No previous surgeries.',
                    'family_social_history' => 'No significant family history. Non-smoker, social drinker. Works as nurse.',
                    'obstetric_history' => 'G1P1, one normal vaginal delivery 2 years ago. Currently not pregnant (LMP 2 weeks ago).',
                    'provisional_diagnosis' => 'Acute appendicitis',
                    'investigation_plan' => 'CBC, Basic metabolic panel, Urinalysis, Abdominal CT scan, Pregnancy test',
                    'final_diagnosis' => 'Acute appendicitis',
                    'treatment_rx' => 'NPO, IV fluids, Morphine 2mg IV PRN pain, Ondansetron 4mg IV PRN nausea',
                    'other_management' => 'Surgical consultation for appendectomy, NPO status, IV access',
                    'provisional_diagnosis_completed' => true,
                    'vital_signs' => [
                        'temperature' => '100.8°F',
                        'blood_pressure' => '118/72 mmHg',
                        'heart_rate' => '102 bpm',
                        'respiratory_rate' => '20/min',
                        'oxygen_saturation' => '98%',
                        'weight' => '58 kg',
                        'height' => '162 cm'
                    ]
                ]
            ]
        ];

        foreach ($patientsData as $data) {
            $this->createPatientWithVisit($data, $doctor);
        }

        $this->command->info('✅ Prescription test data created successfully!');
        $this->command->info('📋 Created 3 patients ready for prescription:');
        $this->command->info('   - Sarah Johnson: Unstable angina (needs cardiac medications)');
        $this->command->info('   - Michael Thompson: Pneumonia (needs antibiotics)');
        $this->command->info('   - Grace Mwangi: Appendicitis (needs pre-op medications)');
        $this->command->info('🎯 Login as doctor and test the enhanced prescription dialog!');
    }

    private function createPatientWithVisit($data, $doctor)
    {
        // Create patient
        $patient = Patient::create([
            'id' => Str::uuid(),
            ...$data['patient'],
            'created_at' => Carbon::now()->subHours(rand(1, 24)),
        ]);

        // Create visit with comprehensive data
        $visitData = $data['visit'];
        $visit = PatientVisit::create([
            'id' => Str::uuid(),
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'visit_date' => Carbon::now()->subHours(rand(1, 6)),
            'status' => 'Active',
            'overall_status' => 'Active',
            'current_stage' => 'doctor',
            'reception_status' => 'Completed',
            'reception_completed_at' => Carbon::now()->subHours(rand(2, 8)),
            'nurse_status' => 'Completed',
            'nurse_completed_at' => Carbon::now()->subHours(rand(1, 6)),
            'nurse_notes' => 'Vital signs recorded. Patient appears uncomfortable. Ready for doctor evaluation.',
            'doctor_status' => 'In Consultation',
            'doctor_started_at' => Carbon::now()->subMinutes(rand(10, 60)),
            'doctor_notes' => 'Comprehensive evaluation completed. Diagnosis established. Ready for prescription.',
            'lab_status' => 'Pending',
            'pharmacy_status' => 'Pending',
            'billing_status' => 'Pending',
            ...$visitData,
            'vital_signs' => json_encode($visitData['vital_signs']),
        ]);

        $this->command->info("👤 Created patient: {$patient->full_name} - {$visitData['provisional_diagnosis']}");
    }

    private function createMedications()
    {
        $medications = [
            // Cardiac medications
            ['name' => 'Aspirin', 'generic_name' => 'Acetylsalicylic Acid', 'strength' => '81mg', 'dosage_form' => 'Tablet', 'unit_price' => 200, 'stock' => 1000],
            ['name' => 'Atorvastatin', 'generic_name' => 'Atorvastatin Calcium', 'strength' => '40mg', 'dosage_form' => 'Tablet', 'unit_price' => 1500, 'stock' => 500],
            ['name' => 'Metoprolol', 'generic_name' => 'Metoprolol Tartrate', 'strength' => '25mg', 'dosage_form' => 'Tablet', 'unit_price' => 800, 'stock' => 800],
            
            // Antibiotics
            ['name' => 'Amoxicillin-Clavulanate', 'generic_name' => 'Amoxicillin/Clavulanic Acid', 'strength' => '875mg/125mg', 'dosage_form' => 'Tablet', 'unit_price' => 2500, 'stock' => 300],
            ['name' => 'Albuterol', 'generic_name' => 'Salbutamol', 'strength' => '100mcg', 'dosage_form' => 'Inhaler', 'unit_price' => 3500, 'stock' => 200],
            
            // Pain and nausea medications
            ['name' => 'Morphine', 'generic_name' => 'Morphine Sulfate', 'strength' => '2mg/mL', 'dosage_form' => 'Injection', 'unit_price' => 5000, 'stock' => 100],
            ['name' => 'Ondansetron', 'generic_name' => 'Ondansetron HCl', 'strength' => '4mg/2mL', 'dosage_form' => 'Injection', 'unit_price' => 3000, 'stock' => 150],
            
            // Common medications
            ['name' => 'Paracetamol', 'generic_name' => 'Acetaminophen', 'strength' => '500mg', 'dosage_form' => 'Tablet', 'unit_price' => 500, 'stock' => 2000],
            ['name' => 'Ibuprofen', 'generic_name' => 'Ibuprofen', 'strength' => '400mg', 'dosage_form' => 'Tablet', 'unit_price' => 600, 'stock' => 1500],
            ['name' => 'Omeprazole', 'generic_name' => 'Omeprazole', 'strength' => '20mg', 'dosage_form' => 'Capsule', 'unit_price' => 1200, 'stock' => 600],
        ];

        foreach ($medications as $medData) {
            Medication::updateOrCreate(
                ['name' => $medData['name']],
                [
                    'id' => Str::uuid(),
                    'generic_name' => $medData['generic_name'],
                    'strength' => $medData['strength'],
                    'dosage_form' => $medData['dosage_form'],
                    'manufacturer' => 'Pharma Solutions Ltd',
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
            'Aspirin' => 'Cardiovascular',
            'Atorvastatin' => 'Cardiovascular',
            'Metoprolol' => 'Cardiovascular',
            'Amoxicillin-Clavulanate' => 'Antibiotic',
            'Albuterol' => 'Respiratory',
            'Morphine' => 'Analgesic',
            'Ondansetron' => 'Antiemetic',
            'Paracetamol' => 'Analgesic',
            'Ibuprofen' => 'NSAID',
            'Omeprazole' => 'GI',
        ];

        return $categories[$name] ?? 'General';
    }
}