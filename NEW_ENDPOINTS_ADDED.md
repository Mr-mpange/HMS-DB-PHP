# New Backend Endpoints Added

## Date: November 15, 2025

---

## 🎉 NEW ENDPOINTS CREATED

I've added the missing backend endpoints needed by ReceptionistDashboard and BillingDashboard.

---

## 📋 Endpoints Added

### 1. Patient Visits/Workflow Management
**Base URL:** `/api/visits`

#### Endpoints:
- `GET /api/visits` - Get all visits
  - Query params: `patient_id`, `status`, `current_stage`, `limit`, `offset`
  - Returns: List of patient visits with patient info

- `GET /api/visits/:id` - Get single visit
  - Returns: Visit details with patient info

- `POST /api/visits` - Create new visit
  - Body: `patient_id`, `appointment_id`, `visit_date`, `current_stage`, `overall_status`, `reception_status`, `reception_notes`
  - Returns: `visitId`

- `PUT /api/visits/:id` - Update visit
  - Body: Any visit status fields (reception_status, nurse_status, doctor_status, etc.)
  - Returns: Success message

- `DELETE /api/visits/:id` - Delete visit (admin only)
  - Returns: Success message

**Use Case:** Track patient workflow through reception → nurse → doctor → pharmacy → billing

---

### 2. Departments Management
**Base URL:** `/api/departments`

#### Endpoints:
- `GET /api/departments` - Get all departments
  - Returns: List of departments ordered by name

- `GET /api/departments/:id` - Get single department
  - Returns: Department details

- `POST /api/departments` - Create department (admin only)
  - Body: `name` (required), `description`
  - Returns: `departmentId`

- `PUT /api/departments/:id` - Update department (admin only)
  - Body: `name`, `description`
  - Returns: Success message

- `DELETE /api/departments/:id` - Delete department (admin only)
  - Returns: Success message

**Use Case:** Manage hospital departments (Cardiology, Pediatrics, etc.)

---

### 3. Payments Management
**Base URL:** `/api/payments`

#### Endpoints:
- `GET /api/payments` - Get all payments
  - Query params: `patient_id`, `invoice_id`, `status`, `limit`, `offset`
  - Returns: List of payments with patient and invoice info

- `GET /api/payments/:id` - Get single payment
  - Returns: Payment details

- `POST /api/payments` - Create payment
  - Body: `patient_id`, `invoice_id`, `amount`, `payment_method`, `payment_date`, `transaction_id`, `reference_number`, `notes`
  - Returns: `paymentId`
  - **Auto-updates invoice paid_amount and status**

- `PUT /api/payments/:id` - Update payment
  - Body: `status`, `notes`
  - Returns: Success message

- `DELETE /api/payments/:id` - Delete payment (admin only)
  - Returns: Success message

**Use Case:** Record and track patient payments, automatically update invoice status

---

## 🔧 Files Created

### Routes:
1. `backend/src/routes/visits.js`
2. `backend/src/routes/departments.js`
3. `backend/src/routes/payments.js`

### Controllers:
1. `backend/src/controllers/visitController.js`
2. `backend/src/controllers/departmentController.js`
3. `backend/src/controllers/paymentController.js`

### Updated:
- `backend/src/server.js` - Added new route registrations

---

## 📊 Complete Endpoint List

### Now Available:
1. ✅ `/api/auth/*` - Authentication
2. ✅ `/api/users/*` - User management
3. ✅ `/api/patients/*` - Patient management
4. ✅ `/api/appointments/*` - Appointment management
5. ✅ `/api/prescriptions/*` - Prescription management
6. ✅ `/api/labs/*` - Lab test management
7. ✅ `/api/pharmacy/*` - Pharmacy operations
8. ✅ `/api/billing/*` - Billing/invoices
9. ✅ `/api/visits/*` - **NEW** - Patient visit workflow
10. ✅ `/api/departments/*` - **NEW** - Department management
11. ✅ `/api/payments/*` - **NEW** - Payment processing
12. ✅ `/api/activity/*` - Activity logs
13. ✅ `/api/upload/*` - File uploads

---

## 🚀 Usage Examples

### Create a Patient Visit:
```javascript
const { data } = await api.post('/visits', {
  patient_id: 'patient-uuid',
  appointment_id: 'appointment-uuid',
  visit_date: '2025-11-15',
  current_stage: 'reception',
  overall_status: 'Active',
  reception_status: 'Checked In',
  reception_notes: 'Patient arrived on time'
});
```

### Update Visit Status:
```javascript
await api.put(`/visits/${visitId}`, {
  current_stage: 'doctor',
  reception_status: 'Completed',
  reception_completed_at: new Date().toISOString(),
  doctor_status: 'In Progress'
});
```

### Create Payment:
```javascript
const { data } = await api.post('/payments', {
  patient_id: 'patient-uuid',
  invoice_id: 'invoice-uuid',
  amount: 50000,
  payment_method: 'Cash',
  payment_date: new Date().toISOString(),
  notes: 'Full payment received'
});
// Invoice status automatically updated!
```

### Get Departments:
```javascript
const { data } = await api.get('/departments');
console.log(data.departments); // Array of departments
```

---

## 🔐 Authentication & Authorization

All endpoints require authentication via JWT token.

### Role-Based Access:
- **Visits:** receptionist, nurse, doctor, admin
- **Departments:** admin only (create/update/delete), all (read)
- **Payments:** receptionist, billing, admin

---

## 📝 Database Tables Used

### patient_visits
- Tracks patient workflow through hospital stages
- Fields: reception_status, nurse_status, doctor_status, pharmacy_status, lab_status, billing_status
- Each stage has: status, notes, completed_at timestamp

### departments
- Hospital departments/specializations
- Fields: id, name, description

### payments
- Payment records
- Fields: patient_id, invoice_id, amount, payment_method, transaction_id, status, received_by

---

## ✅ Features Enabled

With these new endpoints, the following features are now possible:

### ReceptionistDashboard:
✅ Fetch departments for appointment booking
✅ Create patient visits for workflow tracking
✅ Update visit status during check-in
✅ Record payments at reception
✅ Track patient flow through stages

### BillingDashboard:
✅ Create payment records
✅ Auto-update invoice status
✅ Track payment history
✅ Link payments to invoices
✅ Update visit billing status

---

## 🧪 Testing

### Test the new endpoints:
```bash
# Get departments
curl http://localhost:3000/api/departments -H "Authorization: Bearer YOUR_TOKEN"

# Create visit
curl -X POST http://localhost:3000/api/visits \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"patient_id":"uuid","current_stage":"reception"}'

# Create payment
curl -X POST http://localhost:3000/api/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"patient_id":"uuid","amount":50000,"payment_method":"Cash"}'
```

---

## 🎯 Next Steps

### To Complete Migration:

1. **Update ReceptionistDashboard.tsx**
   - Replace Supabase calls with new API endpoints
   - Use `/api/visits` for workflow management
   - Use `/api/departments` for department data
   - Use `/api/payments` for payment recording

2. **Update BillingDashboard.tsx**
   - Replace Supabase calls with `/api/payments`
   - Use automatic invoice status updates
   - Remove RPC calls (calculate costs in frontend or add endpoint)

3. **Test Workflows**
   - Test patient check-in flow
   - Test payment processing
   - Test workflow stage transitions

---

## 🏆 Summary

**3 new endpoint groups added:**
- ✅ Visits (5 endpoints)
- ✅ Departments (5 endpoints)
- ✅ Payments (5 endpoints)

**Total: 15 new endpoints**

**Backend is now ready for full ReceptionistDashboard and BillingDashboard migration!** 🚀

