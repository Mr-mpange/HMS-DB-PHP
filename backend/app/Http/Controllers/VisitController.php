<?php

namespace App\Http\Controllers;

use App\Models\PatientVisit;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VisitController extends Controller
{
    public function index(Request $request)
    {
        $query = PatientVisit::with(['patient', 'doctor', 'appointment']);

        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->has('doctor_id')) {
            $query->where('doctor_id', $request->doctor_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
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
            'status' => 'sometimes|in:Active,Completed',
        ]);

        $visit->update($validated);

        return response()->json(['visit' => $visit->load(['patient', 'doctor'])]);
    }

    public function destroy($id)
    {
        $visit = PatientVisit::findOrFail($id);
        $visit->delete();

        return response()->json(['message' => 'Visit deleted successfully']);
    }
}
