const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Get all settings
exports.getAllSettings = async (req, res) => {
  try {
    const [settings] = await db.execute(
      'SELECT * FROM system_settings ORDER BY key ASC'
    );
    
    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    res.json({ settings: settingsObj, settingsArray: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// Get single setting
exports.getSetting = async (req, res) => {
  try {
    const [settings] = await db.execute(
      'SELECT * FROM system_settings WHERE `key` = ?',
      [req.params.key]
    );
    
    if (settings.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ key: settings[0].key, value: settings[0].value });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
};

// Create setting
exports.createSetting = async (req, res) => {
  try {
    const { key, value, description } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required' });
    }
    
    const settingId = uuidv4();
    
    await db.execute(
      'INSERT INTO system_settings (id, `key`, value, description) VALUES (?, ?, ?, ?)',
      [settingId, key, value, description || null]
    );
    
    res.status(201).json({ message: 'Setting created successfully' });
  } catch (error) {
    console.error('Create setting error:', error);
    res.status(500).json({ error: 'Failed to create setting' });
  }
};

// Update setting
exports.updateSetting = async (req, res) => {
  try {
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }
    
    await db.execute(
      'UPDATE system_settings SET value = ? WHERE `key` = ?',
      [value, req.params.key]
    );
    
    res.json({ message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
};
