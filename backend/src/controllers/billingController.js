const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const { patient_id, status, limit = 100, offset = 0 } = req.query;
    
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
    
    query += ' ORDER BY i.invoice_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [invoices] = await db.execute(query, params);
    
    res.json({ invoices });
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
      patient_id, visit_id, items, tax_amount, discount_amount, notes
    } = req.body;
    
    if (!patient_id || !items || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Patient ID and items are required' });
    }
    
    // Calculate total
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const total = subtotal + (tax_amount || 0) - (discount_amount || 0);
    
    // Generate invoice number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const invoiceNumber = `INV-${timestamp}-${random}`;
    
    const invoiceId = uuidv4();
    const invoiceDate = new Date().toISOString().split('T')[0];
    
    // Create invoice
    await connection.execute(
      `INSERT INTO invoices (
        id, invoice_number, patient_id, visit_id, total_amount,
        tax_amount, discount_amount, status, invoice_date, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?)`,
      [invoiceId, invoiceNumber, patient_id, visit_id, total, 
       tax_amount || 0, discount_amount || 0, invoiceDate, notes, req.user.id]
    );
    
    // Create invoice items
    for (const item of items) {
      const itemId = uuidv4();
      const totalPrice = item.quantity * item.unit_price;
      
      await connection.execute(
        `INSERT INTO invoice_items (
          id, invoice_id, item_type, item_id, description,
          quantity, unit_price, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [itemId, invoiceId, item.item_type, item.item_id, item.description,
         item.quantity, item.unit_price, totalPrice]
      );
    }
    
    // Log activity
    await connection.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'invoice.created', 
       JSON.stringify({ invoice_id: invoiceId, invoice_number: invoiceNumber, patient_id, total })]
    );
    
    await connection.commit();
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('invoices', 'invoice:created', { 
        id: invoiceId,
        invoice_number: invoiceNumber
      });
    }
    
    res.status(201).json({ 
      message: 'Invoice created successfully',
      invoiceId,
      invoiceNumber
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
    const { status, notes } = req.body;
    
    const updateData = { status, notes };
    if (status === 'Paid') {
      updateData.paid_at = new Date().toISOString();
    }
    
    await db.execute(
      'UPDATE invoices SET status = ?, notes = ?, paid_at = ? WHERE id = ?',
      [status, notes, updateData.paid_at || null, req.params.id]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'invoice.updated', 
       JSON.stringify({ invoice_id: req.params.id, status })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('invoices', 'invoice:updated', { id: req.params.id, status });
    }
    
    res.json({ message: 'Invoice updated successfully' });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
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
    
    // Record payment
    await connection.execute(
      `INSERT INTO payments (
        id, invoice_id, amount, payment_method, transaction_id,
        status, notes, received_by
      ) VALUES (?, ?, ?, ?, ?, 'Completed', ?, ?)`,
      [paymentId, invoice_id, amount, payment_method, transaction_id, notes, req.user.id]
    );
    
    // Get total payments for this invoice
    const [paymentSums] = await connection.execute(
      'SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = ? AND status = "Completed"',
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
    
    await connection.execute(
      'UPDATE invoices SET status = ?, paid_at = ? WHERE id = ?',
      [newStatus, newStatus === 'Paid' ? new Date().toISOString() : null, invoice_id]
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
