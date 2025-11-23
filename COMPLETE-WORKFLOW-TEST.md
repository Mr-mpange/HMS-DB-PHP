# Complete Hospital Workflow Testing Guide

## Patient Journey Overview

```
Reception → Nurse → Doctor → Lab/Pharmacy → Billing → Discharge
```

---

## Stage 1: Reception (Receptionist Dashboard)

### Entry Points:
1. **Walk-in Registration** (New patient)
2. **Appointment Check-in** (Scheduled patient)

### Actions:
- Register new patient
- Check-in appointment
- Create visit record

### Data Created:
```json
{
  "patient_id": "xxx",
  "visit_date": "2024-01-15",
  "current_stage": "nurse",
  "overall_status": "Active",
  "reception_status": "Checked In",
  "reception_completed_at": "timestamp",
  "nurse_status": "Pending"
}
```

### Test Checklist:
- [ ] Can register new patient
- [ ] Can check-in appointment
- [ ] Visit created with correct status
- [ ] Patient appears in Nurse queue
- [ ] Stats update correctly

### Expected Result:
✅ Patient moves to **Nurse Dashboard** with status "Pending"

---

## Stage 2: Nurse (Nurse Dashboard)

### Entry Point:
- Patient from Reception with `current_stage: "nurse"` and `nurse_status: "Pending"`

### Actions:
- Record vitals (BP, temp, pulse, weight, height)
- Add nurse notes
- Send to Doctor

### Data Updated:
```json
{
  "current_stage": "doctor",
  "nurse_status": "Completed",
  "nurse_notes": "{vitals_json}",
  "nurse_completed_at": "timestamp",
  "doctor_status": "Pending"
}
```

### Test Checklist:
- [ ] Patient appears in "Patients Waiting" list
- [ ] Can record all vitals
- [ ] Can add notes
- [ ] "Send to Doctor" button works
- [ ] Visit status updates correctly
- [ ] Patient disappears from Nurse queue
- [ ] Patient appears in Doctor queue

### Expected Result:
✅ Patient moves to **Doctor Dashboard** with status "Pending"

---

## Stage 3A: Doctor - Initial Consultation (Doctor Dashboard)

### Entry Point:
- Patient from Nurse with `current_stage: "doctor"` and `doctor_status: "Pending"`

### Actions Available:
1. **Start Consultation** (required first)
2. **Order Lab Test** (after consultation)

### Workflow:
```
1. Click "Start Consultation"
2. Enter diagnosis, notes, treatment plan
3. Save consultation
4. Click "Order Lab Test"
5. Select tests, priority, notes
6. Submit order
```

### Data Updated (After Consultation):
```json
{
  "doctor_diagnosis": "diagnosis text",
  "doctor_notes": "notes text",
  "doctor_treatment_plan": "treatment plan"
}
```

### Data Updated (After Lab Order):
```json
{
  "current_stage": "lab",
  "doctor_status": "Pending Lab Results",
  "lab_status": "Pending"
}
```

### Lab Tests Created:
```json
{
  "patient_id": "xxx",
  "visit_id": "xxx",
  "test_name": "CBC",
  "test_type": "Blood Test",
  "status": "Ordered",
  "priority": "Normal",
  "ordered_date": "timestamp"
}
```

### Test Checklist:
- [ ] Patient appears in "Patients Waiting for Consultation"
- [ ] Can view vitals from nurse
- [ ] "Start Consultation" button visible
- [ ] Can enter diagnosis, notes, treatment plan
- [ ] Consultation saves successfully
- [ ] "Order Lab Test" button enabled after consultation
- [ ] Can select multiple lab tests
- [ ] Checkboxes stay checked
- [ ] Can set priority (Normal/Urgent/STAT)
- [ ] Lab order submits successfully
- [ ] Patient moves to Lab queue
- [ ] Patient disappears from Doctor queue

### Expected Result:
✅ Patient moves to **Lab Dashboard** with status "Pending"
✅ Lab tests created with status "Ordered"

---

## Stage 4: Lab (Lab Dashboard)

### Entry Point:
- Patient from Doctor with `current_stage: "lab"` and `lab_status: "Pending"`
- Lab tests with status "Ordered"

### Actions:
1. **Collect Sample** (optional)
2. **Process Test**
3. **Enter Results**
4. **Complete & Send to Doctor**

### Workflow:
```
1. Patient appears in "Pending Tests" section
2. Click "Process Test"
3. Enter result values for each parameter
4. Mark abnormal flags if needed
5. Add notes
6. Click "Complete & Send to Doctor"
```

