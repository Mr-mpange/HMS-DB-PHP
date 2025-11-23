<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Events\AppointmentUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class OptimizedAppointmentController extends Controller
{
    /**
     * Get paginated appointments with caching
     */
    public function index(Request $request)
    {
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 20);
        $doctorId = $request->get('doctor_id');
        $status = $request->get('status');
        $date = $request->get('date');

        // Create cache key
        $cacheKey = "appointments:{$doctorId}:{$status}:{$date}:page:{$page}:{$perPage}";

        // Cache for 30 seconds
        $result = Cache::remember($cacheKey, 30, function () use ($request, $perPage) {
            $query = Appointment::query()
                ->select([
                    'id',
                    'patient_id',
                    'doctor_id',
                    'department_id',
                    'appointment_date',
                    'duration',
                    'type',
                    'status',
                    'reason',
                    'created_at',
                    'updated_at'
                ])
                ->with([
                    'patient:id,full_name,phone,date_of_birth',
                    'doctor:id,name',
                    'department:id,name'
                ]);

            // Apply filters
            if ($request->has('doctor_id')) {
                $query->where('doctor_id', $request->doctor_id);
            }

            if ($request->has('patient_id')) {
                $query->where('patient_id', $request->patient_id);
            }

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('date')) {
                $query->whereDate('appointment_date', $request->date);
            }

            // Order by appointment date
            $query->orderBy('appointment_date', 'asc');

            return $query->paginate($perPage);
        });

        return response()->json([
            'appointments' => $result->items(),
            'pagination' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
                'from' => $result->firstItem(),
                'to' => $result->lastItem(),
            ]
        ]);
    }

    /**
     * Get appointment counts - heavily cached
     */
    public function counts(Request $request)
    {
        $doctorId = $request->get('doctor_id');
        $cacheKey = "appointment_counts:{$doctorId}";

        // Cache for 60 seconds
        $counts = Cache::remember($cacheKey, 60, function () use ($doctorId) {
            $query = Appointment::query();

            if ($doctorId) {
                $query->where('doctor_id', $doctorId);
            }

            $today = now()->toDateString();

            return [
                'total' => $query->count(),
                'today' => $query->whereDate('appointment_date', $today)->count(),
                'scheduled' => $query->where('status', 'Scheduled')->count(),
                'confirmed' => $query->where('status', 'Confirmed')->count(),
                'completed' => $query->where('status', 'Completed')->count(),
                'today_scheduled' => $query->whereDate('appointment_date', $today)
                    ->where('status', 'Scheduled')
                    ->count(),
            ];
        });

        return response()->json($counts);
    }

    /**
     * Update appointment and invalidate cache
     */
    public function update(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);

        $validated = $request->validate([
            'appointment_date' => 'sometimes|date',
            'duration' => 'nullable|integer',
            'type' => 'nullable|string|max:50',
            'status' => 'sometimes|in:Scheduled,Confirmed,In Progress,Completed,Cancelled',
            'reason' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $appointment->update($validated);

        // Invalidate relevant caches
        $this->invalidateAppointmentCaches($appointment);

        // Broadcast real-time update
        broadcast(new AppointmentUpdated($appointment, 'updated'))->toOthers();

        return response()->json([
            'appointment' => $appointment->load(['patient:id,full_name', 'doctor:id,name', 'department:id,name'])
        ]);
    }

    /**
     * Invalidate all relevant caches for an appointment
     */
    private function invalidateAppointmentCaches($appointment)
    {
        Cache::forget("appointments:{$appointment->doctor_id}:*");
        Cache::forget("appointment_counts:{$appointment->doctor_id}");
        Cache::forget("appointment_counts:null");
    }
}
