<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SystemSetting extends Model
{
    use HasUuids;

    protected $fillable = [
        'setting_key', 'setting_value', 'description'
    ];
}