### Data Updated (Lab Tests):
```json
{
  "status": "Completed",
  "completed_date": "timestamp",
  "lab_results": [
    {
      "parameter": "WBC",
      "result_value": "7.5",
      "unit": "10^3/μL",
      "reference_range": "4.0-11.0",
      "abnormal_flag": false
    }
  ],
  "notes": "lab notes"
}
```

### Data Updated (Visit):
```json
{
  "current_stage": "doctor",
  "lab_status": "Completed",
  "lab_completed_at": "timestamp",
  "doctor_status": "Pending"
}
```

### Test Checklist:
- [ ] Patient appears in "Pending Tests"
- [ ] Can see ordered tests
- [ ] Can collect sample (status → "Sample Collected")
- [ ] Can process test (status → "In Progress")
- [ ] Can enter result values
- [ ] Can mark abnormal flags
- [ ] Can add notes
- [ ] "Complete & Send to Doctor" works
- [ ] Lab test status → "Completed"
- [ ] Patient moves back to Doctor queue
- [ ] Patient disappears from Lab queue

### Expected Result:
✅ Patient moves back to **Doctor Dashboard** with lab results
✅ Lab tests status "Completed"

---

## Stage 3B: Doctor - Review Results & Prescribe (Doctor Dashboard)

### Entry Point:
- Patient from Lab with `current_stage: "doctor"` and `lab_completed_at` exists

### Actions Available:
1. **View Results** (review lab results)
2. **Write Prescription** (only option)

### Workflow:
```
1. Patient appears in "Patients with Lab Results"
2. Click "View Results" to review
3. Click "Write Prescription"
4. Select medications (checkboxes)
5. Enter dosage, frequency, duration, quantity
6. Add instructions
7. Submit prescription
```

### Data Created (Prescriptions):
```json
{
  "patient_id": "xxx",
  "visit_id": "xxx",
  "medication_id": "xxx",
  "medication_name": "Amoxicillin",
  "dosage": "500mg",
  "frequency": "3 times daily",
  "duration": "7 days",
  "quantity": "21",
  "instructions": "Take with food",
  "status": "Pending",
  "prescribed_date": "timestamp"
}
```

### Data Updated (Visit):
```json
{
  "current_stage": "pharmacy",
  "doctor_status": "Completed",
  "doctor_completed_at": "timestamp",
  "pharmacy_status": "Pending"
}
```

### Test Checklist:
- [ ] Patient appears in "Patients with Lab Results"
- [ ] "View Results" shows lab data
- [ ] Abnormal flags highlighted
- [ ] "Write Prescription" button visible
- [ ] NO "Start Consultation" button
- [ ] NO "Order Lab Test" button
- [ ] Can select multiple medications
- [ ] Checkboxes stay checked
- [ ] Can enter dosage, frequency, duration, quantity
- [ ] Can add instructions
- [ ] Prescription submits successfully
- [ ] Patient moves to Pharmacy queue
- [ ] Patient disappears from Doctor queue

### Expected Result:
✅ Patient moves to **Pharmacy Dashboard** with status "Pending"
✅ Prescriptions created with status "Pending"

---

## Stage 5: Pharmacy (Pharmacy Dashboard)

### Entry Point:
- Patient from Doctor with `current_stage: "pharmacy"` and `pharmacy_status: "Pending"`
- Prescriptions with status "Pending"

### Actions:
1. **View Prescriptions**
2. **Dispense Medications**
3. **Complete & Send to Billing**

### Workflow:
```
1. Patient appears in pending list
2. Click "Dispense"
3. Review prescriptions
4. Mark each as dispensed
5. Add pharmacy notes
6. Click "Complete & Send to Billing"
```

### Data Updated (Prescriptions):
```json
{
  "status": "Dispensed",
  "dispensed_date": "timestamp",
  "dispensed_by": "pharmacist_id"
}
```

### Data Updated (Visit):
```json
{
  "current_stage": "billing",
  "pharmacy_status": "Completed",
  "pharmacy_completed_at": "timestamp",
  "billing_status": "Pending"
}
```

### Test Checklist:
- [ ] Patient appears in pending list
- [ ] Can view all prescriptions
- [ ] Can see dosage, frequency, duration
- [ ] Can mark as dispensed
- [ ] Can add pharmacy notes
- [ ] "Complete & Send to Billing" works
- [ ] Prescription status → "Dispensed"
- [ ] Patient moves to Billing queue
- [ ] Patient disappears from Pharmacy queue

### Expected Result:
✅ Patient moves to **Billing Dashboard** with status "Pending"
✅ Prescriptions status "Dispensed"

