const db = require('./src/config/database');

async function calculateTodayRevenue() {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('Calculating revenue for:', today, '\n');
    
    // Get all payments
    const [allPayments] = await db.execute(`
      SELECT 
        id,
        amount,
        payment_method,
        created_at,
        DATE(created_at) as payment_date
      FROM payments
      ORDER BY created_at DESC
    `);
    
    console.log(`Total payments in database: ${allPayments.length}\n`);
    
    // Calculate total of ALL payments
    const totalAll = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    console.log(`Total of ALL payments: TSh ${totalAll.toLocaleString()}`);
    console.log(`(This is what you're seeing: TSh 3,785,443)\n`);
    
    // Filter today's payments
    const todayPayments = allPayments.filter(p => {
      const pDate = p.payment_date || new Date(p.created_at).toISOString().split('T')[0];
      return pDate === today;
    });
    
    console.log(`Payments made TODAY (${today}): ${todayPayments.length}\n`);
    
    if (todayPayments.length > 0) {
      let todayTotal = 0;
      todayPayments.forEach((p, i) => {
        console.log(`${i + 1}. TSh ${Number(p.amount).toLocaleString()} - ${p.payment_method} at ${p.created_at}`);
        todayTotal += Number(p.amount);
      });
      console.log(`\n✓ TODAY'S ACTUAL REVENUE: TSh ${todayTotal.toLocaleString()}`);
    } else {
      console.log('❌ No payments made today');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

calculateTodayRevenue();
