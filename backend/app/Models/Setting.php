<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value', 'description'];
    
    protected $casts = [
        'value' => 'string',
    ];
    
    public $incrementing = false;
    protected $keyType = 'string';
    protected $primaryKey = 'key';
}
