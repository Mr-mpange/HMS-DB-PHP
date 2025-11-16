const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Get all medications
exports.getAllMedications = async (req, res) => {
  try {
    const { search, category, limit = 100, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM medications WHERE 1=1';
    let params = [];
    
    if (search) {
      query += ' AND (name LIKE ? OR generic_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [medications] = await db.execute(query, params);
    
    res.json({ medications });
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
};

// Get single medication
exports.getMedication = async (req, res) => {
  try {
    const [medications] = await db.execute(
      'SELECT * FROM medications WHERE id = ?',
      [req.params.id]
    );
    
    if (medications.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    res.json({ medication: medications[0] });
  } catch (error) {
    console.error('Get medication error:', error);
    res.status(500).json({ error: 'Failed to fetch medication' });
  }
};

// Create medication
exports.createMedication = async (req, res) => {
  try {
    const { 
      name, generic_name, category, dosage_form, strength,
      unit_price, stock_quantity, reorder_level, manufacturer,
      expiry_date, description
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Medication name is required' });
    }
    
    const medicationId = uuidv4();
    
    await db.execute(
      `INSERT INTO medications (
        id, name, generic_name, category, dosage_form, strength,
        unit_price, stock_quantity, reorder_level, manufacturer,
        expiry_date, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [medicationId, name, generic_name, category, dosage_form, strength,
       unit_price || 0, stock_quantity || 0, reorder_level || 10,
       manufacturer, expiry_date, description]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'medication.created', 
       JSON.stringify({ medication_id: medicationId, name })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('medications', 'medication:created', { id: medicationId });
    }
    
    res.status(201).json({ 
      message: 'Medication created successfully',
      medicationId 
    });
  } catch (error) {
    console.error('Create medication error:', error);
    res.status(500).json({ error: 'Failed to create medication' });
  }
};

// Update medication
exports.updateMedication = async (req, res) => {
  try {
    const updates = [];
    const values = [];
    
    const allowedFields = {
      'name': 'name',
      'generic_name': 'generic_name',
      'category': 'category',
      'dosage_form': 'dosage_form',
      'strength': 'strength',
      'unit_price': 'unit_price',
      'stock_quantity': 'stock_quantity',
      'quantity_in_stock': 'stock_quantity', // Map frontend field to DB field
      'reorder_level': 'reorder_level',
      'manufacturer': 'manufacturer',
      'expiry_date': 'expiry_date',
      'description': 'description'
    };
    
    for (const [bodyField, dbField] of Object.entries(allowedFields)) {
      if (req.body[bodyField] !== undefined) {
        updates.push(`${dbField} = ?`);
        values.push(req.body[bodyField]);
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(req.params.id);
    
    await db.execute(
      `UPDATE medications SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'medication.updated', 
       JSON.stringify({ medication_id: req.params.id, fields: Object.keys(req.body) })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('medications', 'medication:updated', { id: req.params.id });
    }
    
    res.json({ message: 'Medication updated successfully' });
  } catch (error) {
    console.error('Update medication error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      error: 'Failed to update medication',
      details: error.message 
    });
  }
};

// Dispense prescription
exports.dispensePrescription = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const prescriptionId = req.params.id;
    
    // Get prescription details
    const [prescriptions] = await connection.execute(
      'SELECT * FROM prescriptions WHERE id = ?',
      [prescriptionId]
    );
    
    if (prescriptions.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Prescription not found' });
    }
    
    const prescription = prescriptions[0];
    
    if (prescription.status === 'Dispensed') {
      await connection.rollback();
      return res.status(400).json({ error: 'Prescription already dispensed' });
    }
    
    // Update medication stock if medication_id exists
    if (prescription.medication_id && prescription.quantity) {
      const [medications] = await connection.execute(
        'SELECT stock_quantity FROM medications WHERE id = ?',
        [prescription.medication_id]
      );
      
      if (medications.length > 0) {
        const currentStock = medications[0].stock_quantity;
        const newStock = currentStock - prescription.quantity;
        
        if (newStock < 0) {
          await connection.rollback();
          return res.status(400).json({ error: 'Insufficient stock' });
        }
        
        await connection.execute(
          'UPDATE medications SET stock_quantity = ? WHERE id = ?',
          [newStock, prescription.medication_id]
        );
      }
    }
    
    // Update prescription status
    await connection.execute(
      `UPDATE prescriptions 
       SET status = 'Dispensed', dispensed_date = NOW()
       WHERE id = ?`,
      [prescriptionId]
    );
    
    // Log activity
    await connection.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'prescription.dispensed', 
       JSON.stringify({ 
         prescription_id: prescriptionId,
         patient_id: prescription.patient_id,
         medication: prescription.medication_name
       })]
    );
    
    await connection.commit();
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('prescriptions', 'prescription:dispensed', { 
        id: prescriptionId,
        patient_id: prescription.patient_id
      });
    }
    
    res.json({ message: 'Prescription dispensed successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Dispense prescription error:', error);
    res.status(500).json({ error: 'Failed to dispense prescription' });
  } finally {
    connection.release();
  }
};

// Update medication stock
exports.updateStock = async (req, res) => {
  try {
    const { stock_quantity } = req.body;
    
    if (stock_quantity === undefined) {
      return res.status(400).json({ error: 'Stock quantity is required' });
    }
    
    await db.execute(
      'UPDATE medications SET stock_quantity = ? WHERE id = ?',
      [stock_quantity, req.params.id]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'medication.stock.updated', 
       JSON.stringify({ medication_id: req.params.id, new_stock: stock_quantity })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('medications', 'medication:stock_updated', { 
        id: req.params.id,
        stock_quantity
      });
    }
    
    res.json({ message: 'Stock updated successfully' });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
};

// Get low stock medications
exports.getLowStock = async (req, res) => {
  try {
    const [medications] = await db.execute(
      'SELECT * FROM medications WHERE stock_quantity <= reorder_level ORDER BY stock_quantity ASC'
    );
    
    res.json({ medications });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock medications' });
  }
};
