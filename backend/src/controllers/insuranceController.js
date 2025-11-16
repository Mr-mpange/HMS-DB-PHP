const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Get all insurance companies
exports.getAllCompanies = async (req, res) => {
  try {
    const { search, limit = 100, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM insurance_companies WHERE 1=1';
    let params = [];
    
    if (search) {
      query += ' AND (name LIKE ? OR code LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [companies] = await db.execute(query, params);
    
    res.json({ companies });
  } catch (error) {
    console.error('Get insurance companies error:', error);
    res.status(500).json({ error: 'Failed to fetch insurance companies' });
  }
};

// Get single insurance company
exports.getCompany = async (req, res) => {
  try {
    const [companies] = await db.execute(
      'SELECT * FROM insurance_companies WHERE id = ?',
      [req.params.id]
    );
    
    if (companies.length === 0) {
      return res.status(404).json({ error: 'Insurance company not found' });
    }
    
    res.json({ company: companies[0] });
  } catch (error) {
    console.error('Get insurance company error:', error);
    res.status(500).json({ error: 'Failed to fetch insurance company' });
  }
};

// Create insurance company
exports.createCompany = async (req, res) => {
  try {
    const { name, code, contact_person, phone, email, address } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }
    
    const companyId = uuidv4();
    
    await db.execute(
      `INSERT INTO insurance_companies (id, name, code, contact_person, phone, email, address) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [companyId, name, code, contact_person, phone, email, address]
    );
    
    res.status(201).json({ 
      message: 'Insurance company created successfully',
      companyId 
    });
  } catch (error) {
    console.error('Create insurance company error:', error);
    res.status(500).json({ error: 'Failed to create insurance company' });
  }
};

// Update insurance company
exports.updateCompany = async (req, res) => {
  try {
    const { name, code, contact_person, phone, email, address } = req.body;
    
    await db.execute(
      `UPDATE insurance_companies 
       SET name = ?, code = ?, contact_person = ?, phone = ?, email = ?, address = ?
       WHERE id = ?`,
      [name, code, contact_person, phone, email, address, req.params.id]
    );
    
    res.json({ message: 'Insurance company updated successfully' });
  } catch (error) {
    console.error('Update insurance company error:', error);
    res.status(500).json({ error: 'Failed to update insurance company' });
  }
};

// Get all insurance claims
exports.getAllClaims = async (req, res) => {
  try {
    const { patient_id, company_id, status, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT c.*, 
             p.full_name as patient_name,
             ic.name as company_name
      FROM insurance_claims c
      LEFT JOIN patients p ON c.patient_id = p.id
      LEFT JOIN insurance_companies ic ON c.insurance_company_id = ic.id
      WHERE 1=1
    `;
    let params = [];
    
    if (patient_id) {
      query += ' AND c.patient_id = ?';
      params.push(patient_id);
    }
    
    if (company_id) {
      query += ' AND c.insurance_company_id = ?';
      params.push(company_id);
    }
    
    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [claims] = await db.execute(query, params);
    
    res.json({ claims });
  } catch (error) {
    console.error('Get insurance claims error:', error);
    res.status(500).json({ error: 'Failed to fetch insurance claims' });
  }
};

// Get single insurance claim
exports.getClaim = async (req, res) => {
  try {
    const [claims] = await db.execute(
      `SELECT c.*, 
              p.full_name as patient_name,
              ic.name as company_name
       FROM insurance_claims c
       LEFT JOIN patients p ON c.patient_id = p.id
       LEFT JOIN insurance_companies ic ON c.insurance_company_id = ic.id
       WHERE c.id = ?`,
      [req.params.id]
    );
    
    if (claims.length === 0) {
      return res.status(404).json({ error: 'Insurance claim not found' });
    }
    
    res.json({ claim: claims[0] });
  } catch (error) {
    console.error('Get insurance claim error:', error);
    res.status(500).json({ error: 'Failed to fetch insurance claim' });
  }
};

// Create insurance claim
exports.createClaim = async (req, res) => {
  try {
    const { 
      patient_id, insurance_company_id, claim_number, claim_amount,
      diagnosis, treatment_details, status = 'Pending'
    } = req.body;
    
    if (!patient_id || !insurance_company_id || !claim_amount) {
      return res.status(400).json({ error: 'Patient ID, company ID, and amount are required' });
    }
    
    const claimId = uuidv4();
    
    await db.execute(
      `INSERT INTO insurance_claims (
        id, patient_id, insurance_company_id, claim_number, claim_amount,
        diagnosis, treatment_details, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [claimId, patient_id, insurance_company_id, claim_number, claim_amount,
       diagnosis, treatment_details, status]
    );
    
    res.status(201).json({ 
      message: 'Insurance claim created successfully',
      claimId 
    });
  } catch (error) {
    console.error('Create insurance claim error:', error);
    res.status(500).json({ error: 'Failed to create insurance claim' });
  }
};

// Update insurance claim
exports.updateClaim = async (req, res) => {
  try {
    const { status, approved_amount, rejection_reason } = req.body;
    
    const updates = [];
    const values = [];
    
    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    
    if (approved_amount !== undefined) {
      updates.push('approved_amount = ?');
      values.push(approved_amount);
    }
    
    if (rejection_reason) {
      updates.push('rejection_reason = ?');
      values.push(rejection_reason);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(req.params.id);
    
    await db.execute(
      `UPDATE insurance_claims SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    res.json({ message: 'Insurance claim updated successfully' });
  } catch (error) {
    console.error('Update insurance claim error:', error);
    res.status(500).json({ error: 'Failed to update insurance claim' });
  }
};
