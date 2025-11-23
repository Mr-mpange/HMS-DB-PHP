# Test Check-in Workflow

## Current Situation

**Database State:**
- 10 total visits
- 6 visits with `current_stage=null` (not started workflow)
- 0 visits with `current_stage='nurse'` (waiting for nurse)
- All 6 null visits have NO appointment_id (walk-ins or quick service)

**Problem:** Receptionist dashboard only shows appointments to check in, not walk-in visits.

## Solution Options

### Option 1: Book Appointment First (Current Workflow)
1. Go to Receptionist Dashboard
2. Click "Book Appointment" button
3. Select one of the existing patients
4. Choose doctor, date, time
5. Save appointment
6. The appointment will appear in "Today's Appointments"
7. Click "Check In" button
8. Patient moves to nurse queue

### Option 2: Direct Walk-in Check-in (Needs Implementation)
Add a "Walk-in Patients" section that shows visits with `current_stage=null` and allows direct check-in.

## Testing Steps (Option 1)

### Step 1: Book an Appointment
```
1. Login as receptionist@test.com
2. Click "Book Appointment" button
3. Fill in:
   - Patient: Select any patient from dropdown
   - Doctor: Select available doctor
   - Date: Today's date
   - Time: Any time
   - Reason: "Test check-in"
4. Click "Book Appointment"
```

### Step 2: Check In the Appointment
```
1. Find the appointment in "Today's Appointments" table
2. Click "Check In" button (or "Collect Payment" if payment required)
3. If payment dialog appears:
   - Enter amount paid
   - Click "Confirm Payment & Check In"
4. Patient should be checked in
```

### Step 3: Verify in Nurse Dashboard
```
1. Logout from receptionist
2. Login as nurse@test.com
3. Check "Patients Waiting for Nurse" section
4. The patient should appear!
5. Console should show: totalFromAPI: 1, afterFilter: 1
```

### Step 4: Record Vitals
```
1. Click "Record Vitals" on the patient
2. Fill in vital signs:
   - Blood Pressure: 120/80
   - Heart Rate: 72
   - Temperature: 37.0
   - Oxygen: 98
3. Click "Record Vitals"
4. Patient should move to doctor queue
```

## Quick Test Script

Run this to create a test appointment:

```bash
cd backend
php artisan tinker
```

Then paste:
```php
// Get a patient with null stage visit
$visit = \App\Models\PatientVisit::whereNull('current_stage')->first();
$patient = $visit->patient;

// Get a doctor
$doctor = \App\Models\User::whereHas('roles', function($q) {
    $q->where('name', 'doctor');
})->first();

// Create appointment for today
$appointment = \App\Models\Appointment::create([
    'id' => (string) \Illuminate\Support\Str::uuid(),
    'patient_id' => $patient->id,
    'doctor_id' => $doctor->id,
    'appointment_date' => now()->format('Y-m-d'),
    'appointment_time' => '10:00:00',
    'appointment_type' => 'Consultation',
    'reason' => 'Test check-in workflow',
    'status' => 'Scheduled'
]);

echo "✅ Created appointment: " . $appointment->id . "\n";
echo "Patient: " . $patient->full_name . "\n";
echo "Doctor: " . $doctor->name . "\n";
echo "\nNow go to Receptionist Dashboard and check in this appointment!\n";
```

## Expected Results

After check-in:
- Visit `current_stage` changes from `null` → `'nurse'`
- Visit `nurse_status` set to `'Pending'`
- Visit `reception_status` set to `'Checked In'`
- Visit `reception_completed_at` set to current timestamp
- Appointment `status` changes from `'Scheduled'` → `'Confirmed'`

After recording vitals:
- Visit `current_stage` changes from `'nurse'` → `'doctor'`
- Visit `nurse_status` changes from `'Pending'` → `'Completed'`
- Visit `doctor_status` set to `'Pending'`
- Visit `nurse_completed_at` set to current timestamp
- Vital signs stored in `nurse_notes` as JSON

## Status

✅ Backend API working correctly
✅ Frontend filtering fixed
⏳ Need to test complete workflow
⏳ Consider adding "Walk-in Check-in" feature
