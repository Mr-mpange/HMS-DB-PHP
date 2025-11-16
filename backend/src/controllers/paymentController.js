const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Get all payments
exports.getAllPayments = async (req, res) => {
  try {
    const { invoice_id, status, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT p.*
      FROM payments p
      WHERE 1=1
    `;
    let params = [];
    
    if (invoice_id) {
      query += ' AND p.invoice_id = ?';
      params.push(invoice_id);
    }
    
    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [payments] = await db.execute(query, params);
    
    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

// Get single payment
exports.getPayment = async (req, res) => {
  try {
    const [payments] = await db.execute(
      'SELECT * FROM payments WHERE id = ?',
      [req.params.id]
    );
    
    if (payments.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json({ payment: payments[0] });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
};

// Create payment
exports.createPayment = async (req, res) => {
  try {
    const { 
      invoice_id, amount, payment_method,
      payment_date, transaction_id, reference_number, notes
    } = req.body;
    
    if (!amount || !payment_method) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const paymentId = uuidv4();
    
    await db.execute(
      `INSERT INTO payments (
        id, invoice_id, amount, payment_method,
        payment_date, transaction_id, reference_number, notes,
        status, received_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId, invoice_id || null, amount, payment_method,
        payment_date || new Date().toISOString(),
        transaction_id || null, reference_number || null, notes || null,
        'completed', req.user.id
      ]
    );
    
    // If invoice_id is provided, update invoice paid amount
    if (invoice_id) {
      const [invoices] = await db.execute(
        'SELECT total_amount, paid_amount FROM invoices WHERE id = ?',
        [invoice_id]
      );
      
      if (invoices.length > 0) {
        const invoice = invoices[0];
        const newPaidAmount = (parseFloat(invoice.paid_amount) || 0) + parseFloat(amount);
        const newStatus = newPaidAmount >= parseFloat(invoice.total_amount) ? 'Paid' : 'Partially Paid';
        
        await db.execute(
          'UPDATE invoices SET paid_amount = ?, status = ? WHERE id = ?',
          [newPaidAmount, newStatus, invoice_id]
        );
      }
    }
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'payment.created', 
       JSON.stringify({ payment_id: paymentId, invoice_id, amount })]
    );
    
    res.status(201).json({ 
      message: 'Payment created successfully',
      paymentId 
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

// Update payment
exports.updatePayment = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    await db.execute(
      'UPDATE payments SET status = ?, notes = ? WHERE id = ?',
      [status, notes, req.params.id]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'payment.updated', 
       JSON.stringify({ payment_id: req.params.id, status })]
    );
    
    res.json({ message: 'Payment updated successfully' });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
};

// Delete payment
exports.deletePayment = async (req, res) => {
  try {
    await db.execute('DELETE FROM payments WHERE id = ?', [req.params.id]);
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'payment.deleted', JSON.stringify({ payment_id: req.params.id })]
    );
    
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
};
