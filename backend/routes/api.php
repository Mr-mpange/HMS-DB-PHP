<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\VisitController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\PaymentController;

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// ZenoPay Webhook (public - no auth required)
Route::post('/payments/zenopay/callback', [\App\Http\Controllers\ZenoPayController::class, 'handleCallback']);

// Health check
Route::get('/health', function () {
    try {
        \DB::connection()->getPdo();
        return response()->json(['status' => 'ok', 'database' => 'connected']);
    } catch (\Exception $e) {
        return response()->json(['status' => 'error', 'database' => 'disconnected'], 500);
    }
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    
    // Patients
    Route::get('/patients', [PatientController::class, 'index']);
    Route::get('/patients/{id}', [PatientController::class, 'show']);
    Route::post('/patients', [PatientController::class, 'store']);
    Route::put('/patients/{id}', [PatientController::class, 'update']);
    Route::delete('/patients/{id}', [PatientController::class, 'destroy']);
    
    // Patient Search
    Route::get('/patients/search', function(Request $request) {
        $query = \App\Models\Patient::query();
        
        if ($request->has('query')) {
            $searchTerm = $request->query;
            $query->where(function($q) use ($searchTerm) {
                $q->where('full_name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('phone', 'like', '%' . $searchTerm . '%')
                  ->orWhere('email', 'like', '%' . $searchTerm . '%');
            });
        }
        
        $patients = $query->limit(20)->get();
        return response()->json(['patients' => $patients]);
    });
    
    // Appointments
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::get('/appointments/{id}', [AppointmentController::class, 'show']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::put('/appointments/{id}', [AppointmentController::class, 'update']);
    Route::delete('/appointments/{id}', [AppointmentController::class, 'destroy']);
    
    // Departments
    Route::get('/departments', [DepartmentController::class, 'index']);
    
    // Department Fees (must be before {id} route)
    Route::get('/departments/fees', function(Request $request) {
        $fees = \App\Models\DepartmentFee::with('department')->get();
        return response()->json(['fees' => $fees]);
    });
    
    Route::post('/departments/fees', function(Request $request) {
        $request->validate([
            'department_id' => 'required|exists:departments,id',
            'fee_amount' => 'required|numeric|min:0'
        ]);
        
        $fee = \App\Models\DepartmentFee::updateOrCreate(
            ['department_id' => $request->department_id],
            ['fee_amount' => $request->fee_amount]
        );
        
        return response()->json(['success' => true, 'fee' => $fee]);
    });
    
    Route::get('/departments/{id}/doctors', function(Request $request, $id) {
        $doctors = \App\Models\User::where('role', 'doctor')
            ->where('department_id', $id)
            ->get();
        return response()->json(['doctors' => $doctors]);
    });
    
    Route::post('/departments/{id}/doctors', function(Request $request, $id) {
        $request->validate([
            'doctor_id' => 'required|exists:users,id'
        ]);
        
        $doctor = \App\Models\User::findOrFail($request->doctor_id);
        
        // Verify the user is a doctor
        if ($doctor->role !== 'doctor') {
            return response()->json(['error' => 'User is not a doctor'], 400);
        }
        
        $doctor->department_id = $id;
        $doctor->save();
        
        return response()->json(['success' => true, 'doctor' => $doctor]);
    });
    
    Route::delete('/departments/{id}/doctors', function(Request $request, $id) {
        $request->validate([
            'doctor_id' => 'required|exists:users,id'
        ]);
        
        $doctor = \App\Models\User::findOrFail($request->doctor_id);
        $doctor->department_id = null;
        $doctor->save();
        
        return response()->json(['success' => true, 'doctor' => $doctor]);
    });
    
    Route::get('/departments/{id}', [DepartmentController::class, 'show']);
    Route::post('/departments', [DepartmentController::class, 'store']);
    Route::put('/departments/{id}', [DepartmentController::class, 'update']);
    Route::delete('/departments/{id}', [DepartmentController::class, 'destroy']);
    
    // Visits
    Route::get('/visits', [VisitController::class, 'index']);
    Route::get('/visits/{id}', [VisitController::class, 'show']);
    Route::post('/visits', [VisitController::class, 'store']);
    Route::put('/visits/{id}', [VisitController::class, 'update']);
    Route::delete('/visits/{id}', [VisitController::class, 'destroy']);
    
    // Prescriptions
    Route::get('/prescriptions', [PrescriptionController::class, 'index']);
    Route::get('/prescriptions/{id}', [PrescriptionController::class, 'show']);
    Route::post('/prescriptions', [PrescriptionController::class, 'store']);
    Route::put('/prescriptions/{id}', [PrescriptionController::class, 'update']);
    Route::delete('/prescriptions/{id}', [PrescriptionController::class, 'destroy']);
    
    // Prescriptions Batch
    Route::post('/prescriptions/batch', function(Request $request) {
        $request->validate([
            'prescriptions' => 'required|array',
        ]);
        
        $created = [];
        foreach ($request->prescriptions as $prescData) {
            $prescription = \App\Models\Prescription::create([
                'id' => \Illuminate\Support\Str::uuid(),
                ...$prescData
            ]);
            $created[] = $prescription;
        }
        
        return response()->json(['prescriptions' => $created, 'count' => count($created)], 201);
    });
    
    // Services
    Route::get('/services', [ServiceController::class, 'index']);
    Route::get('/services/{id}', [ServiceController::class, 'show']);
    Route::post('/services', [ServiceController::class, 'store']);
    Route::put('/services/{id}', [ServiceController::class, 'update']);
    Route::delete('/services/{id}', [ServiceController::class, 'destroy']);
    Route::post('/services/assign', [ServiceController::class, 'assignToPatient']);
    Route::get('/patients/{patientId}/services', [ServiceController::class, 'getPatientServices']);
    
    // Payments
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::get('/payments/{id}', [PaymentController::class, 'show']);
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::delete('/payments/{id}', [PaymentController::class, 'destroy']);
    
    // ZenoPay Integration
    Route::post('/payments/zenopay/initiate', [\App\Http\Controllers\ZenoPayController::class, 'initiatePayment']);
    Route::post('/payments/zenopay/verify', [\App\Http\Controllers\ZenoPayController::class, 'verifyPayment']);
    Route::get('/payments/zenopay/status/{reference}', [\App\Http\Controllers\ZenoPayController::class, 'getPaymentStatus']);
    
    // Users (admin endpoints)
    Route::get('/users', function(Request $request) {
        $users = \App\Models\User::with('department')->get();
        return response()->json(['users' => $users]);
    });
    
    Route::get('/users/profiles', function(Request $request) {
        $query = \App\Models\User::query();
        
        if ($request->has('role')) {
            $query->where('role', $request->role);
        }
        
        if ($request->has('ids')) {
            $ids = explode(',', $request->ids);
            $query->whereIn('id', $ids);
        }
        
        return response()->json(['profiles' => $query->get()]);
    });
    
    // User Roles (for multi-role support - currently simplified)
    Route::get('/users/roles', function(Request $request) {
        $query = \App\Models\User::query();
        
        if ($request->has('role')) {
            $query->where('role', $request->role);
        }
        
        $users = $query->get();
        $roles = $users->map(function($user) {
            return [
                'user_id' => $user->id,
                'role' => $user->role,
                'user' => $user
            ];
        });
        
        return response()->json(['roles' => $roles]);
    });
    
    Route::post('/users/roles', function(Request $request) {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'role' => 'required|in:admin,doctor,nurse,receptionist,pharmacist,lab_technician,lab_tech,billing,patient'
        ]);
        
        $user = \App\Models\User::find($request->user_id);
        // Normalize lab_tech to lab_technician for consistency
        $role = $request->role === 'lab_tech' ? 'lab_technician' : $request->role;
        $user->role = $role;
        $user->save();
        
        return response()->json(['success' => true, 'user' => $user]);
    });
    
    // Update user department
    Route::put('/users/{id}/department', function(Request $request, $id) {
        $request->validate([
            'department_id' => 'required|exists:departments,id'
        ]);
        
        $user = \App\Models\User::findOrFail($id);
        $user->department_id = $request->department_id;
        $user->save();
        
        return response()->json(['success' => true, 'user' => $user->load('department')]);
    });
    
    // Update user (general)
    Route::put('/users/{id}', function(Request $request, $id) {
        try {
            $user = \App\Models\User::findOrFail($id);
            
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'full_name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $id,
                'phone' => 'sometimes|nullable|string|max:20',
                'role' => 'sometimes|in:admin,doctor,nurse,receptionist,pharmacist,lab_technician,patient,billing',
                'department_id' => 'sometimes|nullable|exists:departments,id',
                'is_active' => 'sometimes|boolean'
            ]);
            
            // Handle full_name -> name mapping
            if (isset($validated['full_name']) && !isset($validated['name'])) {
                $validated['name'] = $validated['full_name'];
                unset($validated['full_name']);
            }
            
            $user->update($validated);
            
            return response()->json(['success' => true, 'user' => $user->load('department')]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    });
    
    // Settings
    Route::get('/settings', function(Request $request) {
        $settings = \App\Models\Setting::all();
        $settingsArray = $settings->map(function($setting) {
            return [
                'key' => $setting->key,
                'value' => $setting->value
            ];
        });
        return response()->json(['settings' => $settingsArray]);
    });
    
    Route::get('/settings/{key}', function(Request $request, $key) {
        $setting = \App\Models\Setting::where('key', $key)->first();
        return response()->json(['key' => $key, 'value' => $setting ? $setting->value : null]);
    });
    
    Route::put('/settings/{key}', function(Request $request, $key) {
        $request->validate(['value' => 'nullable']);
        
        // Allow empty values for optional settings
        $setting = \App\Models\Setting::updateOrCreate(
            ['key' => $key],
            ['value' => $request->value ?? '']
        );
        
        return response()->json(['success' => true, 'setting' => $setting]);
    });
    

    
    // Services Bulk Import
    Route::post('/services/bulk', function(Request $request) {
        $request->validate([
            'services' => 'required|array',
            'services.*.service_name' => 'required|string',
            'services.*.service_type' => 'required|string',
            'services.*.price' => 'required|numeric|min:0'
        ]);
        
        $results = ['success' => 0, 'failed' => 0, 'errors' => []];
        
        foreach ($request->services as $serviceData) {
            try {
                \App\Models\Service::create($serviceData);
                $results['success']++;
            } catch (\Exception $e) {
                $results['failed']++;
                $results['errors'][] = $e->getMessage();
            }
        }
        
        return response()->json(['results' => $results]);
    });
    
    // Billing/Invoices
    Route::get('/billing/invoices', [\App\Http\Controllers\InvoiceController::class, 'index']);
    Route::get('/billing/invoices/{id}', [\App\Http\Controllers\InvoiceController::class, 'show']);
    Route::post('/billing/invoices', [\App\Http\Controllers\InvoiceController::class, 'store']);
    Route::put('/billing/invoices/{id}', [\App\Http\Controllers\InvoiceController::class, 'update']);
    Route::delete('/billing/invoices/{id}', [\App\Http\Controllers\InvoiceController::class, 'destroy']);
    
    // Invoice Items
    Route::post('/billing/invoice-items', [\App\Http\Controllers\InvoiceController::class, 'storeItem']);
    
    // Lab Tests
    Route::get('/lab-tests', [\App\Http\Controllers\LabTestController::class, 'index']);
    Route::get('/lab-tests/{id}', [\App\Http\Controllers\LabTestController::class, 'show']);
    Route::post('/lab-tests', [\App\Http\Controllers\LabTestController::class, 'store']);
    Route::put('/lab-tests/{id}', [\App\Http\Controllers\LabTestController::class, 'update']);
    Route::delete('/lab-tests/{id}', [\App\Http\Controllers\LabTestController::class, 'destroy']);
    
    // Activity Logs
    Route::get('/activity', function(Request $request) {
        $query = \App\Models\ActivityLog::with('user')->orderBy('created_at', 'desc');
        
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        
        if ($request->has('action')) {
            $query->where('action', 'like', '%' . $request->action . '%');
        }
        
        if ($request->has('from')) {
            $query->where('created_at', '>=', $request->from);
        }
        
        if ($request->has('to')) {
            $query->where('created_at', '<=', $request->to);
        }
        
        $limit = $request->get('limit', 100);
        $logs = $query->limit($limit)->get();
        
        return response()->json(['logs' => $logs]);
    });
    
    Route::post('/activity', function(Request $request) {
        $request->validate([
            'action' => 'required|string',
            'details' => 'nullable',
        ]);
        
        // Handle details - can be string (JSON) or array
        $details = $request->details;
        if (is_string($details)) {
            $details = json_decode($details, true);
        }
        
        $log = \App\Models\ActivityLog::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'user_id' => $request->user()->id,
            'action' => $request->action,
            'details' => $details,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
        
        return response()->json(['log' => $log], 201);
    });
    
    // Insurance Companies
    Route::get('/insurance/companies', function(Request $request) {
        $companies = \App\Models\InsuranceCompany::all();
        return response()->json(['companies' => $companies]);
    });
    
    // Mobile Money Payments
    Route::post('/mobile-money/initiate', [App\Http\Controllers\MobileMoneyController::class, 'initiatePayment']);
    Route::get('/mobile-money/status/{paymentId}', [App\Http\Controllers\MobileMoneyController::class, 'checkStatus']);
    Route::post('/mobile-money/callback', [App\Http\Controllers\MobileMoneyController::class, 'handleCallback']);
    
    // Insurance Claims
    Route::get('/insurance/claims', function(Request $request) {
        $query = \App\Models\InsuranceClaim::with(['invoice', 'insuranceCompany']);
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        $claims = $query->orderBy('created_at', 'desc')->get();
        return response()->json(['claims' => $claims]);
    });
    
    Route::post('/insurance/claims', function(Request $request) {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'insurance_company_id' => 'required|exists:insurance_companies,id',
            'claim_amount' => 'required|numeric|min:0',
            'claim_number' => 'nullable|string',
            'status' => 'nullable|in:Pending,Approved,Rejected,Paid',
            'notes' => 'nullable|string'
        ]);
        
        $claim = \App\Models\InsuranceClaim::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'invoice_id' => $validated['invoice_id'],
            'insurance_company_id' => $validated['insurance_company_id'],
            'claim_amount' => $validated['claim_amount'],
            'claim_number' => $validated['claim_number'] ?? null,
            'status' => $validated['status'] ?? 'Pending',
            'notes' => $validated['notes'] ?? null,
            'claim_date' => now()
        ]);
        
        return response()->json(['claim' => $claim], 201);
    });
    
    // Appointment Visits (from visits table - for appointment-based workflow)
    Route::get('/appointment-visits', function(Request $request) {
        $query = DB::table('visits');
        
        if ($request->has('overall_status')) {
            $query->where('overall_status', $request->overall_status);
        }
        
        if ($request->has('current_stage')) {
            $query->where('current_stage', $request->current_stage);
        }
        
        $visits = $query->get();
        return response()->json(['visits' => $visits]);
    });
    
    // Patient Visits (alternative endpoint - legacy)
    Route::get('/patient-visits', function(Request $request) {
        $query = DB::table('visits');
        
        if ($request->has('status')) {
            $query->where('overall_status', $request->status);
        }
        
        if ($request->has('ready_for_discharge') && $request->ready_for_discharge === 'true') {
            $query->where('pharmacy_status', 'Completed')
                  ->where('billing_status', 'Completed');
        }
        
        $visits = $query->get();
        return response()->json(['visits' => $visits]);
    });
    
    // Pharmacy Medications
    Route::get('/pharmacy/medications', function(Request $request) {
        $query = \App\Models\Medication::query();
        
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        
        $medications = $query->orderBy('name')->get();
        return response()->json(['medications' => $medications]);
    });
    
    Route::get('/pharmacy/medications/{id}', function(Request $request, $id) {
        $medication = \App\Models\Medication::findOrFail($id);
        return response()->json(['medication' => $medication]);
    });
    
    Route::post('/pharmacy/medications', function(Request $request) {
        $request->validate([
            'name' => 'required|string',
            'generic_name' => 'nullable|string',
            'dosage_form' => 'required|string',
            'strength' => 'required|string',
            'quantity_in_stock' => 'required|integer|min:0',
            'unit_price' => 'required|numeric|min:0',
        ]);
        
        $medication = \App\Models\Medication::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'name' => $request->name,
            'generic_name' => $request->generic_name,
            'dosage_form' => $request->dosage_form,
            'strength' => $request->strength,
            'quantity_in_stock' => $request->quantity_in_stock,
            'unit_price' => $request->unit_price,
            'manufacturer' => $request->manufacturer,
            'expiry_date' => $request->expiry_date,
        ]);
        
        return response()->json(['medication' => $medication], 201);
    });
    
    Route::put('/pharmacy/medications/{id}', function(Request $request, $id) {
        try {
            $medication = \App\Models\Medication::findOrFail($id);
            
            // Validate the input
            $validated = $request->validate([
                'quantity_in_stock' => 'sometimes|integer|min:0',
                'stock_quantity' => 'sometimes|integer|min:0',
                'name' => 'sometimes|string',
                'generic_name' => 'sometimes|string|nullable',
                'category' => 'sometimes|string|nullable',
                'dosage_form' => 'sometimes|string|nullable',
                'strength' => 'sometimes|string|nullable',
                'manufacturer' => 'sometimes|string|nullable',
                'unit_price' => 'sometimes|numeric|min:0',
                'reorder_level' => 'sometimes|integer|min:0|nullable',
                'expiry_date' => 'sometimes|date|nullable',
                'batch_number' => 'sometimes|string|nullable',
                'is_active' => 'sometimes|boolean',
            ]);
            
            // Handle both quantity_in_stock and stock_quantity
            // If quantity_in_stock is provided, also update stock_quantity
            if (isset($validated['quantity_in_stock'])) {
                $validated['stock_quantity'] = $validated['quantity_in_stock'];
            }
            // If stock_quantity is provided, also update quantity_in_stock
            if (isset($validated['stock_quantity'])) {
                $validated['quantity_in_stock'] = $validated['stock_quantity'];
            }
            
            $medication->update($validated);
            
            // Reload to get fresh data
            $medication->refresh();
            
            return response()->json(['medication' => $medication]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Medication not found',
                'message' => "Medication with ID {$id} does not exist"
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Medication update error: ' . $e->getMessage(), [
                'id' => $id,
                'request' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Failed to update medication',
                'message' => $e->getMessage(),
                'type' => get_class($e)
            ], 500);
        }
    });
    
    Route::post('/pharmacy/medications/bulk', function(Request $request) {
        $request->validate([
            'medications' => 'required|array',
        ]);
        
        $results = ['success' => 0, 'failed' => 0, 'errors' => []];
        
        foreach ($request->medications as $medData) {
            try {
                \App\Models\Medication::create([
                    'id' => \Illuminate\Support\Str::uuid(),
                    ...$medData
                ]);
                $results['success']++;
            } catch (\Exception $e) {
                $results['failed']++;
                $results['errors'][] = $e->getMessage();
            }
        }
        
        return response()->json(['results' => $results]);
    });
    
    // Labs (alternative endpoint for lab-tests)
    Route::get('/labs', function(Request $request) {
        $query = \App\Models\LabTest::with(['patient', 'doctor']);
        
        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('limit')) {
            $query->limit($request->limit);
        }
        
        $tests = $query->orderBy('created_at', 'desc')->get();
        
        // Transform tests to include lab_results as an array
        $testsWithResults = $tests->map(function($test) {
            $testArray = $test->toArray();
            // Parse results JSON field into lab_results array
            if (isset($testArray['results']) && is_string($testArray['results'])) {
                $testArray['lab_results'] = json_decode($testArray['results'], true) ?: [];
            } else if (isset($testArray['results']) && is_array($testArray['results'])) {
                $testArray['lab_results'] = $testArray['results'];
            } else {
                $testArray['lab_results'] = [];
            }
            return $testArray;
        });
        
        return response()->json(['labTests' => $testsWithResults, 'tests' => $testsWithResults]);
    });
    
    Route::post('/labs', function(Request $request) {
        $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'test_name' => 'required|string',
            'test_type' => 'nullable|string',
        ]);
        
        // Map 'Ordered' status to 'Pending' (valid enum value)
        $status = $request->status ?? 'Pending';
        if ($status === 'Ordered') {
            $status = 'Pending';
        }
        
        $labTest = \App\Models\LabTest::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'patient_id' => $request->patient_id,
            'test_name' => $request->test_name,
            'test_type' => $request->test_type ?? 'Laboratory',
            'doctor_id' => $request->doctor_id ?? $request->user()->id,
            'test_date' => $request->test_date ?? $request->ordered_date ?? now()->toDateString(),
            'status' => $status,
            'notes' => $request->notes ?? $request->instructions,
        ]);
        
        return response()->json(['labTest' => $labTest], 201);
    });
    
    Route::put('/labs/{id}', function(Request $request, $id) {
        $labTest = \App\Models\LabTest::findOrFail($id);
        $labTest->update($request->all());
        return response()->json(['labTest' => $labTest]);
    });
    
    Route::get('/labs/services', function(Request $request) {
        // Return lab test services/catalog
        $services = \App\Models\MedicalService::where('service_type', 'Laboratory')->get();
        return response()->json(['services' => $services]);
    });
    
    Route::post('/labs/results/batch', function(Request $request) {
        $request->validate([
            'results' => 'required|array',
            'testIds' => 'required|array',
        ]);
        
        // Update test results
        foreach ($request->results as $result) {
            if (isset($result['test_id'])) {
                \App\Models\LabTest::where('id', $result['test_id'])->update([
                    'results' => $result['results'] ?? null,
                    'status' => 'Completed',
                    'completed_at' => now(),
                ]);
            }
        }
        
        return response()->json(['success' => true, 'updated' => count($request->results)]);
    });
    
    // Consultations
    Route::post('/consultations', function(Request $request) {
        $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
            'diagnosis' => 'required|string',
            'treatment_plan' => 'nullable|string',
        ]);
        
        // Update the visit/appointment with consultation details
        $appointment = \App\Models\Appointment::findOrFail($request->appointment_id);
        $appointment->update([
            'diagnosis' => $request->diagnosis,
            'treatment_plan' => $request->treatment_plan,
            'status' => 'Completed',
        ]);
        
        // Update related visit
        $visit = \App\Models\Visit::where('appointment_id', $request->appointment_id)->first();
        if ($visit) {
            $visit->update([
                'doctor_status' => 'Completed',
                'doctor_completed_at' => now(),
                'current_stage' => 'pharmacy',
            ]);
        }
        
        return response()->json(['success' => true, 'appointment' => $appointment]);
    });
});
