<?php

namespace App\Http\Controllers;

use App\Models\MedicalService;
use App\Models\PatientService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $query = MedicalService::query();

        if ($request->has('service_type')) {
            $query->where('service_type', $request->service_type);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $services = $query->orderBy('service_name')->get();

        return response()->json(['services' => $services]);
    }

    public function show($id)
    {
        $service = MedicalService::findOrFail($id);
        return response()->json(['service' => $service]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_code' => 'required|string|max:50|unique:medical_services',
            'service_name' => 'required|string|max:255',
            'service_type' => 'required|string|max:100',
            'description' => 'nullable|string',
            'base_price' => 'required|numeric|min:0',
            'currency' => 'nullable|string|max:10',
        ]);

        $validated['id'] = (string) Str::uuid();
        $service = MedicalService::create($validated);

        return response()->json(['service' => $service], 201);
    }

    public function update(Request $request, $id)
    {
        $service = MedicalService::findOrFail($id);

        $validated = $request->validate([
            'service_name' => 'sometimes|string|max:255',
            'service_type' => 'sometimes|string|max:100',
            'description' => 'nullable|string',
            'base_price' => 'sometimes|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $service->update($validated);

        return response()->json(['service' => $service]);
    }

    public function destroy($id)
    {
        $service = MedicalService::findOrFail($id);
        $service->delete();

        return response()->json(['message' => 'Service deleted successfully']);
    }

    // Patient Services
    public function assignToPatient(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid|exists:patients,id',
            'service_id' => 'required|uuid|exists:medical_services,id',
            'quantity' => 'nullable|integer|min:1',
            'service_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $service = MedicalService::findOrFail($validated['service_id']);
        
        $validated['id'] = (string) Str::uuid();
        $validated['unit_price'] = $service->base_price;
        $validated['total_price'] = $service->base_price * ($validated['quantity'] ?? 1);
        $validated['created_by'] = auth()->id();

        $patientService = PatientService::create($validated);

        return response()->json(['patient_service' => $patientService->load('service')], 201);
    }

    public function getPatientServices(Request $request, $patientId)
    {
        $services = PatientService::with('service')
                                  ->where('patient_id', $patientId)
                                  ->orderBy('service_date', 'desc')
                                  ->get();

        return response()->json(['services' => $services]);
    }
}
