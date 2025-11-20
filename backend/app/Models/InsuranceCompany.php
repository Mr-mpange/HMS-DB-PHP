<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class InsuranceCompany extends Model
{
    use HasUuids;

    protected $table = 'insurance_companies';

    protected $fillable = [
        'name', 'contact_person', 'phone', 'email', 'address', 'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function claims()
    {
        return $this->hasMany(InsuranceClaim::class);
    }
}
