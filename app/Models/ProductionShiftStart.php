<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionShiftStart extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'position',
        'started_at',
        'shift',
        'lot_id',
        'evidence_path',
    ];

    protected $casts = [
        'started_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lot()
    {
        return $this->belongsTo(Lot::class);
    }

    public function activities()
    {
        return $this->hasMany(ProductionShiftActivity::class);
    }
}
