<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Appointment::with(['patient', 'doctor', 'department']);

        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->has('doctor_id')) {
            $query->where('doctor_id', $request->doctor_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date')) {
            $query->whereDate('appointment_date', $request->date);
        }

        $appointments = $query->orderBy('appointment_date', 'asc')
                             ->paginate($request->get('limit', 50));

        return response()->json(['appointments' => $appointments->items(), 'total' => $appointments->total()]);
    }

    public function show($id)
    {
        $appointment = Appointment::with(['patient', 'doctor', 'department', 'visit'])
                                  ->findOrFail($id);
        return response()->json(['appointment' => $appointment]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid|exists:patients,id',
            'doctor_id' => 'required|exists:users,id',
            'department_id' => 'nullable|uuid|exists:departments,id',
            'appointment_date' => 'required|date',
            'duration' => 'nullable|integer',
            'type' => 'nullable|string|max:50',
            'reason' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $validated['id'] = (string) Str::uuid();
        $validated['status'] = 'Scheduled';
        
        $appointment = Appointment::create($validated);

        return response()->json(['appointment' => $appointment->load(['patient', 'doctor', 'department'])], 201);
    }

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

        return response()->json(['appointment' => $appointment->load(['patient', 'doctor', 'department'])]);
    }

    public function destroy($id)
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->delete();

        return response()->json(['message' => 'Appointment deleted successfully']);
    }
}
