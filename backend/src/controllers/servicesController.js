const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get all medical services
exports.getAllServices = async (req, res) => {
  try {
    const { is_active, service_type } = req.query;
    
    let query = 'SELECT * FROM medical_services WHERE 1=1';
    const params = [];
    
    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }
    
    if (service_type) {
      query += ' AND service_type = ?';
      params.push(service_type);
    }
    
    query += ' ORDER BY service_type, service_name';
    
    const [services] = await db.execute(query, params);
    
    res.json({
      success: true,
      services,
      count: services.length
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch services',
      details: error.message
    });
  }
};

// Get service by ID
exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [services] = await db.execute(
      'SELECT * FROM medical_services WHERE id = ?',
      [id]
    );
    
    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      service: services[0]
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service',
      details: error.message
    });
  }
};

// Create new service
exports.createService = async (req, res) => {
  try {
    const {
      service_code,
      service_name,
      service_type,
      description,
      base_price,
      currency = 'TSh',
      is_active = true
    } = req.body;
    
    // Validate required fields
    if (!service_code || !service_name || !service_type || base_price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: service_code, service_name, service_type, base_price'
      });
    }
    
    // Check if service code already exists
    const [existing] = await db.execute(
      'SELECT id FROM medical_services WHERE service_code = ?',
      [service_code]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Service code already exists'
      });
    }
    
    const id = uuidv4();
    
    await db.execute(
      `INSERT INTO medical_services 
       (id, service_code, service_name, service_type, description, base_price, currency, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, service_code, service_name, service_type, description, base_price, currency, is_active]
    );
    
    const [newService] = await db.execute(
      'SELECT * FROM medical_services WHERE id = ?',
      [id]
    );
    
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service: newService[0]
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create service',
      details: error.message
    });
  }
};

// Update service
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      service_code,
      service_name,
      service_type,
      description,
      base_price,
      currency,
      is_active
    } = req.body;
    
    // Check if service exists
    const [existing] = await db.execute(
      'SELECT id FROM medical_services WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const params = [];
    
    if (service_code !== undefined) {
      updates.push('service_code = ?');
      params.push(service_code);
    }
    if (service_name !== undefined) {
      updates.push('service_name = ?');
      params.push(service_name);
    }
    if (service_type !== undefined) {
      updates.push('service_type = ?');
      params.push(service_type);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (base_price !== undefined) {
      updates.push('base_price = ?');
      params.push(base_price);
    }
    if (currency !== undefined) {
      updates.push('currency = ?');
      params.push(currency);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }
    
    updates.push('updated_at = NOW()');
    params.push(id);
    
    await db.execute(
      `UPDATE medical_services SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    const [updatedService] = await db.execute(
      'SELECT * FROM medical_services WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Service updated successfully',
      service: updatedService[0]
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update service',
      details: error.message
    });
  }
};

// Delete service
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if service exists
    const [existing] = await db.execute(
      'SELECT id FROM medical_services WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    await db.execute('DELETE FROM medical_services WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete service',
      details: error.message
    });
  }
};

// Bulk import services
exports.bulkImportServices = async (req, res) => {
  try {
    const { services } = req.body;
    
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid services array'
      });
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const service of services) {
      try {
        const {
          service_code,
          service_name,
          service_type,
          description,
          base_price,
          currency = 'TSh',
          is_active = true
        } = service;
        
        // Validate required fields
        if (!service_code || !service_name || !service_type || base_price === undefined) {
          results.failed++;
          results.errors.push({
            service_code,
            error: 'Missing required fields'
          });
          continue;
        }
        
        // Check if service already exists
        const [existing] = await db.execute(
          'SELECT id FROM medical_services WHERE service_code = ?',
          [service_code]
        );
        
        if (existing.length > 0) {
          // Update existing service
          await db.execute(
            `UPDATE medical_services 
             SET service_name = ?, service_type = ?, description = ?, 
                 base_price = ?, currency = ?, is_active = ?, updated_at = NOW()
             WHERE service_code = ?`,
            [service_name, service_type, description, base_price, currency, is_active, service_code]
          );
        } else {
          // Insert new service
          const id = uuidv4();
          await db.execute(
            `INSERT INTO medical_services 
             (id, service_code, service_name, service_type, description, base_price, currency, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, service_code, service_name, service_type, description, base_price, currency, is_active]
          );
        }
        
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          service_code: service.service_code,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Imported ${results.success} services, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error('Error bulk importing services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk import services',
      details: error.message
    });
  }
};
