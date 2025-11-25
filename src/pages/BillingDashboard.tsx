import { useState, useEffect, Fragment, useMemo, useCallback, memo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { mobilePaymentService, MobilePaymentRequest } from '@/lib/mobilePaymentService';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';
import { generateInvoiceNumber, logActivity } from '@/lib/utils';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Smartphone,
  Plus,
  Send,
  AlertCircle,
  CreditCard,
  Shield,
  DollarSign,
  File
} from 'lucide-react';

export default function BillingDashboard() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([]);
  const [insuranceClaims, setInsuranceClaims] = useState<any[]>([]);
  const [stats, setStats] = useState({ unpaid: 0, partiallyPaid: 0, totalRevenue: 0, pendingClaims: 0, todayRevenue: 0 });
  const [loading, setLoading] = useState(true); // Initial load only
  const [refreshing, setRefreshing] = useState(false); // Background refresh
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [claimInvoiceId, setClaimInvoiceId] = useState<string>('');
  const [claimInsuranceId, setClaimInsuranceId] = useState<string>('');
  const [claimAmount, setClaimAmount] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [mobilePaymentProcessing, setMobilePaymentProcessing] = useState<boolean>(false);
  const [rawInvoicesData, setRawInvoicesData] = useState<any[]>([]);
  const [rawPatientsData, setRawPatientsData] = useState<any[]>([]);
  const [rawInsuranceData, setRawInsuranceData] = useState<any[]>([]);
  const [rawClaimsData, setRawClaimsData] = useState<any[]>([]);
  const [rawPaymentsData, setRawPaymentsData] = useState<any[]>([]);
  const [patientServices, setPatientServices] = useState<any[]>([]);
  const [patientCosts, setPatientCosts] = useState<Record<string, number>>({});
  const [billingVisits, setBillingVisits] = useState<any[]>([]);

  useEffect(() => {
    fetchData(true); // Initial load with loading screen

    // Set up polling instead of real-time subscriptions (every 30 seconds)
    const intervalId = setInterval(() => {
      fetchData(false); // Background refresh without loading screen
    }, 30000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Memoize expensive computations at component level
  const groupedPatients = useMemo(() => {
    if (!rawInvoicesData.length) return {};

    return rawInvoicesData.reduce((acc, invoice) => {
      const patientId = invoice.patient_id;
      if (!acc[patientId]) {
        acc[patientId] = {
          patient: invoice.patient,
          invoices: [],
          totalAmount: 0,
          totalPaid: 0,
          unpaidAmount: 0,
          invoiceCount: 0,
          latestInvoiceDate: invoice.invoice_date,
          status: 'Unpaid'
        };
      }
      acc[patientId].invoices.push(invoice);
      acc[patientId].totalAmount += Number(invoice.total_amount);
      acc[patientId].totalPaid += Number(invoice.paid_amount || 0);
      acc[patientId].invoiceCount += 1;

      if (new Date(invoice.invoice_date) > new Date(acc[patientId].latestInvoiceDate)) {
        acc[patientId].latestInvoiceDate = invoice.invoice_date;
      }

      return acc;
    }, {} as Record<string, any>);
  }, [rawInvoicesData]);

  const processedPatients = useMemo(() => {
    if (!Object.keys(groupedPatients).length) return [];

    const patientsArray = Object.values(groupedPatients);
    patientsArray.forEach((patient: any) => {
      patient.unpaidAmount = patient.totalAmount - patient.totalPaid;

      if (patient.totalPaid === 0) {
        patient.status = 'Unpaid';
      } else if (patient.totalPaid >= patient.totalAmount) {
        patient.status = 'Paid';
      } else {
        patient.status = 'Partially Paid';
      }
    });

    return patientsArray;
  }, [groupedPatients]);

  const calculatedStats = useMemo(() => {
    if (!processedPatients.length) {
      return { unpaid: 0, partiallyPaid: 0, totalRevenue: 0, pendingClaims: 0, todayRevenue: 0 };
    }

    const unpaid = processedPatients.filter((p: any) => p.status === 'Unpaid').length;
    const partiallyPaid = processedPatients.filter((p: any) => p.status === 'Partially Paid').length;

    // Calculate today's revenue from rawPaymentsData
    const today = new Date().toISOString().split('T')[0];
    let totalRevenue = 0;
    let todayPaymentsDebug: any[] = [];
    
    if (rawPaymentsData && rawPaymentsData.length > 0) {
      rawPaymentsData.forEach((payment: any) => {
        // Handle both Date objects and string dates
        let paymentDate = '';
        if (payment.created_at) {
          if (payment.created_at instanceof Date) {
            paymentDate = payment.created_at.toISOString().split('T')[0];
          } else if (typeof payment.created_at === 'string') {
            paymentDate = payment.created_at.split('T')[0];
          } else {
            // Handle timestamp objects from MySQL
            paymentDate = new Date(payment.created_at).toISOString().split('T')[0];
          }
        }
        
        // Payments table doesn't have status column - all payments are completed when recorded
        if (paymentDate === today) {
          totalRevenue += Number(payment.amount || 0);
          todayPaymentsDebug.push({
            amount: payment.amount,
            date: paymentDate,
            method: payment.payment_method
          });
        }
      });
    }
    
    console.log('Today Revenue Calculation:', {
      today,
      totalPayments: rawPaymentsData?.length || 0,
      todayPayments: todayPaymentsDebug.length,
      todayRevenue: totalRevenue,
      sampleTodayPayments: todayPaymentsDebug.slice(0, 5)
    });

    const pendingClaims: number = rawClaimsData?.filter(c => c.status === 'Pending').length || 0;

    const todayPaymentsCount = rawPaymentsData?.filter((p: any) => {
      if (!p.created_at) return false;
      const pDate = p.created_at instanceof Date 
        ? p.created_at.toISOString().split('T')[0]
        : new Date(p.created_at).toISOString().split('T')[0];
      return pDate === today;
    }).length || 0;
    
    console.log('Billing Stats:', {
      date: today,
      todayRevenue: totalRevenue,
      todayPayments: todayPaymentsCount,
      unpaidInvoices: unpaid,
      partiallyPaidInvoices: partiallyPaid,
      pendingClaims,
      totalPatients: processedPatients.length
    });

    return { unpaid, partiallyPaid, totalRevenue, pendingClaims, todayRevenue: totalRevenue };
  }, [processedPatients, rawClaimsData, rawPaymentsData]);

  // Update state when memoized values change
  useEffect(() => {
    setInvoices(processedPatients);
    setStats(calculatedStats);
  }, [processedPatients, calculatedStats]);

  const fetchData = async (isInitialLoad = false) => {
    try {
      // Only show full loading screen on initial load
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      // Fetch all data from MySQL API endpoints (only existing endpoints)
      // Get today's date for filtering payments
      const today = new Date().toISOString().split('T')[0];
      
      const [
        billingVisitsRes,
        invoicesRes,
        patientsRes,
        insuranceRes,
        claimsRes,
        paymentsRes,
        servicesRes
      ] = await Promise.all([
        api.get('/visits?current_stage=billing&overall_status=Active').catch(() => ({ data: { visits: [] } })),
        api.get('/billing/invoices').catch(() => ({ data: { invoices: [] } })),
        api.get('/patients?status=Active').catch(() => ({ data: { patients: [] } })),
        api.get('/insurance/companies').catch(() => ({ data: { companies: [] } })),
        api.get('/insurance/claims').catch(() => ({ data: { claims: [] } })),
        api.get(`/payments?date=${today}`).catch(() => ({ data: { payments: [] } })), // Filter by today's date
        api.get('/patient-services').catch(() => ({ data: { services: [] } })) // Fetch all patient services
      ]);

      const billingVisitsData = billingVisitsRes.data.visits || [];
      const invoicesData = invoicesRes.data.invoices || [];
      const patientsData = patientsRes.data.patients || [];
      const insuranceData = insuranceRes.data.companies || [];
      const claimsData = claimsRes.data.claims || [];
      const paymentsData = paymentsRes.data.payments || [];
      const servicesData = servicesRes.data.services || [];
      
      console.log('📊 Billing data fetched:', {
        billingVisits: billingVisitsData.length,
        services: servicesData.length,
        invoices: invoicesData.length,
        patients: patientsData.length
      });

      // Update raw data state to trigger memoized computations
      setBillingVisits(billingVisitsData);
      setRawInvoicesData(invoicesData);
      setRawPatientsData(patientsData);
      setRawInsuranceData(insuranceData);
      setRawClaimsData(claimsData);
      setRawPaymentsData(paymentsData);
      setPatientServices(servicesData);

      // Calculate patient costs from services (medications + lab tests only)
      // Consultation fee is paid at registration and NOT included here
      const costs: Record<string, number> = {};
      
      // Group services by patient and calculate total cost
      if (servicesData && servicesData.length > 0) {
        servicesData.forEach((service: any) => {
          const patientId = service.patient_id;
          
          // Only include unpaid services (medications and lab tests)
          // Skip consultation fees as they're paid at registration
          const serviceType = service.service?.service_type || '';
          const isConsultation = serviceType.toLowerCase().includes('consultation');
          
          if (!isConsultation) {
            // Use total_price if available (for medications), otherwise calculate from unit_price or base_price
            const totalPrice = Number(service.total_price || 
              (service.unit_price || service.service?.base_price || service.price || 0) * (service.quantity || 1));
            
            if (!costs[patientId]) {
              costs[patientId] = 0;
            }
            costs[patientId] += totalPrice;
          }
        });
      }
      
      setPatientCosts(costs);
      
      console.log('Patient costs calculated (medications + lab tests only):', costs);

      // Update other state with safety checks
      setPatients(patientsData);
      setInsuranceCompanies(insuranceData);
      setInsuranceClaims(claimsData);

      console.log('Billing Dashboard - Data loaded:', {
        invoices: invoicesData.length,
        patients: patientsData.length,
        insuranceCompanies: insuranceData.length,
        claims: claimsData.length
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenPaymentDialog = (invoice: any) => {
    setSelectedInvoice(invoice);
    
    // Check if patient has insurance - auto-select Insurance payment method
    const patient = patients.find(p => p.id === invoice.patient_id);
    if (patient?.insurance_company_id) {
      setPaymentMethod('Insurance');
      toast.info('Patient has insurance - Insurance payment method selected');
    } else {
      setPaymentMethod('');
    }
    
    setPaymentStatus('');
    setTransactionId('');
    setMobilePaymentProcessing(false);
    setPaymentDialogOpen(true);
  };

  const handleCreateInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!selectedPatientId) {
      toast.error('Please select a patient');
      return;
    }

    const calculatedCost = patientCosts[selectedPatientId] || 50000; // Fallback to default if no services

    // Get patient services for invoice items (exclude consultation - already paid at registration)
    const patientServicesList = patientServices.filter((s: any) => {
      if (s.patient_id !== selectedPatientId) return false;
      
      // Exclude consultation services (already paid at registration)
      const serviceType = s.service?.service_type || '';
      const isConsultation = serviceType.toLowerCase().includes('consultation');
      return !isConsultation;
    });

    const invoiceNumber = await generateInvoiceNumber();

    const invoiceData = {
      invoice_number: invoiceNumber,
      patient_id: selectedPatientId,
      total_amount: calculatedCost,
      paid_amount: 0,
      status: 'Pending',
      invoice_date: new Date().toISOString().split('T')[0], // Send as date only (YYYY-MM-DD)
      due_date: formData.get('dueDate') as string || null,
      notes: formData.get('notes') as string || `Invoice for ${patientServicesList.length} service(s) - Total: TSh${calculatedCost.toFixed(2)}`,
      items: patientServicesList.map((service: any) => ({
        service_id: service.service_id,
        service_name: service.service?.service_name || service.service_name || 'Medical Service',
        description: service.service?.service_name || service.service_name || 'Medical Service',
        quantity: service.quantity || 1,
        unit_price: Number(service.service?.base_price || service.unit_price || service.price || 0),
        total_price: Number(service.total_price || (service.service?.base_price || service.unit_price || service.price || 0) * (service.quantity || 1))
      }))
    };

    try {
      const invoiceRes = await api.post('/billing/invoices', invoiceData);
      const createdInvoice = invoiceRes.data.invoice;
      
      console.log('Invoice created successfully with items:', createdInvoice);
      
      // Update the patient's visit to mark billing as completed
      try {
        const visitsRes = await api.get(`/visits?patient_id=${selectedPatientId}&current_stage=billing&overall_status=Active&limit=1`);
        const visits = visitsRes.data.visits;
        
        if (visits && visits.length > 0) {
          const visit = visits[0];
          await api.put(`/visits/${visit.id}`, {
            billing_status: 'Completed',
            billing_completed_at: new Date().toISOString(),
            current_stage: 'completed',
            overall_status: 'Completed',
            updated_at: new Date().toISOString()
          });
          
          console.log('✅ Visit updated - patient billing completed');
          
          // Remove from billingVisits list
          setBillingVisits(prev => prev.filter(v => v.id !== visit.id));
        }
      } catch (visitError) {
        console.error('Error updating visit:', visitError);
        // Don't fail the whole operation if visit update fails
      }
      
      toast.success(`Invoice ${createdInvoice.invoice_number} created for TSh${calculatedCost.toFixed(2)} (${patientServicesList.length} items)`);
      setDialogOpen(false);
      setSelectedPatientId('');
      
      // Add new invoice to local state
      setRawInvoicesData(prev => [...prev, createdInvoice]);
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(`Failed to create invoice: ${error.message}`);
    }
  };

  const handleInitiateMobilePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const formData = new FormData(e.currentTarget);
    const phoneNumber = formData.get('phoneNumber') as string;
    const amount = Number(formData.get('amount'));

    // Validate amount
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    const maxAmount = Number(selectedInvoice.total_amount as number) - Number(selectedInvoice.paid_amount as number || 0);
    if (amount > maxAmount) {
      toast.error(`Payment amount cannot exceed remaining balance of TSh${maxAmount.toFixed(2)}`);
      return;
    }

    // Validate phone number format for Tanzania
    const phoneRegex = /^0[67][0-9]{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error('Please enter a valid Tanzanian phone number (07xxxxxxxx or 06xxxxxxxx)');
      return;
    }

    setMobilePaymentProcessing(true);
    setPaymentStatus('processing');

    try {
      const paymentRequest: MobilePaymentRequest = {
        phoneNumber,
        amount,
        invoiceId: selectedInvoice.id,
        paymentMethod: paymentMethod as 'M-Pesa' | 'Airtel Money' | 'Tigo Pesa' | 'Halopesa',
        description: `Payment for invoice ${selectedInvoice.invoice_number}`
      };

      const response = await mobilePaymentService.initiatePayment(paymentRequest);

      if (response.success && response.transactionId) {
        setTransactionId(response.transactionId);
        setPaymentStatus('pending');

        toast.success(`📱 ${paymentMethod} payment request sent to ${phoneNumber}. Waiting for confirmation...`);

        // Payment record is created by backend ZenoPay controller
        // No need to create it here - webhook will handle completion

        // Close dialog but keep status visible
        setPaymentDialogOpen(false);

        toast.info('Payment is pending. It will be confirmed automatically when customer completes payment on their phone.', {
          duration: 5000
        });

      } else {
        setPaymentStatus('failed');
        toast.error(response.message || 'Failed to initiate mobile payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      toast.error('Failed to process mobile payment');
    } finally {
      setMobilePaymentProcessing(false);
    }
  };

  const checkPaymentStatus = async (transactionId: string) => {
    try {
      // Check payment status via ZenoPay endpoint
      const response = await mobilePaymentService.checkPaymentStatus(transactionId);

      if (response.success && response.status === 'completed') {
        setPaymentStatus('completed');
        toast.success('✅ Payment confirmed successfully!');

        // Refresh data to show updated invoice
        fetchData(false);

        // Reset state after a delay
        setTimeout(() => {
          setPaymentStatus('');
          setTransactionId('');
          setSelectedInvoice(null);
          setPaymentMethod('');
        }, 3000);
      } else if (response.status === 'failed') {
        setPaymentStatus('failed');
        toast.error('❌ Payment failed');
      } else {
        // Still pending, check again after a delay
        setTimeout(() => checkPaymentStatus(transactionId), 10000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const updateInvoiceAfterPayment = async (invoiceId: string, amount: number) => {
    try {
      let invoice;
      try {
        const invoiceRes = await api.get(`/billing/invoices/${invoiceId}`);
        invoice = invoiceRes.data.invoice;
      } catch (error) {
        console.error('Error fetching invoice:', error);
        return;
      }

      if (invoice) {
        const newPaidAmount = Number(invoice.paid_amount) + amount;
        const totalAmount = Number(invoice.total_amount);
        const newStatus = newPaidAmount >= totalAmount ? 'Paid' : newPaidAmount > 0 ? 'Partially Paid' : 'Unpaid';

        try {
          await api.put(`/billing/invoices/${invoiceId}`, { paid_amount: newPaidAmount, status: newStatus });
        } catch (error) {
          console.error('Error updating invoice:', error);
          return;
        }

        // If fully paid, complete the visit
        if (newStatus === 'Paid') {
          // In a real implementation, we would fetch the patient_id from the invoice
          // For now, we'll assume it's available in the invoice object
          const patientId = invoice.patient_id;

          if (patientId) {
            let visits;
            try {
              const visitsRes = await api.get(`/visits?patient_id=${patientId}&current_stage=billing&overall_status=Active&limit=1`);
              visits = visitsRes.data.visits;
            } catch (error) {
              console.error('Error fetching patient visits:', error);
              visits = [];
            }

            if (visits && visits.length > 0) {
              try {
                await api.put(`/visits/${visits[0].id}`, {
                  billing_status: 'Paid',
                  billing_completed_at: new Date().toISOString(),
                  current_stage: 'completed',
                  overall_status: 'Completed',
                  updated_at: new Date().toISOString()
                });

                console.log('Patient visit completed and removed from billing queue');
              } catch (error) {
                console.error('Error updating patient visit:', error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating invoice after payment:', error);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Handle mobile payments separately
    if (['M-Pesa', 'Airtel Money', 'Tigo Pesa', 'Halopesa'].includes(paymentMethod)) {
      return handleInitiateMobilePayment(e);
    }

    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));

    // Validate amount
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (!selectedInvoice) {
      toast.error('No invoice selected');
      return;
    }

    const maxAmount = Number(selectedInvoice.total_amount as number) - Number(selectedInvoice.paid_amount as number || 0);
    if (amount > maxAmount) {
      toast.error(`Payment amount cannot exceed remaining balance of TSh${maxAmount.toFixed(2)}`);
      return;
    }

    const paymentData = {
      invoice_id: selectedInvoice.id,
      patient_id: selectedInvoice.patient_id,
      amount,
      payment_method: paymentMethod,
      payment_date: new Date().toISOString(),
      reference_number: formData.get('referenceNumber') as string || selectedInvoice.invoice_number || null,
      notes: formData.get('notes') as string || null,
      status: 'Completed',
    };

    try {
      await api.post('/payments', paymentData);
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to record payment';
      toast.error(errorMessage);
      return;
    }

    // Log payment received
    await logActivity('billing.payment.received', {
      invoice_id: selectedInvoice.id,
      patient_id: selectedInvoice.patient_id,
      amount: amount,
      payment_method: paymentMethod,
      reference_number: formData.get('referenceNumber') as string || null
    });

    const newPaidAmount = Number(selectedInvoice.paid_amount) + amount;
    const totalAmount = Number(selectedInvoice.total_amount);
    const newBalance = totalAmount - newPaidAmount;
    const newStatus = newPaidAmount >= totalAmount ? 'Paid' : newPaidAmount > 0 ? 'Partially Paid' : 'Unpaid';

    try {
      await api.put(`/billing/invoices/${selectedInvoice.id}`, { paid_amount: newPaidAmount, status: newStatus });
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
      return;
    }

    // If fully paid, complete the visit
    if (newStatus === 'Paid') {
      console.log('Payment fully completed, updating patient visit...', {
        patient_id: selectedInvoice?.patient_id,
        invoice_id: selectedInvoice?.id
      });

      if (!selectedInvoice?.patient_id) {
        console.error('No patient_id found on invoice');
        toast.warning('Payment recorded but could not update patient visit - no patient ID');
      } else {
        // First, try to find visit in billing stage
        let visits = [];
        try {
          const visitsRes = await api.get(`/visits?patient_id=${selectedInvoice.patient_id}&current_stage=billing&overall_status=Active&limit=1`);
          visits = visitsRes.data.visits || [];
        } catch (error) {
          console.error('Error fetching patient visit:', error);
        }

        console.log('Found visits in billing stage:', visits.length);

        // If no visit in billing, try to find ANY active visit for this patient
        if (!visits || visits.length === 0) {
          console.log('No visit in billing stage, checking for any active visit...');
          try {
            const anyVisitsRes = await api.get(`/visits?patient_id=${selectedInvoice.patient_id}&overall_status=Active&limit=1`);
            const anyVisits = anyVisitsRes.data.visits || [];
            
            console.log('Found any active visits:', anyVisits.length, anyVisits[0]?.current_stage);
            
            // Use the active visit even if not in billing stage
            if (anyVisits && anyVisits.length > 0) {
              visits = anyVisits;
              console.log('Using active visit from stage:', anyVisits[0].current_stage);
            }
          } catch (error) {
            console.error('Error fetching any active visits:', error);
          }
        }

        if (visits && visits.length > 0) {
          try {
            await api.put(`/visits/${visits[0].id}`, {
              billing_status: 'Paid',
              billing_completed_at: new Date().toISOString(),
              current_stage: 'completed',
              overall_status: 'Completed',
              updated_at: new Date().toISOString()
            });

            console.log('Patient visit completed and removed from billing queue');
            toast.success('Payment completed! Patient visit finished.');
          } catch (error: any) {
            console.error('Error updating patient visit:', error);
            toast.error(`Failed to update patient visit: ${error.message}`);
          }
        } else {
          console.warn('No active patient visit found - creating completed visit record');
          
          // Create a completed visit record for this payment
          try {
            await api.post('/visits', {
              patient_id: selectedInvoice.patient_id,
              visit_date: new Date().toISOString(),
              reception_status: 'Completed',
              nurse_status: 'Completed',
              doctor_status: 'Completed',
              lab_status: 'Not Required',
              pharmacy_status: 'Completed',
              billing_status: 'Paid',
              billing_completed_at: new Date().toISOString(),
              current_stage: 'completed',
              overall_status: 'Completed',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
            console.log('Created completed visit record for payment');
            toast.success('Payment completed successfully!');
          } catch (error: any) {
            console.error('Error creating visit record:', error);
            toast.warning('Payment recorded successfully (no visit record created)');
          }
        }
      }
    }

    toast.success(`Payment of TSh${amount.toFixed(2)} recorded successfully`);
    setPaymentDialogOpen(false);
    setSelectedInvoice(null);
    setPaymentMethod('');
    
    // Update local state instead of full refresh
    setRawInvoicesData(prev => prev.map(inv => 
      inv.id === selectedInvoice.id 
        ? { ...inv, paid_amount: newPaidAmount, balance: newBalance, status: newStatus }
        : inv
    ));
  };

  if (loading) {
    return (
      <DashboardLayout title="Billing Dashboard">
        <div className="space-y-8">
          {/* Stats Cards Skeleton */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-destructive/20 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs Skeleton */}
          <div className="space-y-4">
            <div className="grid w-full grid-cols-2 gap-2">
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Invoices Table Skeleton */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-32" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-48" />
                  </div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse w-32" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex space-x-4 pb-2 border-b">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
                    ))}
                  </div>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex space-x-4 py-2">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <div key={j} className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Billing Dashboard">
      <div className="space-y-8">
        {/* Background Refresh Indicator */}
        {refreshing && (
          <div className="fixed top-4 right-4 z-50 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 shadow-sm animate-in slide-in-from-right-2">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Updating...</span>
            </div>
          </div>
        )}

        {/* Payment Status Notification */}
        {paymentStatus && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm animate-in slide-in-from-right-2 ${
            paymentStatus === 'completed' ? 'bg-green-100 border border-green-500' :
            paymentStatus === 'failed' ? 'bg-red-100 border border-red-500' :
            'bg-blue-100 border border-blue-500'
          }`}>
            <div className="flex items-center space-x-3">
              {paymentStatus === 'completed' && <CheckCircle className="h-6 w-6 text-green-600" />}
              {paymentStatus === 'failed' && <XCircle className="h-6 w-6 text-red-600" />}
              {paymentStatus === 'pending' && <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />}

              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  paymentStatus === 'completed' ? 'text-green-800' :
                  paymentStatus === 'failed' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {paymentStatus === 'completed' && '✅ Payment Completed Successfully!'}
                  {paymentStatus === 'failed' && '❌ Payment Failed'}
                  {paymentStatus === 'pending' && '⏳ Payment Request Sent - Waiting for Confirmation'}
                  {paymentStatus === 'processing' && '🔄 Processing Payment...'}
                </p>
                {transactionId && (
                  <p className={`text-xs mt-1 ${
                    paymentStatus === 'completed' ? 'text-green-600' :
                    paymentStatus === 'failed' ? 'text-red-600' :
                    'text-blue-600'
                  }`}>
                    Transaction ID: {transactionId.slice(-8)}
                  </p>
                )}
                {paymentStatus === 'pending' && (
                  <p className="text-xs text-blue-600 mt-1">
                    Customer will receive payment request on their phone
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-destructive/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Invoices</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.unpaid}</div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partially Paid</CardTitle>
              <CreditCard className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.partiallyPaid}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pendingClaims}</div>
            </CardContent>
          </Card>

          <Card className="border-green-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                TSh {stats.todayRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">Awaiting Billing ({billingVisits.length})</TabsTrigger>
            <TabsTrigger value="invoices">Invoices & Payments</TabsTrigger>
            <TabsTrigger value="payments">Today's Payments</TabsTrigger>
            <TabsTrigger value="insurance">Insurance Claims</TabsTrigger>
          </TabsList>

          {/* Pending Invoices Tab - Patients Awaiting Billing */}
          <TabsContent value="pending" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Patients Awaiting Billing</CardTitle>
                    <CardDescription>
                      {billingVisits.length > 0 
                        ? `${billingVisits.length} patient(s) ready for invoice creation`
                        : 'No patients waiting for billing'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {billingVisits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-medium">All caught up!</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      No patients waiting for billing at the moment.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Services</TableHead>
                          <TableHead>Total Cost</TableHead>
                          <TableHead>Visit Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {billingVisits.map((visit: any) => {
                          const patient = patients.find(p => p.id === visit.patient_id) || visit.patient;
                          const patientServicesList = patientServices.filter((s: any) => s.patient_id === visit.patient_id);
                          const totalCost = patientCosts[visit.patient_id] || 0;
                          
                          return (
                            <TableRow key={visit.id}>
                              <TableCell className="font-medium">
                                {patient?.full_name || 'Unknown Patient'}
                              </TableCell>
                              <TableCell className="text-sm">
                                {patient?.phone || '-'}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {patientServicesList.length} service(s)
                                  {patientServicesList.length > 0 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {patientServicesList.slice(0, 2).map((s: any, i: number) => (
                                        <div key={i}>
                                          • {s.service_name || s.service?.service_name || 'Service'}
                                        </div>
                                      ))}
                                      {patientServicesList.length > 2 && (
                                        <div>+ {patientServicesList.length - 2} more</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold text-blue-600">
                                TSh{totalCost.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {format(new Date(visit.visit_date || visit.created_at), 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPatientId(visit.patient_id);
                                    setDialogOpen(true);
                                  }}
                                  disabled={totalCost === 0}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create Invoice
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>Manage patient invoices and payments</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                </div>
              </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Patient</TableHead>
                        <TableHead className="min-w-[100px]">Phone</TableHead>
                        <TableHead className="min-w-[120px]">Calculated Cost</TableHead>
                        <TableHead className="min-w-[100px]">Total Amount</TableHead>
                        <TableHead className="min-w-[100px]">Paid Amount</TableHead>
                        <TableHead className="min-w-[100px]">Unpaid Amount</TableHead>
                        <TableHead className="min-w-[80px]">Invoice Count</TableHead>
                        <TableHead className="min-w-[100px]">Latest Date</TableHead>
                        <TableHead className="min-w-[80px]">Status</TableHead>
                        <TableHead className="min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices
                        .filter((patientData) => patientData.status !== 'Paid') // Hide fully paid patients
                        .map((patientData) => (
                        <TableRow key={patientData.patient.id}>
                          <TableCell className="font-medium">{patientData.patient.full_name}</TableCell>
                          <TableCell className="text-sm">{patientData.patient.phone}</TableCell>
                          <TableCell className="font-semibold text-blue-600">
                            TSh{(patientCosts[patientData.patient.id] || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>TSh{Number(patientData.totalAmount as number).toFixed(2)}</TableCell>
                          <TableCell>TSh{Number(patientData.totalPaid as number).toFixed(2)}</TableCell>
                          <TableCell>TSh{Number(patientData.unpaidAmount as number).toFixed(2)}</TableCell>
                          <TableCell>{patientData.invoiceCount}</TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(patientData.latestInvoiceDate), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                patientData.status === 'Paid' ? 'default' :
                                patientData.status === 'Partially Paid' ? 'secondary' :
                                'destructive'
                              }
                            >
                              {patientData.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(patientData.status === 'Unpaid' || patientData.status === 'Partially Paid') && (
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                onClick={() => {
                                  // For now, select the first unpaid invoice for payment
                                  const unpaidInvoice = patientData.invoices.find(inv => inv.status !== 'Paid');
                                  if (unpaidInvoice) {
                                    handleOpenPaymentDialog(unpaidInvoice);
                                  }
                                }}
                              >
                                <CreditCard className="mr-1 h-3 w-3" />
                                Pay Now
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Today's Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Today's Payments</CardTitle>
                <CardDescription>
                  All payments received today - {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rawPaymentsData.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No payments received today</p>
                    <p className="text-sm text-muted-foreground mt-1">Payments will appear here as they are processed</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-700 font-medium">Total Revenue Today</p>
                          <p className="text-3xl font-bold text-green-800">TSh {stats.todayRevenue.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-700">Total Payments</p>
                          <p className="text-2xl font-bold text-green-800">{rawPaymentsData.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Payment Method</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Reference</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rawPaymentsData
                            .sort((a, b) => {
                              // Sort by created_at descending (newest first)
                              const dateA = new Date(a.created_at || a.payment_date);
                              const dateB = new Date(b.created_at || b.payment_date);
                              return dateB.getTime() - dateA.getTime();
                            })
                            .map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="text-sm">
                                {format(new Date(payment.created_at || payment.payment_date), 'h:mm a')}
                              </TableCell>
                              <TableCell className="font-medium">
                                {payment.patient?.full_name || 'Unknown'}
                              </TableCell>
                              <TableCell className="text-sm">
                                {payment.patient?.phone || '-'}
                              </TableCell>
                              <TableCell className="font-semibold text-green-600">
                                TSh {Number(payment.amount).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {payment.payment_method === 'M-Pesa' && '📱 M-Pesa'}
                                  {payment.payment_method === 'Airtel Money' && '📱 Airtel Money'}
                                  {payment.payment_method === 'Tigo Pesa' && '📱 Tigo Pesa'}
                                  {payment.payment_method === 'Halopesa' && '📱 Halopesa'}
                                  {payment.payment_method === 'Cash' && '💵 Cash'}
                                  {payment.payment_method === 'Card' && '💳 Card'}
                                  {payment.payment_method === 'Bank Transfer' && '🏦 Bank Transfer'}
                                  {payment.payment_method === 'Insurance' && '🛡️ Insurance'}
                                  {!['M-Pesa', 'Airtel Money', 'Tigo Pesa', 'Halopesa', 'Cash', 'Card', 'Bank Transfer', 'Insurance'].includes(payment.payment_method) && payment.payment_method}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {payment.payment_type || 'General'}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground font-mono">
                                {payment.reference_number || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insurance Claims Tab */}
          <TabsContent value="insurance" className="space-y-4">
            {/* NHIF Info Card */}
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-white shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-xl">NHIF Claims Management</CardTitle>
                    <CardDescription className="text-sm">
                      National Health Insurance Fund - Automated claim submission
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-blue-100">
                    <div className="text-sm text-muted-foreground">Total Claims</div>
                    <div className="text-2xl font-bold text-blue-600">{insuranceClaims.length}</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-green-100">
                    <div className="text-sm text-muted-foreground">Approved</div>
                    <div className="text-2xl font-bold text-green-600">
                      {insuranceClaims.filter(c => c.status === 'Approved').length}
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-yellow-100">
                    <div className="text-sm text-muted-foreground">Pending</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {insuranceClaims.filter(c => c.status === 'Pending').length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Claims Table */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Insurance Claims</CardTitle>
                    <CardDescription>Submit and track NHIF claims</CardDescription>
                  </div>
                  <Button onClick={() => setClaimDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Submit New Claim
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {insuranceClaims.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                      <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No claims submitted yet</h3>
                    <p className="text-sm text-gray-500 mb-4">Start by submitting your first NHIF claim</p>
                    <Button onClick={() => setClaimDialogOpen(true)} variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Submit First Claim
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Claim Number</TableHead>
                          <TableHead className="font-semibold">Patient</TableHead>
                          <TableHead className="font-semibold">NHIF Card</TableHead>
                          <TableHead className="font-semibold">Claim Amount</TableHead>
                          <TableHead className="font-semibold">Approved</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Submitted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {insuranceClaims.map((claim) => (
                          <TableRow key={claim.id} className="hover:bg-gray-50">
                            <TableCell className="font-mono font-medium text-blue-600">{claim.claim_number}</TableCell>
                            <TableCell>
                              <div className="font-medium">{claim.patient?.full_name || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{claim.patient?.phone}</div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{claim.patient?.insurance_policy_number || 'N/A'}</TableCell>
                            <TableCell className="font-semibold">TSh {Number(claim.claim_amount as number).toLocaleString()}</TableCell>
                            <TableCell className="font-semibold text-green-600">
                              TSh {Number(claim.approved_amount || 0).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  claim.status === 'Approved' ? 'default' :
                                  claim.status === 'Pending' ? 'secondary' :
                                  'destructive'
                                }
                                className={
                                  claim.status === 'Approved' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                  claim.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                                  'bg-red-100 text-red-800 hover:bg-red-200'
                                }
                              >
                                {claim.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div>{format(new Date(claim.submission_date), 'MMM dd, yyyy')}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(claim.submission_date), 'h:mm a')}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={paymentDialogOpen} onOpenChange={(open) => {
          setPaymentDialogOpen(open);
          if (!open) {
            // Reset form state when dialog closes
            setPaymentStatus('');
            setTransactionId('');
            setPaymentMethod('');
            setMobilePaymentProcessing(false);
          }
        }}>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record payment for invoice {selectedInvoice?.invoice_number}
              </DialogDescription>
            </DialogHeader>

            {/* Invoice Details */}
            {selectedInvoice && (
              <div className="border rounded-lg p-4 mb-4 bg-gray-50">
                <h4 className="font-semibold mb-3">Invoice Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Patient:</span>
                    <span className="font-medium">{selectedInvoice.patient?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Invoice Date:</span>
                    <span>{format(new Date(selectedInvoice.invoice_date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due Date:</span>
                    <span>{format(new Date(selectedInvoice.due_date), 'MMM dd, yyyy')}</span>
                  </div>

                  {/* Invoice Items */}
                  {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                    <div className="mt-4 border-t pt-2">
                      <h5 className="font-medium mb-2">Invoice Items:</h5>
                      <div className="space-y-1">
                        {selectedInvoice.items.map((item: any, index: number) => (
                          <div key={item.id || index} className="flex justify-between text-sm bg-gray-100 p-2 rounded">
                            <span className="flex-1">{item.description}</span>
                            <span className="text-right">
                              {item.quantity} × TSh{Number(item.unit_price as number).toFixed(2)} = <span className="font-semibold">TSh{Number(item.total_price as number).toFixed(2)}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold text-base">
                      <span>Total:</span>
                      <span>TSh{Number(selectedInvoice.total_amount as number).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paid:</span>
                      <span>TSh{Number(selectedInvoice.paid_amount as number || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-green-600">
                      <span>Remaining:</span>
                      <span>TSh{(Number(selectedInvoice.total_amount as number) - Number(selectedInvoice.paid_amount as number || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4">
              {/* Form validation helper */}
              {(() => {
                const form = document.querySelector('form');
                const isFormValid = form?.checkValidity();
                return !isFormValid ? (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-600">⚠️ Please fill in all required fields</p>
                  </div>
                ) : null;
              })()}

              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount (TSh)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedInvoice ? Number(selectedInvoice.total_amount as number) - Number(selectedInvoice.paid_amount as number || 0) : undefined}
                  defaultValue={selectedInvoice ? (Number(selectedInvoice.total_amount as number) - Number(selectedInvoice.paid_amount as number || 0)).toFixed(2) : ''}
                  className={`bg-white ${selectedInvoice ? 'border-green-300 focus:border-green-500' : 'border-red-300'}`}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  💰 Enter payment amount (max: TSh{selectedInvoice ? (Number(selectedInvoice.total_amount as number) - Number(selectedInvoice.paid_amount as number || 0)).toFixed(2) : '0.00'})
                </p>
                {selectedInvoice && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Remaining Balance:</span>
                      <span className="font-semibold text-green-800">
                        TSh{(Number(selectedInvoice.total_amount as number) - Number(selectedInvoice.paid_amount as number || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                {(() => {
                  const patient = patients.find(p => p.id === selectedInvoice?.patient_id);
                  const hasInsurance = patient?.insurance_company_id;
                  
                  return (
                    <>
                      <Select 
                        name="paymentMethod" 
                        value={paymentMethod} 
                        onValueChange={setPaymentMethod} 
                        required
                        disabled={hasInsurance}
                      >
                        <SelectTrigger className={paymentMethod ? 'border-green-500' : 'border-red-500'}>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {hasInsurance ? (
                            <SelectItem value="Insurance">🛡️ Insurance (Patient has insurance)</SelectItem>
                          ) : (
                            <>
                              <SelectItem value="Cash">💵 Cash</SelectItem>
                              <SelectItem value="Card">💳 Debit/Credit Card</SelectItem>
                              <SelectItem value="M-Pesa">📱 M-Pesa</SelectItem>
                              <SelectItem value="Airtel Money">📱 Airtel Money</SelectItem>
                              <SelectItem value="Tigo Pesa">📱 Tigo Pesa</SelectItem>
                              <SelectItem value="Halopesa">📱 Halopesa</SelectItem>
                              <SelectItem value="Bank Transfer">🏦 Bank Transfer</SelectItem>
                              <SelectItem value="Cheque">📄 Cheque</SelectItem>
                              <SelectItem value="Insurance">🛡️ Insurance</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {hasInsurance && (
                        <p className="text-sm text-blue-600">
                          ℹ️ This patient has insurance. Payment must be processed through insurance claim.
                        </p>
                      )}
                      {!paymentMethod && !hasInsurance && (
                        <p className="text-sm text-red-600">Please select a payment method</p>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Mobile Money Fields */}
              {['M-Pesa', 'Airtel Money', 'Tigo Pesa', 'Halopesa'].includes(paymentMethod) && (
                <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-blue-600" />
                    <Label htmlFor="phoneNumber" className="text-blue-800 font-medium">
                      Phone Number *
                    </Label>
                  </div>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="0712345678"
                    pattern="^0[67][0-9]{8}$"
                    title="Please enter a valid Tanzanian phone number (07xxxxxxxx or 06xxxxxxxx)"
                    className="border-blue-300 focus:border-blue-500"
                    required
                  />
                  <p className="text-sm text-blue-600">
                    💡 Customer will receive payment request on this number
                  </p>
                  <p className="text-xs text-blue-500">
                    Format: 07xxxxxxxx or 06xxxxxxxx
                  </p>
                </div>
              )}

              {/* Bank Transfer Fields */}
              {paymentMethod === 'Bank Transfer' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input id="bankName" name="bankName" placeholder="e.g., CRDB Bank" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input id="accountNumber" name="accountNumber" placeholder="Account number" required />
                  </div>
                </div>
              )}

              {/* Cheque Fields */}
              {paymentMethod === 'Cheque' && (
                <div className="space-y-2">
                  <Label htmlFor="chequeNumber">Cheque Number</Label>
                  <Input id="chequeNumber" name="chequeNumber" placeholder="Cheque number" required />
                </div>
              )}

              {/* Insurance Fields */}
              {paymentMethod === 'Insurance' && (
                <div className="space-y-2">
                  <Label>Insurance Company</Label>
                  <Select name="insuranceCompanyId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select insurance company" />
                    </SelectTrigger>
                    <SelectContent>
                      {insuranceCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name} ({company.coverage_percentage}% coverage)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Mobile Payment Button */}
              {['M-Pesa', 'Airtel Money', 'Tigo Pesa', 'Halopesa'].includes(paymentMethod) ? (
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  disabled={mobilePaymentProcessing || !paymentMethod || !selectedInvoice}
                >
                  {mobilePaymentProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Payment Request
                    </>
                  )}
                </Button>
              ) : (
                /* Regular Payment Button */
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  disabled={!paymentMethod || !selectedInvoice}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              )}
            </form>
          </DialogContent>
        </Dialog>

        {/* Create Invoice Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
              <DialogDescription>
                Create a new invoice for patient services
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              {selectedPatientId && (() => {
                const patient = patients.find(p => p.id === selectedPatientId);
                const patientServicesList = patientServices.filter((s: any) => {
                  if (s.patient_id !== selectedPatientId) return false;
                  const serviceType = s.service?.service_type || '';
                  const isConsultation = serviceType.toLowerCase().includes('consultation');
                  return !isConsultation;
                });
                const totalCost = patientCosts[selectedPatientId] || 0;

                return (
                  <>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">Patient Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Name:</span> {patient?.full_name}</p>
                        <p><span className="font-medium">Phone:</span> {patient?.phone || '-'}</p>
                        <p><span className="font-medium">Services:</span> {patientServicesList.length}</p>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-900 mb-2">Services to Bill</h4>
                      <div className="space-y-2">
                        {patientServicesList.map((service: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{service.service_name || service.service?.service_name || 'Service'}</span>
                            <span className="font-medium">
                              {service.quantity} × TSh{Number(service.unit_price || service.service?.base_price || 0).toFixed(2)} = 
                              TSh{Number(service.total_price || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <div className="border-t border-green-300 pt-2 mt-2 flex justify-between font-bold text-green-900">
                          <span>Total Amount:</span>
                          <span>TSh{totalCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date (Optional)</Label>
                      <Input
                        id="dueDate"
                        name="dueDate"
                        type="date"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Add any additional notes..."
                        rows={3}
                      />
                    </div>
                  </>
                );
              })()}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!selectedPatientId}>
                  <File className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Insurance Claim Dialog */}
        <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
          <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Insurance Claim</DialogTitle>
              <DialogDescription>
                Submit a new insurance claim for an invoice
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              try {
                setLoading(true);
                
                const invoiceId = formData.get('invoiceId') as string;
                const insuranceCompanyId = formData.get('insuranceCompanyId') as string;
                const claimAmount = Number(formData.get('claimAmount') as string);
                const notes = formData.get('notes') as string;
                
                // Find patient from invoice
                const patientData = invoices.find(pd => pd.invoices.some(inv => inv.id === invoiceId));
                const invoice = patientData?.invoices.find(inv => inv.id === invoiceId);
                
                if (!patientData || !invoice) {
                  toast.error('Invoice not found');
                  return;
                }
                
                // Get insurance company details including API key
                const insuranceCompany = insuranceCompanies.find(ic => ic.id === insuranceCompanyId);
                
                if (!insuranceCompany) {
                  toast.error('Insurance company not found');
                  return;
                }

                const claimNumber = `CLM-${Date.now().toString().slice(-8)}`;
                
                // Prepare claim data
                const claimData = {
                  invoice_id: invoiceId,
                  insurance_company_id: insuranceCompanyId,
                  patient_id: patientData.patient?.id,
                  claim_number: claimNumber,
                  claim_amount: claimAmount,
                  notes: notes,
                  status: 'Pending',
                  submission_date: new Date().toISOString()
                };

                // If insurance company has API key, submit via API
                if (insuranceCompany.api_key && insuranceCompany.api_endpoint) {
                  try {
                    console.log('Submitting claim to insurance API:', insuranceCompany.api_endpoint);
                    
                    // NHIF Tanzania format
                    const apiPayload = {
                      ClaimNumber: claimNumber,
                      CardNumber: patientData.patient?.insurance_policy_number,
                      PatientName: patientData.patient?.full_name,
                      FacilityCode: insuranceCompany.facility_code || 'HF001',
                      DateOfService: invoice.invoice_date,
                      TotalAmount: claimAmount,
                      Services: invoice.invoice_items?.map((item: any) => ({
                        ServiceCode: item.item_type || 'CONS',
                        ServiceName: item.description,
                        Quantity: item.quantity,
                        UnitPrice: item.unit_price,
                        TotalPrice: item.total_price
                      })) || [],
                      Remarks: notes
                    };
                    
                    const response = await fetch(insuranceCompany.api_endpoint, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${insuranceCompany.api_key}`,
                        'X-API-Key': insuranceCompany.api_key
                      },
                      body: JSON.stringify(apiPayload)
                    });
                    
                    if (!response.ok) {
                      throw new Error(`API request failed: ${response.statusText}`);
                    }
                    
                    const apiResult = await response.json();
                    console.log('Insurance API response:', apiResult);
                    
                    // Update claim data with API response
                    claimData.notes = `${notes}\n\nAPI Response: ${JSON.stringify(apiResult)}`;
                    
                    toast.success('Claim submitted to insurance company via API');
                  } catch (apiError) {
                    console.error('Insurance API error:', apiError);
                    toast.warning('Claim saved locally but API submission failed. Will retry later.');
                    claimData.notes = `${notes}\n\nAPI Error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`;
                  }
                } else {
                  console.log('No API configuration found, saving claim locally only');
                }

                // Save claim to database
                try {
                  const response = await api.post('/insurance/claims', claimData);
                  toast.success('Insurance claim submitted successfully');
                  setClaimDialogOpen(false);
                  
                  // Add new claim to local state
                  if (response.data.claim) {
                    setRawClaimsData(prev => [...prev, response.data.claim]);
                  }
                } catch (error: any) {
                  console.error('Database error:', error);
                  toast.error(`Failed to save claim: ${error.message}`);
                }
              } catch (error) {
                console.error('Claim submission error:', error);
                toast.error('Failed to submit claim');
              } finally {
                setLoading(false);
              }
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceId">Invoice</Label>
                <Select name="invoiceId" value={claimInvoiceId} onValueChange={(value) => {
                  setClaimInvoiceId(value);
                  // Auto-fill claim amount with invoice total
                  console.log('Selected invoice ID:', value);
                  console.log('All invoices:', invoices);
                  
                  const selectedInvoice = invoices
                    .flatMap(pd => pd.invoices || [])
                    .find(inv => inv.id === value);
                  
                  console.log('Found invoice:', selectedInvoice);
                  
                  if (selectedInvoice) {
                    const amount = Number(selectedInvoice.total_amount || 0).toString();
                    console.log('Setting claim amount to:', amount);
                    setClaimAmount(amount);
                  }
                }} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const eligibleInvoices = invoices.filter(patientData => 
                        patientData.patient?.insurance_company_id && patientData.status !== 'Paid'
                      );
                      
                      if (eligibleInvoices.length === 0) {
                        return <SelectItem value="no-invoices" disabled>No eligible invoices (patients must have insurance)</SelectItem>;
                      }
                      
                      return eligibleInvoices.map((patientData, index) => (
                        <Fragment key={patientData.patient.id || index}>
                          {patientData.invoices
                            .filter(inv => inv.status !== 'Paid')
                            .map(invoice => (
                              <SelectItem key={invoice.id} value={invoice.id}>
                                {invoice.invoice_number} - {patientData.patient?.full_name || 'Unknown'} (TSh{Number(invoice.total_amount).toFixed(2)})
                              </SelectItem>
                            ))}
                        </Fragment>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="insuranceCompanyId">Insurance Company</Label>
                <Select name="insuranceCompanyId" value={claimInsuranceId} onValueChange={setClaimInsuranceId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select insurance company" />
                  </SelectTrigger>
                  <SelectContent>
                    {insuranceCompanies && insuranceCompanies.length > 0 ? (
                      insuranceCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name} ({company.coverage_percentage || 100}% coverage)
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-insurance" disabled>
                        No insurance companies available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="claimAmount">Claim Amount (TSh)</Label>
                <Input
                  id="claimAmount"
                  name="claimAmount"
                  type="number"
                  step="0.01"
                  value={claimAmount}
                  readOnly
                  disabled
                  className="bg-gray-100"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Auto-filled from invoice total (read-only).
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>
              <Button type="submit" className="w-full">Submit Claim</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
