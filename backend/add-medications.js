const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function addMedications() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    console.log('Adding medications to database...\n');

    const medications = [
      // Antibiotics
      { name: 'Amoxicillin 500mg', category: 'Antibiotic', unit: 'Capsule', price: 500, stock: 1000, description: 'Broad-spectrum antibiotic' },
      { name: 'Azithromycin 250mg', category: 'Antibiotic', unit: 'Tablet', price: 800, stock: 500, description: 'Macrolide antibiotic' },
      { name: 'Ciprofloxacin 500mg', category: 'Antibiotic', unit: 'Tablet', price: 600, stock: 800, description: 'Fluoroquinolone antibiotic' },
      { name: 'Metronidazole 400mg', category: 'Antibiotic', unit: 'Tablet', price: 300, stock: 1000, description: 'Antibiotic and antiprotozoal' },
      { name: 'Doxycycline 100mg', category: 'Antibiotic', unit: 'Capsule', price: 400, stock: 600, description: 'Tetracycline antibiotic' },
      
      // Pain Relief
      { name: 'Paracetamol 500mg', category: 'Analgesic', unit: 'Tablet', price: 100, stock: 2000, description: 'Pain reliever and fever reducer' },
      { name: 'Ibuprofen 400mg', category: 'NSAID', unit: 'Tablet', price: 200, stock: 1500, description: 'Anti-inflammatory pain reliever' },
      { name: 'Diclofenac 50mg', category: 'NSAID', unit: 'Tablet', price: 250, stock: 1000, description: 'Non-steroidal anti-inflammatory' },
      { name: 'Tramadol 50mg', category: 'Analgesic', unit: 'Capsule', price: 500, stock: 500, description: 'Opioid pain medication' },
      
      // Antimalarials
      { name: 'Artemether-Lumefantrine (Coartem)', category: 'Antimalarial', unit: 'Tablet', price: 1500, stock: 800, description: 'First-line malaria treatment' },
      { name: 'Quinine 300mg', category: 'Antimalarial', unit: 'Tablet', price: 400, stock: 600, description: 'Severe malaria treatment' },
      { name: 'Artesunate Injection', category: 'Antimalarial', unit: 'Vial', price: 3000, stock: 200, description: 'Injectable antimalarial' },
      
      // Antihypertensives
      { name: 'Amlodipine 5mg', category: 'Antihypertensive', unit: 'Tablet', price: 300, stock: 1000, description: 'Calcium channel blocker' },
      { name: 'Enalapril 10mg', category: 'Antihypertensive', unit: 'Tablet', price: 400, stock: 800, description: 'ACE inhibitor' },
      { name: 'Hydrochlorothiazide 25mg', category: 'Diuretic', unit: 'Tablet', price: 200, stock: 1000, description: 'Thiazide diuretic' },
      { name: 'Losartan 50mg', category: 'Antihypertensive', unit: 'Tablet', price: 500, stock: 600, description: 'Angiotensin receptor blocker' },
      
      // Diabetes
      { name: 'Metformin 500mg', category: 'Antidiabetic', unit: 'Tablet', price: 300, stock: 1500, description: 'First-line diabetes medication' },
      { name: 'Glibenclamide 5mg', category: 'Antidiabetic', unit: 'Tablet', price: 250, stock: 1000, description: 'Sulfonylurea for diabetes' },
      { name: 'Insulin (Human) 100IU/ml', category: 'Antidiabetic', unit: 'Vial', price: 5000, stock: 300, description: 'Injectable insulin' },
      
      // Respiratory
      { name: 'Salbutamol Inhaler', category: 'Bronchodilator', unit: 'Inhaler', price: 2000, stock: 400, description: 'Asthma reliever' },
      { name: 'Prednisolone 5mg', category: 'Corticosteroid', unit: 'Tablet', price: 300, stock: 800, description: 'Anti-inflammatory steroid' },
      { name: 'Cetirizine 10mg', category: 'Antihistamine', unit: 'Tablet', price: 150, stock: 1000, description: 'Allergy medication' },
      
      // Gastrointestinal
      { name: 'Omeprazole 20mg', category: 'PPI', unit: 'Capsule', price: 400, stock: 1000, description: 'Proton pump inhibitor' },
      { name: 'Ranitidine 150mg', category: 'H2 Blocker', unit: 'Tablet', price: 200, stock: 1200, description: 'Acid reducer' },
      { name: 'Loperamide 2mg', category: 'Antidiarrheal', unit: 'Capsule', price: 150, stock: 800, description: 'Diarrhea treatment' },
      { name: 'Oral Rehydration Salts (ORS)', category: 'Electrolyte', unit: 'Sachet', price: 100, stock: 2000, description: 'Rehydration solution' },
      
      // Vitamins & Supplements
      { name: 'Multivitamin Tablets', category: 'Vitamin', unit: 'Tablet', price: 200, stock: 1500, description: 'Daily multivitamin' },
      { name: 'Vitamin B Complex', category: 'Vitamin', unit: 'Tablet', price: 250, stock: 1000, description: 'B vitamins supplement' },
      { name: 'Folic Acid 5mg', category: 'Vitamin', unit: 'Tablet', price: 150, stock: 1200, description: 'Folate supplement' },
      { name: 'Iron Tablets (Ferrous Sulfate)', category: 'Supplement', unit: 'Tablet', price: 200, stock: 1000, description: 'Iron supplement for anemia' },
      
      // Antivirals
      { name: 'Acyclovir 400mg', category: 'Antiviral', unit: 'Tablet', price: 600, stock: 500, description: 'Herpes treatment' },
      { name: 'Oseltamivir 75mg (Tamiflu)', category: 'Antiviral', unit: 'Capsule', price: 2000, stock: 300, description: 'Influenza treatment' },
      
      // Antifungals
      { name: 'Fluconazole 150mg', category: 'Antifungal', unit: 'Capsule', price: 800, stock: 600, description: 'Fungal infection treatment' },
      { name: 'Clotrimazole Cream', category: 'Antifungal', unit: 'Tube', price: 500, stock: 400, description: 'Topical antifungal' },
      
      // Others
      { name: 'Aspirin 75mg', category: 'Antiplatelet', unit: 'Tablet', price: 100, stock: 2000, description: 'Blood thinner' },
      { name: 'Atorvastatin 20mg', category: 'Statin', unit: 'Tablet', price: 600, stock: 800, description: 'Cholesterol medication' },
      { name: 'Levothyroxine 100mcg', category: 'Thyroid', unit: 'Tablet', price: 400, stock: 600, description: 'Thyroid hormone replacement' },
      { name: 'Diazepam 5mg', category: 'Anxiolytic', unit: 'Tablet', price: 300, stock: 400, description: 'Anti-anxiety medication' },
      { name: 'Chlorpheniramine 4mg', category: 'Antihistamine', unit: 'Tablet', price: 100, stock: 1500, description: 'Allergy relief' },
      { name: 'Mebendazole 100mg', category: 'Anthelmintic', unit: 'Tablet', price: 200, stock: 1000, description: 'Deworming medication' }
    ];

    let inserted = 0;
    let skipped = 0;

    for (const med of medications) {
      try {
        // Check if medication already exists
        const [existing] = await connection.execute(
          'SELECT id FROM medications WHERE name = ?',
          [med.name]
        );

        if (existing.length > 0) {
          console.log(`⏭️  Skipped: ${med.name} (already exists)`);
          skipped++;
          continue;
        }

        // Insert medication
        await connection.execute(
          `INSERT INTO medications (
            id, name, category, unit, unit_price, stock_quantity, 
            reorder_level, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            med.name,
            med.category,
            med.unit,
            med.price,
            med.stock,
            Math.floor(med.stock * 0.2), // Reorder at 20% of stock
            med.description
          ]
        );

        console.log(`✅ Added: ${med.name} - ${med.price} TZS - Stock: ${med.stock}`);
        inserted++;
      } catch (error) {
        console.error(`❌ Error adding ${med.name}:`, error.message);
      }
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   ✅ Inserted: ${inserted} medications`);
    console.log(`   ⏭️  Skipped: ${skipped} medications (already exist)`);
    console.log(`   📦 Total: ${medications.length} medications`);
    
    // Show total count in database
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM medications');
    console.log(`\n   💊 Total medications in database: ${count[0].total}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

addMedications();
