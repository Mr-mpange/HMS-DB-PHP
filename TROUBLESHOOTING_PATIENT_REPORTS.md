# Troubleshooting Patient Reports

## Issue: Medications and Lab Tests Not Showing in Print

### Quick Checks

1. **Open Browser Console** (F12)
   - Look for "Patient History Data:" log
   - Check if prescriptions and labTests counts are 0

2. **Check if Patient Has Data**
   - Does the patient have prescriptions in the system?
   - Does the patient have lab tests ordered?
   - Check the summary cards on screen - do they show 0?

3. **Check API Responses**
   - Open Network tab in browser (F12)
   - Search for patient
   - Look for these API calls:
     - `/prescriptions?patient_id=...`
     - `/lab-tests?patient_id=...`
   - Click on each and check the Response tab

### Common Causes

#### 1. Patient Has No Data Yet ✅ FIXED
**Symptom:** Sections don't appear in print at all

**Solution:** Updated code now shows:
- "No prescriptions found for this patient."
- "No lab tests found for this patient."

Even if empty, sections will appear in print.

#### 2. Prescriptions Have No Medications
**Symptom:** Prescription section shows but no medication table

**Check:**
```javascript
// In browser console, after selecting patient:
console.log(patientHistory.prescriptions[0].medications)
```

**Expected:** Array of medications
**If null/undefined:** Prescriptions were created without medications array

**Fix:** Prescriptions need to be created with medications in JSON format

#### 3. Lab Tests Missing Fields
**Symptom:** Lab test table shows but missing test_type, result_value, etc.

**Check Database:**
```sql
SELECT * FROM lab_tests WHERE patient_id = 'PAT-XXX';
```

**Expected Fields:**
- test_name
- test_type
- result_value
- result_unit
- reference_range
- status
- completed_at

#### 4. API Endpoint Issues
**Symptom:** Console shows 0 prescriptions/lab tests but patient should have data

**Check:**
1. Open Network tab
2. Find `/prescriptions?patient_id=XXX` request
3. Check Response:
   ```json
   {
     "prescriptions": [
       {
         "id": "...",
         "medications": [...]  // Should be array
       }
     ]
   }
   ```

4. Find `/lab-tests?patient_id=XXX` request
5. Check Response:
   ```json
   {
     "labTests": [...]  // Should be array
   }
   ```

### Debug Steps

#### Step 1: Check Console Logs
After selecting a patient, you should see:
```
Patient History Data: {
  appointments: 5,
  prescriptions: 3,
  prescriptionsData: [...],
  labTests: 2,
  labTestsData: {...},
  invoices: 4
}
```

#### Step 2: Verify Data Structure
In console, type:
```javascript
// Check prescriptions
patientHistory.prescriptions.forEach((rx, i) => {
  console.log(`Prescription ${i}:`, {
    date: rx.prescription_date,
    medications: rx.medications?.length || 0,
    medicationsData: rx.medications
  });
});

// Check lab tests
patientHistory.labTests.forEach((test, i) => {
  console.log(`Lab Test ${i}:`, {
    name: test.test_name,
    type: test.test_type,
    result: test.result_value
  });
});
```

#### Step 3: Test Print
1. Select a patient
2. Wait for data to load (check summary cards)
3. Click "Print Report"
4. In print preview, scroll down
5. Look for:
   - "Prescriptions & Medications Provided" section
   - "Laboratory Tests & Results" section

### Expected Print Output

#### If Patient Has Data:
```
PRESCRIPTIONS & MEDICATIONS PROVIDED
─────────────────────────────────────

📋 Prescription Date: Nov 10, 2025
   Doctor: Dr. Smith    Status: Active

   Medication   | Dosage | Frequency | Duration | Quantity
   Amoxicillin  | 500mg  | 3x daily  | 7 days   | 21
   Paracetamol  | 500mg  | 2x daily  | 5 days   | 10

LABORATORY TESTS & RESULTS
──────────────────────────

Date    | Test Name    | Type  | Result | Status
Nov 10  | Blood Count  | Blood | Normal | Complete
```

#### If Patient Has No Data:
```
PRESCRIPTIONS & MEDICATIONS PROVIDED
─────────────────────────────────────

No prescriptions found for this patient.


LABORATORY TESTS & RESULTS
──────────────────────────

No lab tests found for this patient.
```

### Solutions

#### Solution 1: Create Test Data
If testing, create sample data:

**Prescription with Medications:**
```sql
INSERT INTO prescriptions (id, patient_id, doctor_id, prescription_date, medications, status)
VALUES (
  UUID(),
  'PAT-12345',
  'DOC-001',
  CURDATE(),
  '[{"medication_name":"Amoxicillin","dosage":"500mg","frequency":"3x daily","duration":"7 days","quantity":21}]',
  'Active'
);
```

**Lab Test:**
```sql
INSERT INTO lab_tests (id, patient_id, doctor_id, test_name, test_type, result_value, result_unit, reference_range, status, ordered_date)
VALUES (
  UUID(),
  'PAT-12345',
  'DOC-001',
  'Complete Blood Count',
  'Blood',
  'WBC: 7.2',
  'x10^9/L',
  '4-11',
  'Completed',
  CURDATE()
);
```

#### Solution 2: Check Backend Endpoints
Test endpoints directly:

```bash
# Test prescriptions endpoint
curl http://localhost:5000/api/prescriptions?patient_id=PAT-12345

# Test lab tests endpoint
curl http://localhost:5000/api/lab-tests?patient_id=PAT-12345
```

#### Solution 3: Clear Cache
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Restart development server

### Still Not Working?

1. **Check browser console for errors**
   - Red error messages
   - Failed API calls (404, 500)

2. **Check backend logs**
   - Look for errors in terminal
   - Check database connection

3. **Verify patient ID**
   - Make sure you're using correct patient ID
   - Check if patient exists in database

4. **Test with different patient**
   - Try a patient you know has prescriptions
   - Try a patient you know has lab tests

### Contact Support

If still having issues, provide:
1. Screenshot of browser console
2. Screenshot of Network tab showing API responses
3. Patient ID you're testing with
4. What you see vs what you expect

---

## Quick Fix Checklist

- [ ] Opened browser console (F12)
- [ ] Selected a patient
- [ ] Checked "Patient History Data:" log
- [ ] Verified prescriptions count > 0
- [ ] Verified labTests count > 0
- [ ] Clicked Print Report
- [ ] Scrolled through print preview
- [ ] Sections now show (even if empty)
- [ ] If empty, shows "No prescriptions/lab tests found"

**If all checks pass and sections show "No data found", the patient simply doesn't have prescriptions or lab tests yet. This is normal for new patients!** ✅
