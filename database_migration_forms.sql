-- ============================================
-- Database Migration: Service Forms System
-- ============================================
-- Run this SQL file to add form functionality
-- ============================================

-- Step 1: Add form columns to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS requires_form BOOLEAN DEFAULT FALSE COMMENT 'Whether this service requires a form',
ADD COLUMN IF NOT EXISTS form_template JSON NULL COMMENT 'JSON template for form fields';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_requires_form ON services(requires_form);

-- Step 2: Create service_forms table
CREATE TABLE IF NOT EXISTS service_forms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  visit_id INT NOT NULL,
  patient_id INT NOT NULL,
  service_id INT NULL,
  form_data JSON NOT NULL,
  completed_by INT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by) REFERENCES users(id),
  
  INDEX idx_visit (visit_id),
  INDEX idx_patient (patient_id),
  INDEX idx_completed_at (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Add example form template to COVID-19 Vaccination service
UPDATE services 
SET 
  requires_form = TRUE,
  form_template = '{
    "title": "COVID-19 Vaccination Record",
    "fields": [
      {
        "name": "vaccine_name",
        "label": "Vaccine Name",
        "type": "select",
        "required": true,
        "options": ["Pfizer-BioNTech", "Moderna", "AstraZeneca", "Johnson & Johnson", "Sinopharm"]
      },
      {
        "name": "batch_number",
        "label": "Batch/Lot Number",
        "type": "text",
        "required": true,
        "placeholder": "Enter batch number"
      },
      {
        "name": "dose_number",
        "label": "Dose Number",
        "type": "select",
        "required": true,
        "options": ["1st Dose", "2nd Dose", "Booster Dose"]
      },
      {
        "name": "injection_site",
        "label": "Injection Site",
        "type": "select",
        "required": true,
        "options": ["Left Arm (Deltoid)", "Right Arm (Deltoid)"]
      },
      {
        "name": "adverse_reactions",
        "label": "Adverse Reactions (if any)",
        "type": "textarea",
        "required": false,
        "placeholder": "Note any immediate reactions",
        "rows": 3
      },
      {
        "name": "next_dose_date",
        "label": "Next Dose Due Date",
        "type": "date",
        "required": false
      }
    ]
  }'
WHERE service_name LIKE '%COVID%' OR service_name LIKE '%Vaccination%'
LIMIT 1;

-- Verification queries
SELECT 'Services table updated' as status, 
       COUNT(*) as services_with_forms 
FROM services 
WHERE requires_form = TRUE;

SELECT 'service_forms table created' as status,
       COUNT(*) as existing_forms
FROM service_forms;

-- Done!
SELECT '✅ Migration completed successfully!' as message;
