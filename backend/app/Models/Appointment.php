<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Appointment extends Model
{
    use HasUuids;

    protected $fillable = [
        'patient_id', 'doctor_id', 'department_id', 'appointment_date',
        'duration', 'type', 'status', 'reason', 'notes'
    ];

    protected $casts = [
        'appointment_date' => 'datetime',
    ];

    protected $appends = ['appointment_date_only', 'appointment_time'];

    public function getAppointmentDateOnlyAttribute()
    {
        if (!$this->appointment_date) {
            return null;
        }
        // Return just the date part in Y-m-d format
        return $this->appointment_date->format('Y-m-d');
    }

    public function getAppointmentTimeAttribute()
    {
        if (!$this->appointment_date) {
            return null;
        }
        // Return just the time part in H:i format (24-hour)
        return $this->appointment_date->format('H:i');
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function visit()
    {
        return $this->hasOne(PatientVisit::class);
    }
}
