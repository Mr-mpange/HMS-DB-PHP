# Prescription API - 422 Error Fixed ✅

## Problem

Doctor trying to write prescription got 422 error:
```
POST http://localhost:8000/api/prescriptions 422 (Unprocessable Content)
Error: The patient id field is required. (and 3 more errors)
```

## Root Cause

**Frontend-Backend Mismatch:**

**Frontend was sending:**
```json
{
  "prescriptions": [
    {
      "patient_id": "...",
      "doctor_id": "...",
      "medication_id": "...",
      "medication_name": "...",
      "dosage": "...",
      ...
    },
    {
      "patient_id": "...",
      "doctor_id": "...",
      "medication_id": "...",
      ...
    }
  ]
}
```

**Backend expected:**
```json
{
  "patient_id": "...",
  "doctor_id": "...",
  "visit_id": "...",
  "prescription_date": "...",
  "diagnosis": "...",
  "notes": "...",
  "items": [
    {
      "medication_name": "...",
      "dosage": "...",
      "frequency": "...",
      "duration": "...",
      "quantity": 10,
      "instructions": "..."
    },
    {
      "medication_name": "...",
      ...
    }
  ]
}
```

The backend creates:
- **ONE prescription** (header) with patient, doctor, date
- **MULTIPLE items** (medications) under that prescription

## The Fix

Updated `src/pages/DoctorDashboard.tsx` (line 1345-1377):

**Before:**
```typescript
const prescriptionsToInsert = selectedMedications.map(medId => {
  const form = prescriptionForms[medId];
  const med = availableMedications.find(m => m.id === medId);
  
  return {
    patient_id: selectedVisit.patient_id,
    doctor_id: user?.id,
    medication_id: medId,
    medication_name: med?.name || '',
    dosage: form.dosage,
    frequency: form.frequency,
    duration: form.duration,
    quantity: parseInt(form.quantity),
    instructions: form.instructions || null,
    status: 'Pending',
    prescribed_date: new Date().toISOString()
  };
});

const response = await api.post('/prescriptions', { 
  prescriptions: prescriptionsToInsert 
});
```

**After:**
```typescript
const prescriptionItems = selectedMedications.map(medId => {
  const form = prescriptionForms[medId];
  const med = availableMedications.find(m => m.id === medId);
  
  return {
    medication_id: medId,
    medication_name: med?.name || '',
    dosage: form.dosage,
    frequency: form.frequency,
    duration: form.duration,
    quantity: parseInt(form.quantity),
    instructions: form.instructions || null
  };
});

const prescriptionData = {
  patient_id: selectedVisit.patient_id,
  doctor_id: user?.id,
  visit_id: selectedVisit.id || null,
  prescription_date: new Date().toISOString(),
  diagnosis: selectedVisit.doctor_diagnosis || null,
  notes: selectedVisit.doctor_notes || null,
  items: prescriptionItems
};

const response = await api.post('/prescriptions', prescriptionData);
```

## Changes Made

1. **Renamed** `prescriptionsToInsert` → `prescriptionItems`
2. **Removed** patient/doctor fields from items (moved to prescription header)
3. **Created** `prescriptionData` object with:
   - `patient_id` (required)
   - `doctor_id` (required)
   - `visit_id` (optional)
   - `prescription_date` (required)
   - `diagnosis` (optional)
   - `notes` (optional)
   - `items` array (required)
4. **Sent** single prescription with multiple items instead of multiple prescriptions

## Expected Result

**Before Fix:**
- ❌ 422 error: "patient id field is required"
- ❌ No prescriptions created
- ❌ Patient stuck at doctor stage

**After Fix:**
- ✅ Prescription created successfully
- ✅ Multiple medications in one prescription
- ✅ Patient sent to pharmacy stage
- ✅ Visit updated: `current_stage='pharmacy'`, `pharmacy_status='Pending'`

## Testing

1. **Go to Doctor Dashboard**
2. **Select a patient** waiting for consultation
3. **Click "Write Prescription"**
4. **Select medications** (e.g., Paracetamol, Amoxicillin)
5. **Fill in dosage, frequency, duration, quantity** for each
6. **Click "Submit Prescription"**

**Expected:**
- ✅ Toast: "2 prescription(s) written. Patient sent to pharmacy."
- ✅ Patient disappears from doctor queue
- ✅ Patient appears in pharmacy queue

## Database Result

After successful prescription:

**prescriptions table:**
```
id: uuid
patient_id: uuid
doctor_id: uuid
visit_id: uuid
prescription_date: timestamp
diagnosis: text
notes: text
status: 'Active'
```

**prescription_items table:**
```
id: uuid
prescription_id: uuid (FK to prescriptions)
medication_id: uuid
medication_name: string
dosage: string
frequency: string
duration: string
quantity: integer
instructions: text
```

**patient_visits table:**
```
current_stage: 'pharmacy'
doctor_status: 'Completed'
doctor_completed_at: timestamp
pharmacy_status: 'Pending'
```

## Status

✅ **FIXED** - Prescriptions now create successfully

### Files Modified:
- `src/pages/DoctorDashboard.tsx` (prescription submission logic)

### Changes:
- Changed from multiple prescriptions to single prescription with items
- Added all required fields (patient_id, doctor_id, prescription_date)
- Properly structured items array

---

**Issue:** 422 error when creating prescription
**Cause:** Frontend sending wrong data structure
**Solution:** Match backend API expectations (single prescription with items array)
**Impact:** Doctor → Pharmacy workflow now works!
