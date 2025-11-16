# ✅ CORRECT Hospital Workflow (As Implemented)

## Complete Patient Journey

### 1️⃣ **RECEPTION** (Receptionist)
- Register new patient OR check-in returning patient
- Create visit record
- **Output:** `current_stage = 'nurse'`

---

### 2️⃣ **NURSE STATION** (Nurse)
- Record vital signs (BP, temp, pulse, weight, height)
- Document chief complaint
- Add nursing notes
- **Output:** `current_stage = 'doctor'`, `nurse_status = 'Completed'`

---

### 3️⃣ **DOCTOR CONSULTATION - FIRST TIME** (Doctor)
- Review patient information and vitals
- Conduct examination
- **Decision Point:**

#### Option A: Patient needs lab tests
- Doctor orders lab tests (CBC, Blood Glucose, X-Ray, etc.)
- Sets priority (Routine, Urgent, STAT)
- **Output:** 
  - `current_stage = 'lab'`
  - `lab_status = 'Pending'`
  - Patient goes to Lab

#### Option B: Patient doesn't need tests
- Doctor prescribes medications directly
- **Output:**
  - `current_stage = 'pharmacy'`
  - `doctor_status = 'Completed'`
  - Patient goes to Pharmacy

---

### 4️⃣ **LABORATORY** (Lab Technician)
- View pending tests for patient
- Process tests and enter results:
  - Result value
  - Reference range
  - Unit
  - Abnormal flag
  - Notes
- Submit batch results
- **Output:**
  - `lab_status = 'Completed'`
  - `lab_completed_at = timestamp`
  - **`current_stage = 'doctor'`** ← Patient returns to doctor!
  - **`doctor_status = 'Pending'`** ← Doctor needs to review results

---

### 5️⃣ **DOCTOR CONSULTATION - SECOND TIME** (Doctor)
**Patient returns here after lab completion**

- Review lab results
- Analyze test values and abnormal flags
- Make diagnosis based on results
- **Prescribe medications** based on lab findings
- Add treatment plan
- **Output:**
  - `current_stage = 'pharmacy'`
  - `doctor_status = 'Completed'`
  - Patient goes to Pharmacy

---

### 6️⃣ **PHARMACY** (Pharmacist)
- View prescriptions from doctor
- Dispense medications
- Provide instructions to patient
- **Output:**
  - `pharmacy_status = 'Completed'`
  - `current_stage = 'billing'`

---

### 7️⃣ **BILLING** (Billing Staff)
- Generate invoice (consultation + lab + medications)
- Process payment (Cash/Mobile/Insurance)
- **Output:**
  - `billing_status = 'Completed'`
  - `overall_status = 'Completed'`
  - `current_stage = 'completed'`
  - **Patient can leave hospital**

---

## 🔄 Visual Flow Diagram

```
┌──────────────┐
│  RECEPTION   │ Register/Check-in
└──────┬───────┘
       ↓
┌──────────────┐
│    NURSE     │ Vitals & Assessment
└──────┬───────┘
       ↓
┌──────────────┐
│   DOCTOR     │ First Consultation
│  (1st time)  │ 
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
       ↓                 ↓
┌──────────────┐   ┌──────────────┐
│     LAB      │   │   PHARMACY   │ (if no tests needed)
│ Process Tests│   │              │
└──────┬───────┘   └──────┬───────┘
       │                  │
       ↓                  │
┌──────────────┐          │
│   DOCTOR     │          │
│  (2nd time)  │ ←────────┘
│ Review Results│
│ & Prescribe  │
└──────┬───────┘
       ↓
┌──────────────┐
│   PHARMACY   │ Dispense Meds
└──────┬───────┘
       ↓
┌──────────────┐
│   BILLING    │ Payment & Complete
└──────────────┘
```

---

## 🎯 Key Points

### ✅ CORRECT Behavior (As Implemented):
1. **Lab → Doctor:** After lab completes tests, patient **MUST** return to doctor
2. **Doctor reviews results:** Doctor sees lab results and prescribes based on findings
3. **Then Pharmacy:** Only after doctor prescribes, patient goes to pharmacy
4. **Finally Billing:** Patient pays and leaves

### ❌ WRONG Behavior (What we DON'T want):
- ~~Lab → Pharmacy~~ (Patient should NOT go directly to pharmacy)
- ~~Lab → Billing~~ (Patient should NOT skip doctor)

---

## 📋 Database Field Values at Each Stage

| Stage | current_stage | lab_status | doctor_status | pharmacy_status |
|-------|--------------|------------|---------------|-----------------|
| Reception | `nurse` | `Pending` | `Pending` | `Pending` |
| Nurse | `doctor` | `Pending` | `Pending` | `Pending` |
| Doctor (1st) | `lab` | `Pending` | `In Progress` | `Pending` |
| Lab | `lab` | `In Progress` | `In Progress` | `Pending` |
| Lab Complete | **`doctor`** | **`Completed`** | **`Pending`** | `Pending` |
| Doctor (2nd) | `pharmacy` | `Completed` | `Completed` | `Pending` |
| Pharmacy | `billing` | `Completed` | `Completed` | `Completed` |
| Billing | `completed` | `Completed` | `Completed` | `Completed` |

---

## 🔍 How to Verify It's Working

1. **In Lab Dashboard:** Submit test results
2. **Check Console:** Should see "Updating visit: [id]" and "Visit updated successfully"
3. **In Doctor Dashboard:** Patient should appear in "Pending Consultations" or "Lab Results Ready"
4. **Doctor can:** View lab results and prescribe medications
5. **Then:** Patient moves to Pharmacy

---

## ✨ This is the CORRECT workflow you wanted!

The system is already configured to work this way. When you submit lab results, the patient automatically returns to the doctor for prescription before going to pharmacy.
