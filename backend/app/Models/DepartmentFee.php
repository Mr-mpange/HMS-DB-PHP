<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DepartmentFee extends Model
{
    use HasUuids;
    
    protected $fillable = [
        'department_id',
        'fee_amount',
    ];
    
    protected $casts = [
        'fee_amount' => 'decimal:2',
    ];
    
    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
