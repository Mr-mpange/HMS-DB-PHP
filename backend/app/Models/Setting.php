<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'description',
    ];
    
    public $incrementing = false;
    protected $keyType = 'string';
    protected $primaryKey = 'key';
}
