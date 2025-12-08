<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\LabTest;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\User;
use Illuminate\Support\Str;

class TestWorkflow extends Command
{
    protected $signature = 'test:workflow';
    protected $description = 'Test the complete patient workflow from reception to pharmacy';

    public function handle()
    {
        $this->info('');
        $this->info('=== CREATING TEST PATIENT ===');
        
        $patient = Patient::create([
            'id' => Str::uuid(),
            'full_name' => 'Test Workflow Patient',
            'date_of_birth' => '1990-01-01',
            'gender' => 'Male',
            'phone' => '+255700000999',
            'address' => 'Test Address',
            'status' => 'Active'
        ]);

        $doctor = User::first();
        if (!$doctor) {
            $this->error('ERROR: No users found in database!');
            return 1;
        }

        $visit = PatientVisit::create([
            'id' => Str::uuid(),
            'patient_id' => $patient->id,
            'visit_date' => now()->toDateString(),
            'current_stage' => 'doctor',
            'reception_status' => 'Checked In',
            'nurse_status' => 'Completed',
            'doctor_status' => 'Pending',
            'overall_status' => 'Active'
        ]);

        $this->line('✓ Patient: ' . $patient->full_name);
        $this->line('✓ Visit created (Stage: doctor)');
        $this->info('');

        $this->info('=== DOCTOR ORDERS LAB TEST ===');
        $visit->update([
            'current_stage' => 'lab',
            'lab_status' => 'Pending',
            'doctor_status' => 'Pending Review'
        ]);

        $labTest = LabTest::create([
            'id' => Str::uuid(),
            'patient_id' => $visit->patient_id,
            'visit_id' => $visit->id,
            'doctor_id' => $doctor->id,
            'test_name' => 'Complete Blood Count',
            'test_type' => 'Hematology',
            'test_date' => now()->toDateString(),
            'status' => 'Pending',
            'priority' => 'Normal',
            'price' => 15000
        ]);

        $this->line('✓ Lab test ordered: ' . $labTest->test_name);
        $this->line('✓ Visit stage: ' . $visit->current_stage);
        $this->info('');

        $this->info('=== LAB COMPLETES TEST ===');
        $labTest->update([
            'status' => 'Completed',
            'results' => json_encode(['hemoglobin' => '14.5 g/dL', 'wbc' => '7500/μL'])
        ]);

        $visit->update([
            'current_stage' => 'doctor',
            'lab_status' => 'Completed',
            'lab_completed_at' => now(),
            'doctor_status' => 'Pending Review'
        ]);

        $this->line('✓ Lab completed');
        $this->line('✓ Patient back to doctor (Stage: ' . $visit->current_stage . ')');
        $this->info('');

        $this->info('=== DOCTOR WRITES PRESCRIPTION ===');
        $prescription = Prescription::create([
            'id' => Str::uuid(),
            'patient_id' => $visit->patient_id,
            'visit_id' => $visit->id,
            'doctor_id' => $doctor->id,
            'prescription_date' => now()->toDateString(),
            'status' => 'Active'
        ]);

        PrescriptionItem::create([
            'id' => Str::uuid(),
            'prescription_id' => $prescription->id,
            'medication_name' => 'Amoxicillin',
            'dosage' => '500mg',
            'frequency' => '3 times daily',
            'duration' => '7 days',
            'quantity' => 21
        ]);

        $visit->update([
            'current_stage' => 'pharmacy',
            'doctor_status' => 'Completed',
            'doctor_completed_at' => now(),
            'pharmacy_status' => 'Pending'
        ]);

        $this->line('✓ Prescription written');
        $this->line('✓ Patient sent to pharmacy (Stage: ' . $visit->current_stage . ')');
        $this->info('');

        $this->info('=== BILLING SUMMARY ===');
        $this->line('Patient: ' . $visit->patient->full_name);
        $this->line('Visit ID: ' . $visit->id);
        $this->info('');

        $this->line('Services to bill:');
        $this->line('1. Consultation: Already paid at reception ✓');

        $labTests = LabTest::where('visit_id', $visit->id)->get();
        $this->line('2. Lab Tests:');
        foreach($labTests as $test) {
            $this->line('   - ' . $test->test_name . ': TSh ' . number_format($test->price));
        }

        $prescriptions = Prescription::where('visit_id', $visit->id)->with('items')->get();
        $this->line('3. Medications (to be dispensed):');
        foreach($prescriptions as $rx) {
            foreach($rx->items as $item) {
                $this->line('   - ' . $item->medication_name . ' ' . $item->dosage . ' x' . $item->quantity);
            }
        }

        $this->info('');
        $this->info('=== WORKFLOW COMPLETE ===');
        
        return 0;
    }
}
