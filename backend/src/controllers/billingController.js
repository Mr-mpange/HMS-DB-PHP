const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const { patient_id, status, from, to, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT i.*, 
             p.full_name as patient_name, p.phone as patient_phone
      FROM invoices i
      LEFT JOIN patients p ON i.patient_id = p.id
      WHERE 1=1
    `;
    let params = [];
    
    if (patient_id) {
      query += ' AND i.patient_id = ?';
      params.push(patient_id);
    }
    
    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }
    
    // Add date filtering
    if (from) {
      query += ' AND i.invoice_date >= ?';
      params.push(from);
    }
    
    if (to) {
      query += ' AND i.invoice_date <= ?';
      params.push(to);
    }
    
    query += ' ORDER BY i.invoice_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [invoices] = await db.execute(query, params);
    
    // Format invoices to include patient object
    const formattedInvoices = invoices.map(invoice => ({
      ...invoice,
      patient: {
        id: invoice.patient_id,
        full_name: invoice.patient_name,
        phone: invoice.patient_phone
      }
    }));
    
    res.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

// Get single invoice with items
exports.getInvoice = async (req, res) => {
  try {
    const [invoices] = await db.execute(
      `SELECT i.*, 
              p.full_name as patient_name, p.phone as patient_phone, p.email as patient_email
       FROM invoices i
       LEFT JOIN patients p ON i.patient_id = p.id
       WHERE i.id = ?`,
      [req.params.id]
    );
    
    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Get invoice items
    const [items] = await db.execute(
      'SELECT * FROM invoice_items WHERE invoice_id = ?',
      [req.params.id]
    );
    
    // Get payments
    const [payments] = await db.execute(
      `SELECT p.*, u.full_name as received_by_name
       FROM payments p
       LEFT JOIN users u ON p.received_by = u.id
       WHERE p.invoice_id = ?`,
      [req.params.id]
    );
    
    res.json({ 
      invoice: invoices[0],
      items,
      payments
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

// Create invoice
exports.createInvoice = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      patient_id, visit_id, items, tax_amount, discount_amount, notes,
      invoice_number, total_amount, paid_amount, balance, status, invoice_date, due_date
    } = req.body;
    
    if (!patient_id) {
      await connection.rollback();
      return res.status(400).json({ error: 'Patient ID is required' });
    }
    
    // Calculate total - use provided total_amount or calculate from items
    let total;
    if (total_amount !== undefined) {
      total = total_amount;
    } else if (items && items.length > 0) {
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      total = subtotal + (tax_amount || 0) - (discount_amount || 0);
    } else {
      await connection.rollback();
      return res.status(400).json({ error: 'Either total_amount or items are required' });
    }
    
    const finalBalance = balance !== undefined ? balance : (total - (paid_amount || 0));
    
    // Generate or use provided invoice number
    let finalInvoiceNumber;
    if (invoice_number) {
      finalInvoiceNumber = invoice_number;
    } else {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      finalInvoiceNumber = `INV-${timestamp}-${random}`;
    }
    
    const invoiceId = uuidv4();
    const finalInvoiceDate = invoice_date || new Date().toISOString().split('T')[0];
    const finalDueDate = due_date || null;
    const finalStatus = status || 'Pending';
    const finalPaidAmount = paid_amount || 0;
    const itemsJson = items ? JSON.stringify(items) : null;
    const finalNotes = notes || null;
    
    console.log('Creating invoice:', {
      invoiceId,
      finalInvoiceNumber,
      patient_id,
      total,
      finalBalance,
      itemsCount: items?.length || 0
    });
    
    // Create invoice
    await connection.execute(
      `INSERT INTO invoices (
        id, invoice_number, patient_id, visit_id, invoice_date, due_date,
        total_amount, paid_amount, balance, status, items, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoiceId, finalInvoiceNumber, patient_id, visit_id, finalInvoiceDate, finalDueDate,
       total, finalPaidAmount, finalBalance, finalStatus, itemsJson, finalNotes]
    );
    
    // Log activity
    await connection.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'invoice.created', 
       JSON.stringify({ invoice_id: invoiceId, invoice_number: finalInvoiceNumber, patient_id, total })]
    );
    
    await connection.commit();
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('invoices', 'invoice:created', { 
        id: invoiceId,
        invoice_number: finalInvoiceNumber
      });
    }
    
    res.status(201).json({ 
      message: 'Invoice created successfully',
      invoice: {
        id: invoiceId,
        invoice_number: finalInvoiceNumber,
        patient_id,
        total_amount: total,
        status: finalStatus
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  } finally {
    connection.release();
  }
};

// Update invoice
exports.updateInvoice = async (req, res) => {
  try {
    const updates = [];
    const values = [];
    
    const allowedFields = ['status', 'notes', 'paid_amount', 'balance'];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(req.params.id);
    
    await db.execute(
      `UPDATE invoices SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'invoice.updated', 
       JSON.stringify({ invoice_id: req.params.id, updates: req.body })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('invoices', 'invoice:updated', { id: req.params.id });
    }
    
    res.json({ message: 'Invoice updated successfully' });
  } catch (error) {
    console.error('Update invoice error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      error: 'Failed to update invoice',
      details: error.message 
    });
  }
};

// Record payment
exports.recordPayment = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      invoice_id, amount, payment_method, transaction_id, notes
    } = req.body;
    
    if (!invoice_id || !amount || !payment_method) {
      await connection.rollback();
      return res.status(400).json({ error: 'Invoice ID, amount, and payment method are required' });
    }
    
    // Get invoice
    const [invoices] = await connection.execute(
      'SELECT * FROM invoices WHERE id = ?',
      [invoice_id]
    );
    
    if (invoices.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const invoice = invoices[0];
    const paymentId = uuidv4();
    
    // Ensure optional fields are null instead of undefined
    const finalTransactionId = transaction_id || null;
    const finalNotes = notes || null;
    
    // Record payment
    await connection.execute(
      `INSERT INTO payments (
        id, invoice_id, amount, payment_method, reference_number,
        notes, received_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [paymentId, invoice_id, amount, payment_method, finalTransactionId, finalNotes, req.user.id]
    );
    
    // Get total payments for this invoice
    const [paymentSums] = await connection.execute(
      'SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = ?',
      [invoice_id]
    );
    
    const totalPaid = paymentSums[0].total_paid || 0;
    
    // Update invoice status
    let newStatus = 'Pending';
    if (totalPaid >= invoice.total_amount) {
      newStatus = 'Paid';
    } else if (totalPaid > 0) {
      newStatus = 'Partially Paid';
    }
    
    // Update invoice status and paid_amount
    await connection.execute(
      'UPDATE invoices SET status = ?, paid_amount = ?, balance = ? WHERE id = ?',
      [newStatus, totalPaid, invoice.total_amount - totalPaid, invoice_id]
    );
    
    // Log activity
    await connection.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'payment.received', 
       JSON.stringify({ 
         payment_id: paymentId,
         invoice_id,
         patient_id: invoice.patient_id,
         amount,
         payment_method,
         transaction_id
       })]
    );
    
    await connection.commit();
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('payments', 'payment:received', { 
        id: paymentId,
        invoice_id,
        amount
      });
    }
    
    res.status(201).json({ 
      message: 'Payment recorded successfully',
      paymentId,
      invoiceStatus: newStatus
    });
  } catch (error) {
    await connection.rollback();
    console.error('Record payment error:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  } finally {
    connection.release();
  }
};

