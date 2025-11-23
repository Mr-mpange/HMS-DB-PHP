# Quick Workflow Testing Checklist

## 🎯 Complete Patient Journey Test

### Test Patient: John Doe
**Goal:** Verify complete workflow from registration to discharge

---

## ✅ Stage 1: Reception
**Login as:** Receptionist

- [ ] Register new patient "John Doe"
- [ ] Verify visit created
- [ ] Check patient appears in Nurse queue
- [ ] Verify status: `current_stage = "nurse"`, `nurse_status = "Pending"`

**Expected:** Patient visible in Nurse Dashboard ✅

---

## ✅ Stage 2: Nurse
**Login as:** Nurse

- [ ] See "John Doe" in waiting list
- [ ] Click "Record Vitals"
- [ ] Enter: BP (120/80), Temp (98.6), Pulse (72), Weight (70kg), Height (175cm)
- [ ] Add notes: "Patient complains of fever"
- [ ] Click "Send to Doctor"
- [ ] Verify patient disappears from Nurse queue
- [ ] Verify status: `current_stage = "doctor"`, `doctor_status = "Pending"`

**Expected:** Patient visible in Doctor Dashboard ✅

---

## ✅ Stage 3A: Doctor - Consultation
**Login as:** Doctor

- [ ] See "John Doe" in "Patients Waiting for Consultation"
- [ ] Verify vitals visible from nurse
- [ ] Click "Start Consultation"
- [ ] Enter diagnosis: "Viral Fever"
- [ ] Enter notes: "Patient has high fever for 2 days"
- [ ] Enter treatment plan: "Rest and medication"
- [ ] Click "Save Consultation"
- [ ] Verify "Order Lab Test" button enabled

**Expected:** Consultation saved, can order lab tests ✅

---

## ✅ Stage 3B: Doctor - Order Lab Tests
**Still as:** Doctor

- [ ] Click "Order Lab Test"
- [ ] Check "CBC" checkbox
- [ ] Check "Urinalysis" checkbox
- [ ] Verify checkboxes STAY CHECKED ⚠️
- [ ] Select priority: "Normal"
- [ ] Add notes: "Check for infection"
- [ ] Click "Submit Order"
- [ ] Verify patient disappears from Doctor queue
- [ ] Verify status: `current_stage = "lab"`, `lab_status = "Pending"`

**Expected:** Patient visible in Lab Dashboard ✅

---

## ✅ Stage 4: Lab
**Login as:** Lab Technician

- [ ] See "John Doe" in pending tests
- [ ] See 2 tests: CBC, Urinalysis
- [ ] Click "Process Test" for CBC
- [ ] Enter results:
  - WBC: 12.5 (mark abnormal)
  - RBC: 4.8
  - Hemoglobin: 14.2
- [ ] Add notes: "Elevated WBC indicates infection"
- [ ] Click "Save Results"
- [ ] Repeat for Urinalysis
- [ ] Click "Complete & Send to Doctor"
- [ ] Verify patient disappears from Lab queue
- [ ] Verify status: `current_stage = "doctor"`, `lab_completed_at` set

**Expected:** Patient back in Doctor Dashboard with results ✅

---

## ✅ Stage 3C: Doctor - Review & Prescribe
**Login as:** Doctor

- [ ] See "John Doe" in "Patients with Lab Results"
- [ ] Verify NO "Start Consultation" button ⚠️
- [ ] Verify NO "Order Lab Test" button ⚠️
- [ ] Verify ONLY "View Results" and "Write Prescription" buttons ⚠️
- [ ] Click "View Results"
- [ ] Verify CBC results visible
- [ ] Verify abnormal WBC highlighted
- [ ] Click "Write Prescription"
- [ ] Check "Amoxicillin 500mg" checkbox
- [ ] Check "Paracetamol 500mg" checkbox
- [ ] Verify checkboxes STAY CHECKED ⚠️
- [ ] For Amoxicillin:
  - Dosage: 500mg
  - Frequency: 3 times daily
  - Duration: 7 days
  - Quantity: 21
  - Instructions: Take with food
- [ ] For Paracetamol:
  - Dosage: 500mg
  - Frequency: As needed
  - Duration: 5 days
  - Quantity: 15
  - Instructions: For fever
- [ ] Click "Submit Prescription"
- [ ] Verify patient disappears from Doctor queue
- [ ] Verify status: `current_stage = "pharmacy"`, `pharmacy_status = "Pending"`

