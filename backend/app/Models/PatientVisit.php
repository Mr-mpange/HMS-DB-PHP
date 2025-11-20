<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PatientVisit extends Model
{
    use HasUuids;

    protected $fillable = [
        'patient_id', 'doctor_id', 'appointment_id', 'visit_date',
        'chief_complaint', 'diagnosis', 'treatment_plan', 
        'vital_signs', 'notes', 'status'
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