// Get payments
exports.getPayments = async (req, res) => {
  try {
    const { invoice_id, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT p.*, 
             i.invoice_number,
             pt.full_name as patient_name,
             u.full_name as received_by_name
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN patients pt ON i.patient_id = pt.id
      LEFT JOIN users u ON p.received_by = u.id
      WHERE 1=1
    `;
    let params = [];
    
    if (invoice_id) {
      query += ' AND p.invoice_id = ?';
      params.push(invoice_id);
    }
    
    query += ' ORDER BY p.payment_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [payments] = await db.execute(query, params);
    
    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};


// Create invoice item
exports.createInvoiceItem = async (req, res) => {
  try {
    const { 
      invoice_id, item_type, description, quantity, unit_price, total_price
    } = req.body;
    
    if (!invoice_id || !description || !quantity || !unit_price) {
      return res.status(400).json({ error: 'Invoice ID, description, quantity, and unit_price are required' });
    }
    
    const itemId = uuidv4();
    const finalTotalPrice = total_price || (quantity * unit_price);
    
    await db.execute(
      `INSERT INTO invoice_items (
        id, invoice_id, item_type, description, quantity, unit_price, total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [itemId, invoice_id, item_type || 'Medication', description, quantity, unit_price, finalTotalPrice]
    );
    
    res.status(201).json({ 
      message: 'Invoice item created successfully',
      itemId
    });
  } catch (error) {
    console.error('Create invoice item error:', error);
    res.status(500).json({ error: 'Failed to create invoice item' });
  }
};
