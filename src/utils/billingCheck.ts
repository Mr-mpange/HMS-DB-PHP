import api from '@/lib/api';
import { toast } from 'sonner';

/**
 * Check if patient has outstanding billing before allowing report printing
 * NEW POLICY: Allow printing if ANY non-consultation service has been paid (even partially)
 * - Ignore consultation fees completely
 * - Only check lab, pharmacy, procedures, etc.
 * - Allow printing if ANY payment made for non-consultation services
 * Returns true if printing is allowed, false if payment is required
 */
export async function checkBillingBeforePrint(patientId: string): Promise<boolean> {
  try {
    console.log('🔍 Starting billing check for patient:', patientId);
    
    // Get patient's invoices
    const { data } = await api.get(`/invoices?patient_id=${patientId}`);
    const invoices = data.invoices || [];
    
    console.log('📋 Found invoices:', invoices.length, invoices.map(i => ({
      id: i.id,
      number: i.invoice_number,
      total: i.total_amount,
      paid: i.paid_amount,
      status: i.status,
      notes: i.notes
    })));
    
    if (invoices.length === 0) {
      console.log('✅ Billing check passed - no invoices found');
      return true;
    }
    
    let totalNonConsultationAmount = 0;
    let paidNonConsultationAmount = 0;
    let hasNonConsultationServices = false;
    
    console.log('💳 Billing check for patient:', patientId);
    console.log('💳 Found invoices:', invoices.length);
    
    // Check each invoice
    for (const invoice of invoices) {
      console.log('💳 Processing invoice:', invoice.invoice_number, 'Status:', invoice.status);
      
      const invoiceAmount = parseFloat(invoice.total_amount || 0);
      const paidAmount = parseFloat(invoice.paid_amount || 0);
      const invoiceNotes = (invoice.notes || '').toLowerCase();
      
      console.log('💳 Invoice details:', {
        invoice_number: invoice.invoice_number,
        total_amount: invoiceAmount,
        paid_amount: paidAmount,
        status: invoice.status,
        notes: invoiceNotes
      });
      
      // Determine if this invoice is for consultation or services
      let isConsultationInvoice = false;
      
      // Check if this is a consultation invoice (IGNORE THESE)
      if (invoiceAmount <= 50 || // Small amounts likely consultation
          invoiceNotes.includes('consultation') ||
          invoiceNotes.includes('doctor') ||
          invoiceNotes.includes('visit') ||
          invoiceNotes.includes('appointment')) {
        isConsultationInvoice = true;
        console.log('💳 Skipping consultation invoice:', invoice.invoice_number, 'Amount:', invoiceAmount);
      } else {
        // This is a service invoice (lab, pharmacy, procedures, etc.)
        hasNonConsultationServices = true;
        totalNonConsultationAmount += invoiceAmount;
        paidNonConsultationAmount += paidAmount;
        
        console.log('💳 Service invoice found:', {
          invoice: invoice.invoice_number,
          amount: invoiceAmount,
          paid: paidAmount,
          notes: invoice.notes,
          isLabService: invoiceNotes.includes('lab') || invoiceNotes.includes('test'),
          isPharmacyService: invoiceNotes.includes('medication') || invoiceNotes.includes('pharmacy')
        });
      }
    }
    
    console.log('💳 Billing analysis:', {
      hasNonConsultationServices,
      totalNonConsultationAmount,
      paidNonConsultationAmount,
      outstandingNonConsultation: totalNonConsultationAmount - paidNonConsultationAmount,
      canPrint: hasNonConsultationServices ? paidNonConsultationAmount > 0 : true
    });
    
    // Policy: Allow printing if ANY payment has been made for non-consultation services
    if (hasNonConsultationServices && paidNonConsultationAmount === 0) {
      const outstandingAmount = totalNonConsultationAmount;
      console.log('❌ Billing check FAILED - no payments for services');
      toast.error(
        `Service Payment Required: $${outstandingAmount.toFixed(2)} for lab/pharmacy/procedures must be paid before printing reports.`,
        {
          duration: 6000,
          action: {
            label: 'Go to Billing',
            onClick: () => {
              console.log('Redirect to billing for patient:', patientId);
            }
          }
        }
      );
      return false;
    }
    
    // If any non-consultation payment has been made, allow printing
    if (hasNonConsultationServices && paidNonConsultationAmount > 0) {
      const outstandingAmount = totalNonConsultationAmount - paidNonConsultationAmount;
      console.log('✅ Billing check PASSED - service payments detected');
      if (outstandingAmount > 0) {
        toast.info(
          `Service payment detected ✓ - Reports available. Outstanding: $${outstandingAmount.toFixed(2)} for other services.`,
          { duration: 4000 }
        );
      } else {
        toast.success(
          `All service payments completed ✓ - Reports available.`,
          { duration: 3000 }
        );
      }
    }
    
    // If no non-consultation services, allow printing (consultation-only visits)
    if (!hasNonConsultationServices) {
      console.log('✅ Billing check passed - consultation-only visit');
      return true;
    }
    
    console.log('✅ Billing check passed - service payments made');
    return true;
    
  } catch (error) {
    console.error('❌ Error checking billing status:', error);
    // In case of error, be conservative and prevent printing
    toast.error('Unable to verify billing status. Please contact billing department.');
    return false;
  }
}

/**
 * Show billing status information to user
 */
export async function showBillingStatus(patientId: string): Promise<void> {
  try {
    const { data } = await api.get(`/invoices?patient_id=${patientId}`);
    const invoices = data.invoices || [];
    
    let totalAmount = 0;
    let paidAmount = 0;
    let outstandingAmount = 0;
    
    for (const invoice of invoices) {
      totalAmount += parseFloat(invoice.total_amount || 0);
      paidAmount += parseFloat(invoice.paid_amount || 0);
      if (invoice.status !== 'Paid' && invoice.balance > 0) {
        outstandingAmount += parseFloat(invoice.balance);
      }
    }
    
    if (outstandingAmount > 0) {
      toast.info(
        `Billing Status: $${paidAmount.toFixed(2)} paid of $${totalAmount.toFixed(2)} total. Outstanding: $${outstandingAmount.toFixed(2)}`,
        { duration: 5000 }
      );
    } else {
      toast.success(
        `Billing Status: All payments completed ($${paidAmount.toFixed(2)} total)`,
        { duration: 3000 }
      );
    }
    
  } catch (error) {
    console.error('Error getting billing status:', error);
    toast.error('Unable to retrieve billing status');
  }
}