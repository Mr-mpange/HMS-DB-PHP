<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Department::with('headDoctor');

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $departments = $query->orderBy('name')->get();

        return response()->json(['departments' => $departments]);
    }

    public function show($id)
    {
        $department = Department::with('headDoctor')->findOrFail($id);
        return response()->json(['department' => $department]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'head_doctor_id' => 'nullable|uuid|exists:users,id',
            'consultation_fee' => 'nullable|numeric|min:0',
        ]);

        $validated['id'] = (string) Str::uuid();
        $department = Department::create($validated);

        return response()->json(['department' => $department], 201);
    }

    public function update(Request $request, $id)
    {
        $department = Department::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'head_doctor_id' => 'nullable|uuid|exists:users,id',
            'consultation_fee' => 'nullable|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $department->update($validated);

        return response()->json(['department' => $department]);
    }

    public function destroy($id)
    {
        $department = Department::findOrFail($id);
        $department->delete();

        return response()->json(['message' => 'Department deleted successfully']);
    }
}
