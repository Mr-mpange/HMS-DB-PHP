<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Medication extends Model
{
    use HasUuids;

    protected $fillable = [
        'name', 'generic_name', 'category', 'dosage_form', 'strength',
        'manufacturer', 'unit_price', 'stock_quantity', 'quantity_in_stock', 'reorder_level',
        'expiry_date', 'batch_number', 'is_active'
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'expiry_date' => 'date',
        'is_active' => 'boolean',
    ];
}
