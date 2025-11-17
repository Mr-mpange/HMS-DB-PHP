const db = require('./src/config/database');

async function checkTodayPayments() {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('Checking payments for today:', today, '\n');
    
    // Check all payments
    const [allPayments] = await db.execute(`
      SELECT 
        id,
        invoice_id,
        amount,
        payment_method,
        payment_date,
        created_at
      FROM payments
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    console.log(`Total payments in database: ${allPayments.length}\n`);
    
    // Filter today's payments
    const todayPayments = allPayments.filter(p => {
      const paymentDate = p.created_at ? p.created_at.toString().split('T')[0] : '';
      console.log('Comparing:', paymentDate, '===', today, '?', paymentDate === today);
      return paymentDate === today;
    });
    
    console.log(`Payments made today (${today}): ${todayPayments.length}\n`);
    
    if (todayPayments.length > 0) {
      let totalToday = 0;
      todayPayments.forEach((p, i) => {
        console.log(`${i + 1}. Amount: TSh ${p.amount}`);
        console.log(`   Method: ${p.payment_method}`);
        console.log(`   Time: ${p.created_at}`);
        console.log('');
        totalToday += Number(p.amount);
      });
      console.log(`✓ Today's Total Revenue: TSh ${totalToday.toLocaleString()}`);
    } else {
      console.log('❌ No payments recorded today');
      console.log('\nRecent payments:');
      allPayments.slice(0, 5).forEach((p, i) => {
        const date = p.created_at ? p.created_at.toString().split('T')[0] : 'Unknown';
        console.log(`${i + 1}. TSh ${p.amount} on ${date}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTodayPayments();
