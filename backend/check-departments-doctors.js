const db = require('./src/config/database');

async function checkDepartmentsAndDoctors() {
  try {
    console.log('Checking departments and doctors...\n');
    
    // Check departments
    const [departments] = await db.execute('SELECT * FROM departments ORDER BY name');
    console.log(`✓ Found ${departments.length} departments:`);
    departments.forEach(dept => {
      console.log(`  - ${dept.name} (ID: ${dept.id})`);
    });
    
    console.log('');
    
    // Check doctors (users with doctor role)
    const [doctors] = await db.execute(`
      SELECT u.id, u.email, u.full_name, ur.role
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role = 'doctor' AND u.is_active = TRUE
      ORDER BY u.full_name
    `);
    console.log(`✓ Found ${doctors.length} doctors:`);
    doctors.forEach(doc => {
      console.log(`  - ${doc.full_name || doc.email} (ID: ${doc.id})`);
    });
    
    console.log('');
    
    // Check department-doctor assignments
    const [assignments] = await db.execute(`
      SELECT dd.id, d.name as department_name, u.full_name as doctor_name
      FROM department_doctors dd
      INNER JOIN departments d ON dd.department_id = d.id
      INNER JOIN users u ON dd.doctor_id = u.id
      ORDER BY d.name, u.full_name
    `);
    console.log(`✓ Found ${assignments.length} department-doctor assignments:`);
    assignments.forEach(assign => {
      console.log(`  - ${assign.department_name} → ${assign.doctor_name}`);
    });
    
    if (departments.length === 0) {
      console.log('\n⚠ WARNING: No departments found! Run setup script to create departments.');
    }
    
    if (doctors.length === 0) {
      console.log('\n⚠ WARNING: No doctors found! Assign doctor role to users.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDepartmentsAndDoctors();
