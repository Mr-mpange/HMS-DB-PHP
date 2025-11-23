<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class InsuranceCompany extends Model
{
    use HasUuids;
    
    protected $fillable = [
        'name',
        'code',
        'contact_person',
        'phone',
        'email',
        'address',
        'is_active',
    ];
    
    protected $casts = [
        'is_active' => 'boolean',
    ];
}
