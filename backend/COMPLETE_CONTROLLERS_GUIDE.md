# Complete Controllers Implementation Guide

## ✅ What's Implemented

### Fully Implemented:
1. ✅ **authController.js** - Complete authentication
2. ✅ **patientController.js** - Full CRUD for patients
3. ✅ **appointmentController.js** - Full CRUD for appointments
4. ✅ **prescriptionController.js** - Prescription management

### Need Implementation:
5. ❌ **labController.js** - Lab tests and results
6. ❌ **pharmacyController.js** - Medication dispensing
7. ❌ **billingController.js** - Invoices and payments
8. ❌ **visitController.js** - Patient visit workflow
9. ❌ **userController.js** - User management

## 🚀 Quick Implementation Template

For each remaining controller, follow this pattern:

```javascript
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// GET all
exports.getAll = async (req, res) => {
  try {
    const [items] = await db.execute('SELECT * FROM table_name ORDER BY created_at DESC');
    res.json({ items });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};

// GET one
exports.getOne = async (req, res) => {
  try {
    const [items] = await db.execute('SELECT * FROM table_name WHERE id = ?', [req.params.id]);
    if (items.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ item: items[0] });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
};

// CREATE
exports.create = async (req, res) => {
  try {
    const { field1, field2 } = req.body;
    const id = uuidv4();
    
    await db.execute(
      'INSERT INTO table_name (id, field1, field2) VALUES (?, ?, ?)',
      [id, field1, field2]
    );
    
    // Log activity
    await db.execute(
      'INSERT INTO activity_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)',
      [uuidv4(), req.user.id, 'item.created', JSON.stringify({ id })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('items', 'item:created', { id });
    }
    
    res.status(201).json({ message: 'Created', id });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to create' });
  }
};

// UPDATE
exports.update = async (req, res) => {
  try {
    const { field1, field2 } = req.body;
    
    await db.execute(
      'UPDATE table_name SET field1 = ?, field2 = ? WHERE id = ?',
      [field1, field2, req.params.id]
    );
    
    // Log activity
    await db.execute(
      'INSERT INTO activity_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)',
      [uuidv4(), req.user.id, 'item.updated', JSON.stringify({ id: req.params.id })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('items', 'item:updated', { id: req.params.id });
    }
    
    res.json({ message: 'Updated' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to update' });
  }
};

// DELETE
exports.delete = async (req, res) => {
  try {
    await db.execute('DELETE FROM table_name WHERE id = ?', [req.params.id]);
    
    // Log activity
    await db.execute(
      'INSERT INTO activity_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)',
      [uuidv4(), req.user.id, 'item.deleted', JSON.stringify({ id: req.params.id })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('items', 'item:deleted', { id: req.params.id });
    }
    
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to delete' });
  }
};
```

## 📝 Remaining Controllers to Implement

### 1. Lab Controller (labController.js)

```javascript
// Lab tests
exports.getAllLabTests = async (req, res) => { /* ... */ };
exports.getLabTest = async (req, res) => { /* ... */ };
exports.createLabTest = async (req, res) => { /* ... */ };
exports.updateLabTest = async (req, res) => { /* ... */ };

// Lab results
exports.addLabResults = async (req, res) => { /* ... */ };
exports.getLabResults = async (req, res) => { /* ... */ };
```

### 2. Pharmacy Controller (pharmacyController.js)

```javascript
// Medications
exports.getAllMedications = async (req, res) => { /* ... */ };
exports.getMedication = async (req, res) => { /* ... */ };
exports.createMedication = async (req, res) => { /* ... */ };
exports.updateMedication = async (req, res) => { /* ... */ };

// Dispensing
exports.dispensePrescription = async (req, res) => { /* ... */ };
exports.updateStock = async (req, res) => { /* ... */ };
```

### 3. Billing Controller (billingController.js)

```javascript
// Invoices
exports.getAllInvoices = async (req, res) => { /* ... */ };
exports.getInvoice = async (req, res) => { /* ... */ };
exports.createInvoice = async (req, res) => { /* ... */ };
exports.updateInvoice = async (req, res) => { /* ... */ };

// Payments
exports.recordPayment = async (req, res) => { /* ... */ };
exports.getPayments = async (req, res) => { /* ... */ };
```

