const axios = require('axios');

async function testPaymentsAPI() {
  try {
    console.log('Testing payments API...\n');
    
    const response = await axios.get('http://localhost:3000/api/payments');
    const payments = response.data.payments || [];
    
    console.log(`Total payments: ${payments.length}\n`);
    
    if (payments.length > 0) {
      console.log('First 3 payments:');
      payments.slice(0, 3).forEach((p, i) => {
        console.log(`\n${i + 1}. Payment:`);
        console.log('   Amount:', p.amount);
        console.log('   created_at type:', typeof p.created_at);
        console.log('   created_at value:', p.created_at);
        console.log('   payment_date:', p.payment_date);
        
        // Try to parse the date
        if (p.created_at) {
          const date = new Date(p.created_at);
          console.log('   Parsed date:', date.toISOString().split('T')[0]);
        }
      });
      
      // Calculate total
      const total = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      console.log(`\n\nTotal of ALL payments: TSh ${total.toLocaleString()}`);
      
      // Check today
      const today = new Date().toISOString().split('T')[0];
      const todayPayments = payments.filter(p => {
        if (!p.created_at) return false;
        const pDate = new Date(p.created_at).toISOString().split('T')[0];
        return pDate === today;
      });
      
      const todayTotal = todayPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      console.log(`\nToday (${today}): ${todayPayments.length} payments = TSh ${todayTotal.toLocaleString()}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testPaymentsAPI();
