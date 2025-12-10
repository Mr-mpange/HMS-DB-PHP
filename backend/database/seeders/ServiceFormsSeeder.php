<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MedicalService;

class ServiceFormsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // COVID-19 Vaccination Form
        $covidService = MedicalService::where('service_name', 'like', '%COVID%')
            ->orWhere('service_name', 'like', '%Vaccination%')
            ->first();
            
        if ($covidService) {
            $covidService->update([
                'requires_form' => true,
                'form_template' => [
                    'title' => 'COVID-19 Vaccination Record',
                    'fields' => [
                        [
                            'name' => 'vaccine_name',
                            'label' => 'Vaccine Name',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['Pfizer-BioNTech', 'Moderna', 'AstraZeneca', 'Johnson & Johnson', 'Sinopharm']
                        ],
                        [
                            'name' => 'batch_number',
                            'label' => 'Batch/Lot Number',
                            'type' => 'text',
                            'required' => true,
                            'placeholder' => 'Enter batch number'
                        ],
                        [
                            'name' => 'dose_number',
                            'label' => 'Dose Number',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['1st Dose', '2nd Dose', 'Booster Dose']
                        ],
                        [
                            'name' => 'injection_site',
                            'label' => 'Injection Site',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['Left Arm (Deltoid)', 'Right Arm (Deltoid)', 'Left Thigh', 'Right Thigh']
                        ],
                        [
                            'name' => 'expiry_date',
                            'label' => 'Vaccine Expiry Date',
                            'type' => 'date',
                            'required' => true
                        ],
                        [
                            'name' => 'adverse_reactions',
                            'label' => 'Adverse Reactions (if any)',
                            'type' => 'textarea',
                            'required' => false,
                            'placeholder' => 'Note any immediate reactions observed',
                            'rows' => 3
                        ],
                        [
                            'name' => 'next_dose_date',
                            'label' => 'Next Dose Due Date',
                            'type' => 'date',
                            'required' => false
                        ]
                    ]
                ]
            ]);
        }

        // Wound Dressing Form
        $woundService = MedicalService::where('service_name', 'like', '%Wound%')
            ->orWhere('service_name', 'like', '%Dressing%')
            ->first();
            
        if ($woundService) {
            $woundService->update([
                'requires_form' => true,
                'form_template' => [
                    'title' => 'Wound Dressing Record',
                    'fields' => [
                        [
                            'name' => 'wound_location',
                            'label' => 'Wound Location',
                            'type' => 'text',
                            'required' => true,
                            'placeholder' => 'e.g., Left leg, 5cm below knee'
                        ],
                        [
                            'name' => 'wound_size_length',
                            'label' => 'Wound Length (cm)',
                            'type' => 'number',
                            'required' => true
                        ],
                        [
                            'name' => 'wound_size_width',
                            'label' => 'Wound Width (cm)',
                            'type' => 'number',
                            'required' => true
                        ],
                        [
                            'name' => 'wound_type',
                            'label' => 'Wound Type',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['Surgical', 'Traumatic', 'Burn', 'Pressure Ulcer', 'Diabetic Ulcer', 'Other']
                        ],
                        [
                            'name' => 'wound_condition',
                            'label' => 'Wound Condition',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['Clean', 'Infected', 'Healing', 'Deteriorating']
                        ],
                        [
                            'name' => 'dressing_type',
                            'label' => 'Dressing Type Applied',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['Gauze', 'Hydrocolloid', 'Foam', 'Transparent Film', 'Alginate', 'Hydrogel']
                        ],
                        [
                            'name' => 'wound_notes',
                            'label' => 'Additional Notes',
                            'type' => 'textarea',
                            'required' => false,
                            'placeholder' => 'Describe wound appearance, drainage, etc.',
                            'rows' => 4
                        ],
                        [
                            'name' => 'next_dressing_date',
                            'label' => 'Next Dressing Change Date',
                            'type' => 'date',
                            'required' => true
                        ]
                    ]
                ]
            ]);
        }

        // IV Drip Form
        $ivService = MedicalService::where('service_name', 'like', '%IV%')
            ->orWhere('service_name', 'like', '%Drip%')
            ->first();
            
        if ($ivService) {
            $ivService->update([
                'requires_form' => true,
                'form_template' => [
                    'title' => 'IV Drip Administration Record',
                    'fields' => [
                        [
                            'name' => 'fluid_type',
                            'label' => 'Fluid Type',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['Normal Saline (0.9% NaCl)', 'Dextrose 5%', 'Dextrose 10%', 'Ringers Lactate', 'Dextrose Saline']
                        ],
                        [
                            'name' => 'volume',
                            'label' => 'Volume (ml)',
                            'type' => 'number',
                            'required' => true,
                            'placeholder' => 'e.g., 500'
                        ],
                        [
                            'name' => 'drip_rate',
                            'label' => 'Drip Rate (drops/min)',
                            'type' => 'number',
                            'required' => true,
                            'placeholder' => 'e.g., 20'
                        ],
                        [
                            'name' => 'insertion_site',
                            'label' => 'IV Insertion Site',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['Left Hand', 'Right Hand', 'Left Forearm', 'Right Forearm', 'Left Antecubital', 'Right Antecubital']
                        ],
                        [
                            'name' => 'cannula_size',
                            'label' => 'Cannula Size',
                            'type' => 'select',
                            'required' => true,
                            'options' => ['18G', '20G', '22G', '24G']
                        ],
                        [
                            'name' => 'start_time',
                            'label' => 'Start Time',
                            'type' => 'time',
                            'required' => true
                        ],
                        [
                            'name' => 'observations',
                            'label' => 'Observations',
                            'type' => 'textarea',
                            'required' => false,
                            'placeholder' => 'Patient tolerance, site condition, etc.',
                            'rows' => 3
                        ]
                    ]
                ]
            ]);
        }
    }
}