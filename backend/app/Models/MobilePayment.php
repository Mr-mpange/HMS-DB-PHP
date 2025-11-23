<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class MobilePayment extends Model
{
    use HasUuids;

    protected $fillable = [
        'patient_id',
        'invoice_id',
        'phone_number',
        'amount',
        'provider',
        'transaction_id',
        'reference_number',
        'status',
        'provider_response',
        'initiated_at',
        'completed_at'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'initiated_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