---

## Stage 6: Billing (Billing Dashboard)

### Entry Point:
- Patient from Pharmacy with `current_stage: "billing"` and `billing_status: "Pending"`

### Actions:
1. **View Bill Items**
2. **Process Payment**
3. **Complete & Discharge**

### Workflow:
```
1. Patient appears in pending bills
2. Review bill items:
   - Consultation fee
   - Lab tests
   - Medications
   - Other services
3. Calculate total
4. Process payment
5. Generate receipt
6. Click "Complete & Discharge"
```

### Data Created (Bill):
```json
{
  "visit_id": "xxx",
  "patient_id": "xxx",
  "items": [
    {
      "description": "Consultation",
      "amount": 50.00
    },
    {
      "description": "CBC Test",
      "amount": 30.00
    },
    {
      "description": "Amoxicillin 500mg x21",
      "amount": 15.00
    }
  ],
  "total_amount": 95.00,
  "payment_status": "Paid",
  "payment_method": "Cash",
  "paid_date": "timestamp"
}
```

### Data Updated (Visit):
```json
{
  "current_stage": "completed",
  "billing_status": "Completed",
  "billing_completed_at": "timestamp",
  "overall_status": "Completed"
}
```

### Test Checklist:
- [ ] Patient appears in pending bills
- [ ] Can see all bill items
- [ ] Total calculates correctly
- [ ] Can process payment
- [ ] Can select payment method
- [ ] Receipt generates
- [ ] "Complete & Discharge" works
- [ ] Visit status → "Completed"
- [ ] Patient disappears from all queues

### Expected Result:
✅ Patient **Discharged** - Visit completed
✅ All statuses marked "Completed"

---

## Alternative Workflow: Direct Discharge (No Lab)

### Scenario:
Doctor decides patient doesn't need lab tests, prescribes directly

### Workflow:
```
Reception → Nurse → Doctor (Consultation) → Doctor (Prescription) → Pharmacy → Billing → Discharge
```

### Doctor Actions:
1. Start Consultation
2. Enter diagnosis
3. Write Prescription (skip lab)
4. Patient goes to Pharmacy

### Data Flow:
```json
{
  "current_stage": "pharmacy",
  "doctor_status": "Completed",
  "lab_status": null,
  "pharmacy_status": "Pending"
}
```

### Test Checklist:
- [ ] Can skip lab tests
- [ ] Can write prescription directly
- [ ] Patient goes to Pharmacy
- [ ] Workflow completes normally

---

## Data Integrity Checks

### At Each Stage:

#### Reception:
```sql
SELECT * FROM visits 
WHERE current_stage = 'nurse' 
AND nurse_status = 'Pending'
AND reception_status = 'Checked In';
```

#### Nurse:
```sql
SELECT * FROM visits 
WHERE current_stage = 'doctor' 
AND doctor_status = 'Pending'
AND nurse_status = 'Completed'
AND nurse_completed_at IS NOT NULL;
```

#### Doctor (Lab Order):
```sql
SELECT * FROM visits 
WHERE current_stage = 'lab' 
AND lab_status = 'Pending'
AND doctor_diagnosis IS NOT NULL;

SELECT * FROM lab_tests 
WHERE visit_id = 'xxx' 
AND status = 'Ordered';
```

#### Lab:
```sql
SELECT * FROM visits 
WHERE current_stage = 'doctor' 
AND lab_completed_at IS NOT NULL
AND lab_status = 'Completed';

SELECT * FROM lab_tests 
WHERE visit_id = 'xxx' 
AND status = 'Completed'
AND completed_date IS NOT NULL;
```

#### Doctor (Prescription):
```sql
SELECT * FROM visits 
WHERE current_stage = 'pharmacy' 
AND pharmacy_status = 'Pending'
AND doctor_status = 'Completed';

SELECT * FROM prescriptions 
WHERE visit_id = 'xxx' 
AND status = 'Pending';
```

#### Pharmacy:
```sql
SELECT * FROM visits 
WHERE current_stage = 'billing' 
AND billing_status = 'Pending'
AND pharmacy_status = 'Completed';

SELECT * FROM prescriptions 
WHERE visit_id = 'xxx' 
AND status = 'Dispensed';
```

#### Billing:
```sql
SELECT * FROM visits 
WHERE overall_status = 'Completed'
AND billing_status = 'Completed'
AND billing_completed_at IS NOT NULL;
```

---

## Common Issues & Solutions

