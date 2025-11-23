<?php

namespace App\Http\Controllers;

use App\Models\PatientVisit;
use App\Events\PatientVisitUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VisitController extends Controller
{
    public function index(Request $request)
    {
        $query = PatientVisit::with(['patient', 'doctor', 'appointment']);

        // Basic filters
        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->has('doctor_id')) {
            $query->where('doctor_id', $request->doctor_id);
        }

        if ($request->has('appointment_id')) {
            $query->where('appointment_id', $request->appointment_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Workflow stage filters - CRITICAL FIX
        if ($request->has('current_stage')) {
            $query->where('current_stage', $request->current_stage);
        }

        if ($request->has('overall_status')) {
            $query->where('overall_status', $request->overall_status);
        }

        // Stage-specific status filters
        if ($request->has('reception_status')) {
            $query->where('reception_status', $request->reception_status);
        }

        if ($request->has('nurse_status')) {
            $query->where('nurse_status', $request->nurse_status);
        }

        if ($request->has('doctor_status')) {
            $query->where('doctor_status', $request->doctor_status);
        }

        if ($request->has('lab_status')) {
            $query->where('lab_status', $request->lab_status);
        }

        if ($request->has('pharmacy_status')) {
            $query->where('pharmacy_status', $request->pharmacy_status);
        }

        if ($request->has('billing_status')) {
            $query->where('billing_status', $request->billing_status);
        }

        $visits = $query->orderBy('visit_date', 'desc')
                       ->paginate($request->get('limit', 50));

        return response()->json(['visits' => $visits->items(), 'total' => $visits->total()]);
    }

    public function show($id)
    {
        $visit = PatientVisit::with(['patient', 'doctor', 'appointment', 'prescriptions', 'labTests'])
                            ->findOrFail($id);
        return response()->json(['visit' => $visit]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid|exists:patients,id',
            'doctor_id' => 'nullable|exists:users,id',
            'appointment_id' => 'nullable|uuid|exists:appointments,id',
            'visit_date' => 'required|date',
            'chief_complaint' => 'nullable|string',
            'diagnosis' => 'nullable|string',
            'treatment_plan' => 'nullable|string',
            'vital_signs' => 'nullable|array',
            'notes' => 'nullable|string',
            // Workflow fields - CRITICAL FIX
            'current_stage' => 'nullable|string',
            'overall_status' => 'nullable|string',
            'reception_status' => 'nullable|string',
            'nurse_status' => 'nullable|string',
            'doctor_status' => 'nullable|string',
            'lab_status' => 'nullable|string',
            'pharmacy_status' => 'nullable|string',
            'billing_status' => 'nullable|string',
            'reception_completed_at' => 'nullable|date',
            'nurse_completed_at' => 'nullable|date',
            'doctor_completed_at' => 'nullable|date',
            'lab_completed_at' => 'nullable|date',
            'pharmacy_completed_at' => 'nullable|date',
            'billing_completed_at' => 'nullable|date',
        ]);

        $validated['id'] = (string) Str::uuid();
        $visit = PatientVisit::create($validated);

        return response()->json(['visit' => $visit->load(['patient', 'doctor'])], 201);
    }

    public function update(Request $request, $id)
    {
        $visit = PatientVisit::findOrFail($id);

        $validated = $request->validate([
            'chief_complaint' => 'nullable|string',
            'diagnosis' => 'nullable|string',
            'treatment_plan' => 'nullable|string',
            'vital_signs' => 'nullable|array',
            'notes' => 'nullable|string',
            'nurse_notes' => 'nullable|string',
            'doctor_notes' => 'nullable|string',
            'lab_notes' => 'nullable|string',
            'status' => 'sometimes|in:Active,Completed',
            // Workflow fields
            'current_stage' => 'sometimes|string',
            'overall_status' => 'sometimes|string',
            'reception_status' => 'sometimes|string',
            'nurse_status' => 'sometimes|string',
            'doctor_status' => 'sometimes|string',
            'lab_status' => 'sometimes|string',
            'pharmacy_status' => 'sometimes|string',
            'billing_status' => 'sometimes|string',
            'reception_completed_at' => 'sometimes|date',
            'nurse_completed_at' => 'sometimes|date',
            'doctor_completed_at' => 'sometimes|date',
            'lab_completed_at' => 'sometimes|date',
            'pharmacy_completed_at' => 'sometimes|date',
            'billing_completed_at' => 'sometimes|date',
        ]);

        $visit->update($validated);

        // Broadcast real-time update via WebSocket
        broadcast(new PatientVisitUpdated($visit, 'updated'))->toOthers();

        // Emit socket event for real-time updates (legacy support)
        try {
            \App\Helpers\SocketHelper::visitUpdated($visit);
        } catch (\Exception $e) {
            \Log::warning('Failed to emit socket event: ' . $e->getMessage());
        }

        return response()->json(['visit' => $visit->load(['patient', 'doctor'])]);
    }

    public function destroy($id)
    {
        $visit = PatientVisit::findOrFail($id);
        $visit->delete();

        return response()->json(['message' => 'Visit deleted successfully']);
    }
}
