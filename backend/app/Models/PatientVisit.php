<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PatientVisit extends Model
{
    use HasUuids;

    // Uses patient_visits table by default (Laravel convention)

    protected $fillable = [
        'patient_id', 'doctor_id', 'appointment_id', 'visit_date',
        'chief_complaint', 'diagnosis', 'treatment_plan', 
        'vital_signs', 'notes', 'status',
        // Workflow fields
        'current_stage', 'overall_status',
        'reception_status', 'reception_completed_at',
        'nurse_status', 'nurse_completed_at', 'nurse_notes',
        'doctor_status', 'doctor_completed_at',
        'lab_status', 'lab_completed_at', 'lab_results_reviewed',
        'pharmacy_status', 'pharmacy_completed_at',
        'billing_status', 'billing_completed_at'
    ];

    protected $casts = [
        'visit_date' => 'datetime',
        'vital_signs' => 'array',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class, 'visit_id');
    }

    public function labTests()
    {
        return $this->hasMany(LabTest::class, 'visit_id');
    }
}
