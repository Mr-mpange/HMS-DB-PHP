<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Prescription extends Model
{
    use HasUuids;

    protected $fillable = [
        'patient_id', 'doctor_id', 'visit_id', 'prescription_date',
        'diagnosis', 'notes', 'status'
    ];

    protected $casts = [
        'prescription_date' => 'date',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function visit()
    {
        return $this->belongsTo(PatientVisit::class, 'visit_id');
    }

    public function items()
    {
        return $this->hasMany(PrescriptionItem::class);
    }
}
