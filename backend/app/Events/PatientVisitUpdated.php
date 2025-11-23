<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PatientVisitUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $visit;
    public $action;

    /**
     * Create a new event instance.
     */
    public function __construct($visit, $action = 'updated')
    {
        $this->visit = $visit;
        $this->action = $action;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('doctor-queue'),
            new Channel('nurse-queue'),
            new Channel('lab-queue'),
            new Channel('pharmacy-queue'),
            new Channel('billing-queue'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'visit.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'visit_id' => $this->visit->id,
            'patient_id' => $this->visit->patient_id,
            'current_stage' => $this->visit->current_stage,
            'action' => $this->action,
            'timestamp' => now()->toISOString(),
        ];
    }
}