### Issue 1: Patient Stuck in Queue
**Symptom:** Patient doesn't move to next stage
**Check:**
- Visit `current_stage` updated?
- Next stage `status` set to "Pending"?
- Previous stage `completed_at` timestamp set?

**Solution:**
```sql
UPDATE visits 
SET current_stage = 'next_stage',
    next_stage_status = 'Pending',
    previous_stage_completed_at = NOW()
WHERE id = 'visit_id';
```

### Issue 2: Data Not Showing
**Symptom:** Dashboard shows empty
**Check:**
- API endpoint correct?
- Query filters correct?
- Data exists in database?

**Solution:**
- Check console logs
- Verify API response
- Check database records

### Issue 3: Checkboxes Unchecking
**Symptom:** Checkboxes uncheck after clicking
**Check:**
- Using functional state updates?
- State not being reset?

**Solution:** Already fixed with functional updates

### Issue 4: Wrong Buttons Showing
**Symptom:** Wrong actions available
**Check:**
- Patient `current_stage` correct?
- Coming from correct previous stage?

**Solution:** Already fixed - buttons match patient source

---

## Complete Test Script

### Test 1: Full Workflow with Lab
```
1. Reception: Register patient "John Doe"
   ✓ Visit created
   ✓ current_stage = "nurse"

2. Nurse: Record vitals
   ✓ Vitals saved
   ✓ current_stage = "doctor"

3. Doctor: Start consultation
   ✓ Diagnosis entered
   ✓ Can order lab test

4. Doctor: Order CBC test
   ✓ Lab test created
   ✓ current_stage = "lab"

5. Lab: Process CBC
   ✓ Results entered
   ✓ current_stage = "doctor"

6. Doctor: Review results & prescribe
   ✓ Can view results
   ✓ Prescription created
   ✓ current_stage = "pharmacy"

7. Pharmacy: Dispense medication
   ✓ Marked as dispensed
   ✓ current_stage = "billing"

8. Billing: Process payment
   ✓ Bill created
   ✓ Payment processed
   ✓ overall_status = "Completed"
```

### Test 2: Workflow without Lab
```
1. Reception: Register patient "Jane Smith"
2. Nurse: Record vitals
3. Doctor: Start consultation
4. Doctor: Write prescription (skip lab)
5. Pharmacy: Dispense medication
6. Billing: Process payment
7. Complete
```

### Test 3: Multiple Lab Tests
```
1-3. Same as Test 1
4. Doctor: Order CBC + Urinalysis + X-Ray
5. Lab: Process all tests
6. Doctor: Review all results
7-8. Same as Test 1
```

---

## Status Tracking Matrix

| Stage | current_stage | Status Field | Completed Field |
|-------|---------------|--------------|-----------------|
| Reception | "nurse" | reception_status: "Checked In" | reception_completed_at |
| Nurse | "doctor" | nurse_status: "Completed" | nurse_completed_at |
| Doctor (Lab) | "lab" | doctor_status: "Pending Lab Results" | - |
| Lab | "doctor" | lab_status: "Completed" | lab_completed_at |
| Doctor (Rx) | "pharmacy" | doctor_status: "Completed" | doctor_completed_at |
| Pharmacy | "billing" | pharmacy_status: "Completed" | pharmacy_completed_at |
| Billing | "completed" | billing_status: "Completed" | billing_completed_at |

---

## Final Verification

### All Stages Complete:
```sql
SELECT 
  v.id,
  v.patient_id,
  p.full_name,
  v.current_stage,
  v.overall_status,
  v.reception_status,
  v.nurse_status,
  v.doctor_status,
  v.lab_status,
  v.pharmacy_status,
  v.billing_status,
  v.created_at,
  v.reception_completed_at,
  v.nurse_completed_at,
  v.doctor_completed_at,
  v.lab_completed_at,
  v.pharmacy_completed_at,
  v.billing_completed_at
FROM visits v
JOIN patients p ON v.patient_id = p.id
WHERE v.id = 'test_visit_id';
```

### Expected Result:
```
✓ All status fields = "Completed"
✓ All completed_at timestamps set
✓ current_stage = "completed"
✓ overall_status = "Completed"
✓ No patient in any queue
```

---

## Success Criteria

✅ **Patient Flow:** Smooth progression through all stages
✅ **Data Integrity:** All fields updated correctly
✅ **No Data Loss:** All information preserved
✅ **Correct Buttons:** Right actions at each stage
✅ **Checkboxes Work:** Stay checked when selected
✅ **Status Updates:** Real-time queue updates
✅ **Complete Journey:** From registration to discharge

**Status:** Ready for comprehensive testing! 🎉
