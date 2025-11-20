<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Department extends Model
{
    use HasUuids;

    protected $fillable = [
        'name', 'description', 'head_doctor_id', 
        'consultation_fee', 'is_active'
    ];

    protected $casts = [
        'consultation_fee' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function headDoctor()
    {
        return $this->belongsTo(User::class, 'head_doctor_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }
}
