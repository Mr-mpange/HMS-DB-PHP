<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PrescriptionItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'prescription_id', 'medication_name', 'dosage', 
        'frequency', 'duration', 'quantity', 'instructions'
    ];

    public function prescription()
    {
        return $this->belongsTo(Prescription::class);
    }
}
