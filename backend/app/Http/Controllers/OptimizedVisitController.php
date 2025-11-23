<?php

namespace App\Http\Controllers;

use App\Models\PatientVisit;
use App\Events\PatientVisitUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class OptimizedVisitController extends Controller
{
    /**
     * Get paginated visits with caching
     * Optimized to fetch only required data
     */
    public function index(Request $request)
    {
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 20);
        $stage = $request->get('current_stage');
        $status = $request->get('doctor_status');
        $doctorId = $request->get('doctor_id');

        // Create cache key based on query parameters
        $cacheKey = "visits:{$stage}:{$status}:{$doctorId}:page:{$page}:{$perPage}";

        // Cache for 30 seconds
        $result = Cache::remember($cacheKey, 30, function () use ($request, $perPage) {
            $query = PatientVisit::query()
                ->select([
                    'id',
                    'patient_id',
                    'doctor_id',
                    'appointment_id',
                    'visit_date',
                    'current_stage',
                    'overall_status',
                    'doctor_status',
                    'nurse_status',
                    'lab_status',
                    'pharmacy_status',
                    'created_at',
                    'updated_at'
                ])
                ->with([
                    'patient:id,full_name,phone,date_of_birth,gender',
                    'doctor:id,name,email'
                ]);

            // Apply filters
            if ($request->has('current_stage')) {
                $query->where('current_stage', $request->current_stage);
            }

            if ($request->has('doctor_status')) {
                $query->where('doctor_status', $request->doctor_status);
            }

            if ($request->has('doctor_id')) {
                $query->where('doctor_id', $request->doctor_id);
            }

            if ($request->has('overall_status')) {
                $query->where('overall_status', $request->overall_status);
            }

            // Order by most recent first
            $query->orderBy('created_at', 'desc');

            return $query->paginate($perPage);
        });

        return response()->json([
            'visits' => $result->items(),
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
     * Get visit counts (for stats) - heavily cached
     */
    public function counts(Request $request)
    {
        $doctorId = $request->get('doctor_id');
        $cacheKey = "visit_counts:{$doctorId}";

        // Cache for 60 seconds
        $counts = Cache::remember($cacheKey, 60, function () use ($doctorId) {
            $query = PatientVisit::query();

            if ($doctorId) {
                $query->where('doctor_id', $doctorId);
            }

            return [
                'total' => $query->count(),
                'active' => $query->where('overall_status', 'Active')->count(),
                'completed' => $query->where('overall_status', 'Completed')->count(),
                'by_stage' => [
                    'reception' => $query->where('current_stage', 'reception')->count(),
                    'nurse' => $query->where('current_stage', 'nurse')->count(),
                    'doctor' => $query->where('current_stage', 'doctor')->count(),
                    'lab' => $query->where('current_stage', 'lab')->count(),
                    'pharmacy' => $query->where('current_stage', 'pharmacy')->count(),
                    'billing' => $query->where('current_stage', 'billing')->count(),
                ],
                'doctor_pending' => $query->where('current_stage', 'doctor')
                    ->where('doctor_status', 'Pending')
                    ->count(),
            ];
        });

        return response()->json($counts);
    }

    /**
     * Update visit and invalidate cache
     */
    public function update(Request $request, $id)
    {
        $visit = PatientVisit::findOrFail($id);

        $validated = $request->validate([
            'chief_complaint' => 'nullable|string',
            'diagnosis' => 'nullable|string',
            'treatment_plan' => 'nullable|string',
            'vital_signs' => 'nullable|array',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:Active,Completed',
            'current_stage' => 'sometimes|string',
            'overall_status' => 'sometimes|string',
            'nurse_status' => 'sometimes|string',
            'doctor_status' => 'sometimes|string',
            'lab_status' => 'sometimes|string',
            'pharmacy_status' => 'sometimes|string',
        ]);

        $visit->update($validated);

        // Invalidate relevant caches
        $this->invalidateVisitCaches($visit);

        // Broadcast real-time update
        broadcast(new PatientVisitUpdated($visit, 'updated'))->toOthers();

        return response()->json([
            'visit' => $visit->load(['patient:id,full_name,phone', 'doctor:id,name'])
        ]);
    }

    /**
     * Invalidate all relevant caches for a visit
     */
    private function invalidateVisitCaches($visit)
    {
        // Clear all visit list caches
        Cache::forget("visits:{$visit->current_stage}:*");
        Cache::forget("visit_counts:{$visit->doctor_id}");
        Cache::forget("visit_counts:null");
        
        // Clear specific cache patterns
        $stages = ['reception', 'nurse', 'doctor', 'lab', 'pharmacy', 'billing'];
        foreach ($stages as $stage) {
            Cache::forget("visits:{$stage}:*");
        }
    }
}
