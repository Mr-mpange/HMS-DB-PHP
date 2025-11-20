<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class MedicalService extends Model
{
    use HasUuids;

    protected $fillable = [
        'service_code', 'service_name', 'service_type', 
        'description', 'base_price', 'currency', 'is_active'
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function patientServices()
    {
        return $this->hasMany(PatientService::class, 'service_id');
    }
}
