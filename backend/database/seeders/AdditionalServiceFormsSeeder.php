<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MedicalService;

class AdditionalServiceFormsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🩺 Adding forms to additional services...');

        // Injection Form
        $injectionService = MedicalService::where('service_name', 'Injection')->first();
        if ($injectionService) {
            $injectionService->update([
                'requires_form' => true,
                'form_template' => [
                    'title' => 'Injection Administration Record',
                    'fields' => [
                        [
                            'name' => 'medication_name',
                            'label' => 'Medication Name',
                            'type' => 'text',
                            'required' => true,
                            'placeholder' => 'e.g., Vitamin B12, Antibiotics'
                        ],
                        [
                            'name' => 'dosage',
                            'label' => 'Dosage',
                            'type' => 'text',
                            'required' => true,
                            'placeholder' => 'e.g., 1ml, 2mg'
                        ],
                        [
                            'name' => 'injection_type',
                            'label' => 'Injection Type',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['Intramuscular (IM)', 'Intravenous (IV)', 'Subcutaneous (SC)', 'Intradermal (ID)']
                        ],
                        [
                            'name' => 'injection_site',
                            'label' => 'Injection Site',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['Left Deltoid', 'Right Deltoid', 'Left Thigh', 'Right Thigh', 'Left Gluteal', 'Right Gluteal', 'Abdomen']
                        ],
                        [
                            'name' => 'batch_number',
                            'label' => 'Medication Batch Number',
                            'type' => 'text',
                            'required' => false,
                            'placeholder' => 'Enter batch/lot number if available'
                        ],
                        [
                            'name' => 'expiry_date',
                            'label' => 'Medication Expiry Date',
                            'type' => 'date',
                            'required' => false
                        ],
                        [
                            'name' => 'patient_reaction',
                            'label' => 'Patient Reaction',
                            'type' => 'textarea',
                            'required' => false,
                            'placeholder' => 'Note any immediate reactions or patient response',
                            'rows' => 3
                        ]
                    ]
                ]
            ]);
            $this->command->info('✅ Added form to Injection service');
        }

        // Blood Pressure Check Form
        $bpService = MedicalService::where('service_name', 'Blood Pressure Check')->first();
        if ($bpService) {
            $bpService->update([
                'requires_form' => true,
                'form_template' => [
                    'title' => 'Blood Pressure Measurement Record',
                    'fields' => [
                        [
                            'name' => 'systolic_pressure',
                            'label' => 'Systolic Pressure (mmHg)',
                            'type' => 'number',
                            'required' => true,
                            'placeholder' => 'e.g., 120'
                        ],
                        [
                            'name' => 'diastolic_pressure',
                            'label' => 'Diastolic Pressure (mmHg)',
                            'type' => 'number',
                            'required' => true,
                            'placeholder' => 'e.g., 80'
                        ],
                        [
                            'name' => 'heart_rate',
                            'label' => 'Heart Rate (bpm)',
                            'type' => 'number',
                            'required' => true,
                            'placeholder' => 'e.g., 72'
                        ],
                        [
                            'name' => 'measurement_position',
                            'label' => 'Patient Position During Measurement',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['Sitting', 'Standing', 'Lying Down']
                        ],
                        [
                            'name' => 'arm_used',
                            'label' => 'Arm Used for Measurement',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['Left Arm', 'Right Arm']
                        ],
                        [
                            'name' => 'cuff_size',
                            'label' => 'Cuff Size',
                            'type' => 'select',
                            'required' => false,
                            'options' => ['Adult', 'Large Adult', 'Pediatric', 'Small Adult']
                        ],
                        [
                            'name' => 'bp_category',
                            'label' => 'Blood Pressure Category',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['Normal (<120/80)', 'Elevated (120-129/<80)', 'Stage 1 Hypertension (130-139/80-89)', 'Stage 2 Hypertension (≥140/90)', 'Hypotension (<90/60)']
                        ],
                        [
                            'name' => 'notes',
                            'label' => 'Additional Notes',
                            'type' => 'textarea',
                            'required' => false,
                            'placeholder' => 'Any observations or patient symptoms',
                            'rows' => 3
                        ]
                    ]
                ]
            ]);
            $this->command->info('✅ Added form to Blood Pressure Check service');
        }

        // Suturing Form
        $suturingService = MedicalService::where('service_name', 'Suturing')->first();
        if ($suturingService) {
            $suturingService->update([
                'requires_form' => true,
                'form_template' => [
                    'title' => 'Suturing Procedure Record',
                    'fields' => [
                        [
                            'name' => 'wound_location',
                            'label' => 'Wound Location',
                            'type' => 'text',
                            'required' => true,
                            'placeholder' => 'e.g., Forehead, 3cm above left eyebrow'
                        ],
                        [
                            'name' => 'wound_length',
                            'label' => 'Wound Length (cm)',
                            'type' => 'number',
                            'required' => true,
                            'step' => '0.1'
                        ],
                        [
                            'name' => 'wound_depth',
                            'label' => 'Wound Depth',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['Superficial (skin only)', 'Partial thickness', 'Full thickness', 'Deep (involving muscle/bone)']
                        ],
                        [
                            'name' => 'suture_type',
                            'label' => 'Suture Material',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['Silk', 'Nylon', 'Polypropylene', 'Absorbable (Vicryl)', 'Absorbable (PDS)']
                        ],
                        [
                            'name' => 'suture_size',
                            'label' => 'Suture Size',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['2-0', '3-0', '4-0', '5-0', '6-0']
                        ],
                        [
                            'name' => 'number_of_sutures',
                            'label' => 'Number of Sutures',
                            'type' => 'number',
                            'required' => true
                        ],
                        [
                            'name' => 'anesthesia_used',
                            'label' => 'Local Anesthesia Used',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['None', 'Lidocaine 1%', 'Lidocaine 2%', 'Bupivacaine']
                        ],
                        [
                            'name' => 'wound_cleaning',
                            'label' => 'Wound Cleaning Method',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['Normal Saline', 'Betadine', 'Hydrogen Peroxide', 'Chlorhexidine']
                        ],
                        [
                            'name' => 'suture_removal_date',
                            'label' => 'Suture Removal Date',
                            'type' => 'date',
                            'required' => true
                        ],
                        [
                            'name' => 'post_care_instructions',
                            'label' => 'Post-Care Instructions Given',
                            'type' => 'textarea',
                            'required' => false,
                            'placeholder' => 'Instructions given to patient for wound care',
                            'rows' => 4
                        ]
                    ]
                ]
            ]);
            $this->command->info('✅ Added form to Suturing service');
        }

        $this->command->info('🎉 Additional service forms added successfully!');
    }
}