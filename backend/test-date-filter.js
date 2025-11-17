const db = require('./src/config/database');

async function testDateFilter() {
  try {
    const today = '2025-11-17';
    console.log('Testing date filter for:', today, '\n');
    
    // Test the OLD query (what was used before)
    console.log('1. OLD Query (DATE function):');
    const [oldResults] = await db.execute(`
      SELECT COUNT(*) as count, SUM(amount) as total
      FROM payments
      WHERE DATE(payment_date) = ?
    `, [today]);
    console.log('   Results:', oldResults[0]);
    
    // Test the NEW query (what we changed to)
    console.log('\n2. NEW Query (DATE_FORMAT function):');
    const [newResults] = await db.execute(`
      SELECT COUNT(*) as count, SUM(amount) as total
      FROM payments
      WHERE DATE_FORMAT(created_at, "%Y-%m-%d") = ?
    `, [today]);
    console.log('   Results:', newResults[0]);
    
    // Show what dates are actually in the database
    console.log('\n3. Actual dates in database:');
    const [allPayments] = await db.execute(`
      SELECT 
        amount,
        DATE_FORMAT(created_at, "%Y-%m-%d") as formatted_date,
        created_at
      FROM payments
      ORDER BY created_at DESC
      LIMIT 5
    `);
    allPayments.forEach(p => {
      console.log(`   TSh ${p.amount} - formatted: ${p.formatted_date} - raw: ${p.created_at}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDateFilter();