### 4. Visit Controller (visitController.js)

```javascript
exports.getAllVisits = async (req, res) => { /* ... */ };
exports.getVisit = async (req, res) => { /* ... */ };
exports.createVisit = async (req, res) => { /* ... */ };
exports.updateVisitStage = async (req, res) => { /* ... */ };
exports.completeVisit = async (req, res) => { /* ... */ };
```

### 5. User Controller (userController.js)

```javascript
exports.getAllUsers = async (req, res) => { /* ... */ };
exports.getUser = async (req, res) => { /* ... */ };
exports.createUser = async (req, res) => { /* ... */ };
exports.updateUser = async (req, res) => { /* ... */ };
exports.deleteUser = async (req, res) => { /* ... */ };
exports.assignRole = async (req, res) => { /* ... */ };
```

## 🎯 Implementation Priority

1. **High Priority** (Implement First):
   - ✅ Patients (Done)
   - ✅ Appointments (Done)
   - ✅ Prescriptions (Done)
   - ❌ Lab Tests
   - ❌ Billing/Invoices

2. **Medium Priority**:
   - ❌ Patient Visits
   - ❌ Pharmacy/Medications
   - ❌ User Management

3. **Low Priority**:
   - System settings
   - Reports
   - Analytics

## 🔧 How to Add a New Controller

1. **Create controller file**:
   ```bash
   touch backend/src/controllers/newController.js
   ```

2. **Implement CRUD operations** using the template above

3. **Create route file**:
   ```bash
   touch backend/src/routes/new.js
   ```

4. **Add routes**:
   ```javascript
   const express = require('express');
   const router = express.Router();
   const { authenticate, requireRole } = require('../middleware/auth');
   const controller = require('../controllers/newController');
   
   router.use(authenticate);
   router.get('/', controller.getAll);
   router.get('/:id', controller.getOne);
   router.post('/', requireRole(['admin']), controller.create);
   router.put('/:id', requireRole(['admin']), controller.update);
   router.delete('/:id', requireRole(['admin']), controller.delete);
   
   module.exports = router;
   ```

5. **Register in server.js**:
   ```javascript
   const newRoutes = require('./routes/new');
   app.use('/api/new', newRoutes);
   ```

6. **Test the endpoint**:
   ```bash
   curl http://localhost:3000/api/new \
     -H "Authorization: Bearer $TOKEN"
   ```

## 📊 Current Status

| Controller | Status | Routes | Tests |
|------------|--------|--------|-------|
| Auth | ✅ Complete | ✅ Done | ⚠️ Manual |
| Patients | ✅ Complete | ✅ Done | ⚠️ Manual |
| Appointments | ✅ Complete | ✅ Done | ⚠️ Manual |
| Prescriptions | ✅ Complete | ✅ Done | ⚠️ Manual |
| Labs | ❌ Pending | ❌ Pending | ❌ Pending |
| Pharmacy | ❌ Pending | ❌ Pending | ❌ Pending |
| Billing | ❌ Pending | ❌ Pending | ❌ Pending |
| Visits | ❌ Pending | ❌ Pending | ❌ Pending |
| Users | ❌ Pending | ❌ Pending | ❌ Pending |

## 🚀 Quick Start

The implemented controllers are ready to use:

```bash
# Start backend
cd backend
npm run dev

# Test patients endpoint
curl http://localhost:3000/api/patients \
  -H "Authorization: Bearer $TOKEN"

# Test appointments endpoint
curl http://localhost:3000/api/appointments \
  -H "Authorization: Bearer $TOKEN"

# Test prescriptions endpoint
curl http://localhost:3000/api/prescriptions \
  -H "Authorization: Bearer $TOKEN"
```

## 📞 Need Help?

1. Follow the template above
2. Copy from existing controllers
3. Test with curl or Postman
4. Check server logs for errors

---

**Status**: 40% Complete (4/9 controllers)  
**Ready to Use**: Auth, Patients, Appointments, Prescriptions  
**Last Updated**: November 15, 2025