**Expected:** Patient visible in Pharmacy Dashboard ✅

---

## ✅ Stage 5: Pharmacy
**Login as:** Pharmacist

- [ ] See "John Doe" in pending list
- [ ] See 2 prescriptions: Amoxicillin, Paracetamol
- [ ] Verify dosage, frequency, duration visible
- [ ] Click "Dispense"
- [ ] Mark both as dispensed
- [ ] Add notes: "Patient counseled on usage"
- [ ] Click "Complete & Send to Billing"
- [ ] Verify patient disappears from Pharmacy queue
- [ ] Verify status: `current_stage = "billing"`, `billing_status = "Pending"`

**Expected:** Patient visible in Billing Dashboard ✅

---

## ✅ Stage 6: Billing
**Login as:** Billing Staff

- [ ] See "John Doe" in pending bills
- [ ] Verify bill items:
  - Consultation fee
  - CBC test
  - Urinalysis test
  - Amoxicillin
  - Paracetamol
- [ ] Verify total calculated correctly
- [ ] Select payment method: "Cash"
- [ ] Click "Process Payment"
- [ ] Verify receipt generated
- [ ] Click "Complete & Discharge"
- [ ] Verify patient disappears from all queues
- [ ] Verify status: `overall_status = "Completed"`

**Expected:** Patient discharged successfully ✅

---

## 🎉 Success Criteria

### Data Integrity:
- [ ] All stages completed in order
- [ ] All timestamps set correctly
- [ ] All data preserved (vitals, diagnosis, results, prescriptions)
- [ ] No data loss between stages

### UI/UX:
- [ ] Checkboxes stay checked ⚠️
- [ ] Correct buttons at each stage ⚠️
- [ ] Real-time queue updates
- [ ] No errors in console

### Workflow:
- [ ] Patient progresses smoothly
- [ ] No stuck patients
- [ ] Proper stage transitions
- [ ] Complete journey: Registration → Discharge

---

## ⚠️ Critical Tests

### Test 1: Checkbox Persistence
**Location:** Doctor Dashboard - Lab Tests & Prescriptions
**Action:** Check multiple items
**Expected:** All stay checked ✅
**Status:** FIXED with functional state updates

### Test 2: Workflow Buttons
**Location:** Doctor Dashboard
**From Nurse:** Show "Start Consultation" + "Order Lab Test"
**From Lab:** Show "View Results" + "Write Prescription" ONLY
**Expected:** Correct buttons based on patient source ✅
**Status:** FIXED - removed inappropriate buttons

### Test 3: Data Passing
**Check:** Each stage receives data from previous stage
- Nurse → Doctor: Vitals visible
- Doctor → Lab: Test orders visible
- Lab → Doctor: Results visible
- Doctor → Pharmacy: Prescriptions visible
**Expected:** All data flows correctly ✅

---

## 🐛 Known Issues (FIXED)

### ✅ Issue 1: Checkboxes Unchecking
**Status:** FIXED
**Solution:** Functional state updates

### ✅ Issue 2: Wrong Workflow Buttons
**Status:** FIXED
**Solution:** Removed "Prescribe Meds" from nurse workflow

### ✅ Issue 3: Lab Role Redirect
**Status:** FIXED
**Solution:** Role normalization in AuthContext

### ✅ Issue 4: Date Formatting Errors
**Status:** FIXED
**Solution:** Safe date validation in LabDashboard

---

## 📊 Quick Verification Queries

### Check Visit Status:
```sql
SELECT 
  current_stage,
  overall_status,
  nurse_status,
  doctor_status,
  lab_status,
  pharmacy_status,
  billing_status
FROM visits 
WHERE patient_id = 'john_doe_id';
```

### Check Lab Tests:
```sql
SELECT test_name, status, completed_date
FROM lab_tests 
WHERE visit_id = 'visit_id';
```

### Check Prescriptions:
```sql
SELECT medication_name, status, dispensed_date
FROM prescriptions 
WHERE visit_id = 'visit_id';
```

---

## ✅ Final Checklist

- [ ] Complete workflow test passed
- [ ] All checkboxes work correctly
- [ ] Correct buttons at each stage
- [ ] Data flows between stages
- [ ] No console errors
- [ ] Patient successfully discharged

**Status:** Ready for production testing! 🚀
