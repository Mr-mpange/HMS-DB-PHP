import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Upload, File, CheckCircle, AlertCircle, Pill, AlertTriangle, Package, Plus, Edit, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { generateInvoiceNumber, logActivity } from '@/lib/utils';
import { DispenseDialog } from '@/components/DispenseDialog';
import api from '@/lib/api';

interface Medication {
  id: string;
  name: string;
  stock_quantity: number;
  quantity_in_stock?: number; // Legacy field for compatibility
  reorder_level: number;
  [key: string]: any;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email?: string;
  [key: string]: any;
}

interface MedicationInfo {
  id: string;
  name: string;
  dosage_form?: string;
  strength?: string;
  manufacturer?: string;
  [key: string]: any;
}

interface PrescriptionMedication {
  medication_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity: number;
  instructions?: string;
}

interface Prescription {
  id: string;
  patient_id: string;
  patient?: UserProfile;
  medications: PrescriptionMedication[];
  doctor_id?: string;
  doctor_profile?: UserProfile;
  status: 'Active' | 'Completed' | 'Cancelled' | string;
  lab_result_id?: string;
  prescribed_date: string;
  prescription_date?: string;
  [key: string]: any;
}

export default function PharmacyDashboard() {
  const { user } = useAuth() || {} as { user: UserProfile | null };
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [stats, setStats] = useState({ pendingPrescriptions: 0, lowStock: 0, totalMedications: 0 });
  const [loading, setLoading] = useState(true); // Initial load only
  const [refreshing, setRefreshing] = useState(false); // Background refresh
  const [medicationDialogOpen, setMedicationDialogOpen] = useState<boolean>(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [stockDialogOpen, setStockDialogOpen] = useState<boolean>(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [prescriptionFilter, setPrescriptionFilter] = useState<'pending' | 'all'>('pending');
  const [dispenseDialogOpen, setDispenseDialogOpen] = useState(false);
  const [selectedPrescriptionForDispense, setSelectedPrescriptionForDispense] = useState<any>(null);
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  
  // Type for the combined prescription data
  interface PrescriptionWithRelations extends Prescription {
    patient: UserProfile | null;
    doctor_profile: UserProfile | null;
  }

  const loadPharmacyData = async (isInitialLoad = true) => {
    if (!user) {
      const errorMsg = 'User not authenticated';
      setLoadError(errorMsg);
      if (isInitialLoad) toast.error(errorMsg);
      return;
    }

    try {
      // Only show full loading screen on initial load
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setLoadError(null);

      // Fetch all the data we need from MySQL API
      const [
        prescriptionsRes,
        medicationsRes,
        patientsRes,
        doctorsRes
      ] = await Promise.allSettled([
        api.get('/prescriptions?limit=50&visit_stage=pharmacy'),
        api.get('/pharmacy/medications'),
        api.get('/patients?fields=id,full_name,date_of_birth'),
        api.get('/users/profiles?role=doctor')
      ]);
      
      const prescriptionsData = prescriptionsRes.status === 'fulfilled' ? (prescriptionsRes.value.data.prescriptions || []) : [];
      const medicationsData = medicationsRes.status === 'fulfilled' ? (medicationsRes.value.data.medications || []) : [];
      const patientsData = patientsRes.status === 'fulfilled' ? (patientsRes.value.data.patients || []) : [];
      const doctorsData = doctorsRes.status === 'fulfilled' ? (doctorsRes.value.data.profiles || []) : [];
      
      console.log('🏥 Pharmacy Dashboard - Prescriptions loaded:', {
        total: prescriptionsData.length,
        active: prescriptionsData.filter((p: any) => p.status === 'Active').length,
        prescriptions: prescriptionsData.map((p: any) => ({
          id: p.id,
          patient_id: p.patient_id,
          status: p.status,
          visit_id: p.visit_id,
          visit_stage: p.visit?.current_stage
        }))
      });
      
      // Log any failed requests
      if (prescriptionsRes.status === 'rejected') console.warn('Failed to fetch prescriptions:', prescriptionsRes.reason);
      if (medicationsRes.status === 'rejected') console.warn('Failed to fetch medications:', medicationsRes.reason);
      if (patientsRes.status === 'rejected') console.warn('Failed to fetch patients:', patientsRes.reason);
      if (doctorsRes.status === 'rejected') console.warn('Failed to fetch doctors:', doctorsRes.reason);
      
      // Combine the data manually
      // Note: medications array is already parsed from JSON by the backend
      const combinedPrescriptions: PrescriptionWithRelations[] = (prescriptionsData || []).map((prescription: any) => ({
        ...prescription,
        patient: (patientsData || []).find((p: any) => p.id === prescription.patient_id) || null,
        doctor_profile: (doctorsData || []).find((d: any) => d.id === prescription.doctor_id) || null,
        // medications array is already included in prescription from backend
      }));

      setPrescriptions(combinedPrescriptions);
      setMedications(medicationsData || []);

      const pending = (prescriptionsData || []).filter(p => p.status === 'Active' || p.status === 'Pending').length;
      const lowStock = (medicationsData || []).filter(m => (m.stock_quantity || m.quantity_in_stock || 0) <= m.reorder_level).length;

      setStats({
        pendingPrescriptions: pending,
        lowStock,
        totalMedications: (medicationsData || []).length
      });
      
      // Silently load data - no toast needed for background refresh
    } catch (error) {
      console.error('Error loading pharmacy data:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to load pharmacy data';
      setLoadError(errorMsg);
      
      if (isInitialLoad) {
        toast.error(errorMsg, {
          action: {
            label: 'Retry',
            onClick: () => loadPharmacyData(true)
          }
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data load and polling for updates
  useEffect(() => {
    if (!user) return;
    
    loadPharmacyData(true); // Initial load with loading screen

    // Set up polling instead of real-time subscriptions (every 30 seconds)
    const intervalId = setInterval(() => {
      loadPharmacyData(false); // Background refresh without loading screen
    }, 30000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [user]);

  const handleOpenDispenseDialog = async (prescription: any) => {
    try {
      // Fetch full prescription details with items
      const response = await api.get(`/prescriptions/${prescription.id}`);
      const fullPrescription = response.data.prescription;
      
      // Merge with existing prescription data (patient, doctor info)
      setSelectedPrescriptionForDispense({
        ...prescription,
        ...fullPrescription,
        items: fullPrescription.items || fullPrescription.medications || []
      });
      setDispenseDialogOpen(true);
    } catch (error) {
      console.error('Error fetching prescription details:', error);
      toast.error('Failed to load prescription details');
    }
  };

  const handleDispenseWithDetails = async (dispenseData: any) => {
    if (!selectedPrescriptionForDispense || !user?.id) {
      toast.error('Missing prescription or user information');
      return;
    }

    const prescriptionId = selectedPrescriptionForDispense.id;
    const patientId = selectedPrescriptionForDispense.patient_id;

    setLoadingStates(prev => ({ ...prev, [prescriptionId]: true }));

    try {
      // Continue with dispensing using the edited dosage and quantity
      await handleDispensePrescription(prescriptionId, patientId, dispenseData);
      setDispenseDialogOpen(false);
      setSelectedPrescriptionForDispense(null);
    } catch (error) {
      console.error('Dispense error:', error);
      toast.error('Failed to process dispensing');
    } finally {
      setLoadingStates(prev => ({ ...prev, [prescriptionId]: false }));
    }
  };

  const handleDispensePrescription = async (prescriptionId: string, patientId: string, dispenseData?: any) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, [prescriptionId]: true }));

    try {
      await logActivity('pharmacy.dispense.start', { 
        user_id: user.id,
        prescription_id: prescriptionId,
        patient_id: patientId,
        timestamp: new Date().toISOString()
      });

      // First, get the prescription details
      let prescriptionRes;
      try {
        prescriptionRes = await api.get(`/prescriptions/${prescriptionId}`);
      } catch (error: any) {
        console.error('Error fetching prescription:', error);
        await logActivity('pharmacy.dispense.error', { 
          error: 'Failed to fetch prescription',
          details: error.message 
        });
        toast.error('Failed to fetch prescription details');
        return;
      }
      const prescription = prescriptionRes.data.prescription;

      if (!prescription) {
        await logActivity('pharmacy.dispense.error', { 
          error: 'Prescription not found',
          prescription_id: prescriptionId 
        });
        toast.error('Prescription not found');
        return;
      }

      // Check if prescription has medications (items)
      const prescriptionItems = prescription.items || prescription.medications || [];
      if (prescriptionItems.length === 0) {
        await logActivity('pharmacy.dispense.error', { 
          error: 'No medications in prescription',
          prescription_id: prescriptionId
        });
        toast.error('Prescription does not have any medications');
        return;
      }

      // Use edited medications from dispenseData if available, otherwise use prescription items
      const medicationsToDispense = dispenseData?.medications || prescriptionItems;
      const medicationDetails = [];
      
      // Fetch all medication details
      for (const med of medicationsToDispense) {
        try {
          const medicationRes = await api.get(`/pharmacy/medications/${med.medication_id}`);
          medicationDetails.push({
            ...medicationRes.data.medication,
            // Use dispensed quantities/dosages if available
            prescribed_quantity: med.dispensed_quantity || med.quantity,
            prescribed_dosage: med.dispensed_dosage || med.dosage,
            prescribed_frequency: med.frequency,
            prescribed_instructions: med.instructions
          });
        } catch (error: any) {
          console.error('Error fetching medication:', error);
          toast.error(`Failed to fetch medication details for ${med.medication_name}`);
          return;
        }
      }

      // STEP 1: Add medications as patient-services (for comprehensive billing)
      // This allows billing to create ONE invoice with all services (lab tests + medications)
      try {
        console.log('Adding medications to patient services for billing...');
        
        for (const medDetail of medicationDetails) {
          await api.post('/patient-services', {
            patient_id: patientId,
            service_id: null, // Medications don't have a service_id
            service_name: `${medDetail.name} - ${medDetail.prescribed_dosage}`,
            quantity: medDetail.prescribed_quantity,
            unit_price: medDetail.unit_price || 0,
            total_price: (medDetail.unit_price || 0) * medDetail.prescribed_quantity,
            service_date: new Date().toISOString().split('T')[0],
            status: 'Completed',
            notes: `Medication: ${medDetail.prescribed_frequency}${medDetail.prescribed_instructions ? '. ' + medDetail.prescribed_instructions : ''}`
          });
          
          console.log(`✅ Added ${medDetail.name} (TSh ${medDetail.unit_price * medDetail.prescribed_quantity}) to patient services`);
        }
      } catch (error: any) {
        console.error('❌ Error adding medications to patient services:', error);
        const errorMsg = error.response?.data?.details || error.response?.data?.error || error.message;
        toast.error(`Failed to add medications to billing: ${errorMsg}`);
        await logActivity('pharmacy.dispense.error', { 
          error: 'Failed to add medications to patient services',
          details: errorMsg,
          response: error.response?.data
        });
        return; // STOP HERE if adding to services fails
      }

      // STEP 2: Update medication stock
      for (const medDetail of medicationDetails) {
        const dispensedQuantity = medDetail.prescribed_quantity;
        const currentStock = medDetail.stock_quantity || medDetail.quantity_in_stock || 0;
        const newStock = currentStock - dispensedQuantity;
        
        if (newStock < 0) {
          toast.error(`Insufficient stock for ${medDetail.name}`);
          await logActivity('pharmacy.dispense.error', { 
            error: 'Insufficient stock',
            medication_id: medDetail.id,
            medication_name: medDetail.name,
            required: dispensedQuantity,
            available: currentStock
          });
          return;
        }
        
        try {
          await api.put(`/pharmacy/medications/${medDetail.id}`, {
            stock_quantity: newStock,
            quantity_in_stock: newStock // Send both for compatibility
          });
        } catch (error: any) {
          console.error('Error updating stock:', error);
          toast.error(`Failed to update stock for ${medDetail.name}: ${error.message}`);
          return;
        }
      }

      // STEP 3: Update prescription status
      const updateData: any = {
        status: 'Completed'
      };

      if (dispenseData?.notes) {
        updateData.notes = dispenseData.notes;
      }

      try {
        await api.put(`/prescriptions/${prescriptionId}`, updateData);
      } catch (error: any) {
        console.error('Error updating prescription:', error);
        await logActivity('pharmacy.dispense.error', { 
          error: 'Failed to update prescription',
          details: error.message,
          prescription_id: prescriptionId
        });
        toast.error(`Failed to update prescription: ${error.message}`);
        return;
      }

      // STEP 4: Check if this is the last pending prescription for this patient
      let prescriptionsRes;
      try {
        prescriptionsRes = await api.get(`/prescriptions?patient_id=${patientId}`);
      } catch (error: any) {
        console.error('Error fetching patient prescriptions:', error);
        prescriptionsRes = { data: { prescriptions: [] } };
      }
      
      const allPatientPrescriptions = prescriptionsRes.data.prescriptions;
      const pendingCount = allPatientPrescriptions?.filter((p: any) => p.status === 'Active' && p.id !== prescriptionId).length || 0;
      const isLastPrescription = pendingCount === 0;
      
      console.log(`Dispensing prescription. Remaining pending prescriptions: ${pendingCount}`);
      
      // Only update patient visit to billing if this is the last prescription
      if (isLastPrescription) {
        console.log('This is the last prescription - moving patient to billing');
        
        let visitsRes;
        try {
          visitsRes = await api.get(`/visits?patient_id=${patientId}&overall_status=Active&limit=1`);
        } catch (error: any) {
          console.error('Error fetching patient visits:', error);
          visitsRes = { data: { visits: [] } };
        }
        
        const visits = visitsRes.data.visits;

        if (visits && visits.length > 0) {
          const visit = visits[0];
          console.log('Updating patient visit to billing stage:', visit.id);
          
          try {
            await api.put(`/visits/${visit.id}`, {
              pharmacy_status: 'Completed',
              pharmacy_completed_at: new Date().toISOString(),
              current_stage: 'billing',
              billing_status: 'Pending',
              overall_status: 'Active',
              updated_at: new Date().toISOString()
            });
          
          console.log('✅ Patient visit successfully moved to billing stage');
          await logActivity('pharmacy.visit.moved_to_billing', {
            visit_id: visit.id,
            patient_id: patientId,
            user_id: user.id
          });
        } catch (error: any) {
          console.error('Error updating patient visit:', error);
          toast.error(`Failed to update patient visit: ${error.message}`);
          return;
        }
        } else {
          console.warn('No active visit found for patient, but continuing with dispensing');
        }
      } else {
        console.log(`Not moving to billing yet - ${pendingCount} prescriptions still pending`);
      }

      // STEP 5: Log successful dispense
      await logActivity('pharmacy.dispense.success', {
        user_id: user.id,
        prescription_id: prescriptionId,
        patient_id: patientId,
        medications: medicationDetails.map(m => ({
          medication_id: m.id,
          medication_name: m.name,
          quantity: m.prescribed_quantity
        })),
        medication_count: medicationDetails.length,
        timestamp: new Date().toISOString()
      });

      
      toast.success('Prescription dispensed successfully');
      
      // Update local state
      setPrescriptions(prev => prev.filter(p => p.id !== prescriptionId));
    } catch (error) {
      console.error('Error dispensing prescription:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to dispense prescription';
      
      await logActivity('pharmacy.dispense.error', {
        error: errorMsg,
        prescription_id: prescriptionId,
        user_id: user?.id,
        timestamp: new Date().toISOString()
      });
      
      toast.error(errorMsg);
    } finally {
      setLoadingStates(prev => ({ ...prev, [prescriptionId]: false }));
    }
  };

  const handleUpdateStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMedication) return;

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const quantity = formData.get('quantity');
    const newQuantity = quantity ? Number(quantity) : 0;
    
    if (isNaN(newQuantity)) {
      toast.error('Please enter a valid quantity');
      return;
    }
    
    if (isNaN(newQuantity)) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      await api.put(`/pharmacy/medications/${selectedMedication.id}`, { 
        stock_quantity: newQuantity,
        quantity_in_stock: newQuantity 
      });
    } catch (error: any) {
      toast.error('Failed to update stock');
      return;
    }

    toast.success('Stock updated successfully');
    setStockDialogOpen(false);
    setSelectedMedication(null);
    loadPharmacyData(false); // Background refresh
  };

  const handleSaveMedication = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const quantity = formData.get('quantity');
    const reorderLevel = formData.get('reorderLevel');
    const unitPrice = formData.get('unitPrice');
    
    if (!name || !quantity || !reorderLevel || !unitPrice) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const quantityNum = Number(quantity);
    const reorderLevelNum = Number(reorderLevel);
    const unitPriceNum = Number(unitPrice);
    
    if (isNaN(quantityNum) || isNaN(reorderLevelNum) || isNaN(unitPriceNum)) {
      toast.error('Please enter valid numbers for quantity, reorder level, and unit price');
      return;
    }

    const medicationData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || '',
      quantity_in_stock: Number(quantity),
      reorder_level: Number(reorderLevel),
      unit_price: Number(unitPrice),
      manufacturer: formData.get('manufacturer') as string || '',
      dosage_form: formData.get('dosageForm') as string || '',
      strength: formData.get('strength') as string || '',
      expiry_date: formData.get('expiryDate') as string || null,
    };

    try {
      if (editingMedication) {
        await api.put(`/pharmacy/medications/${editingMedication.id}`, medicationData);
      } else {
        await api.post('/pharmacy/medications', medicationData);
      }
    } catch (error: any) {
      toast.error(`Failed to ${editingMedication ? 'update' : 'add'} medication`);
      return;
    }

    toast.success(`Medication ${editingMedication ? 'updated' : 'added'} successfully`);
    setMedicationDialogOpen(false);
    setEditingMedication(null);
    loadPharmacyData(false); // Background refresh
  };

  const openStockDialog = (medication: any) => {
    setSelectedMedication(medication);
    setStockDialogOpen(true);
  };

  const openEditDialog = (medication: any) => {
    setEditingMedication(medication);
    setMedicationDialogOpen(true);
  };



  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map((line, index) => {
      if (!line.trim()) return null;

      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const medication: any = {};

      headers.forEach((header, i) => {
        const value = values[i] || '';
        switch (header.toLowerCase()) {
          case 'name':
            medication.name = value;
            break;
          case 'generic_name':
          case 'generic name':
            medication.generic_name = value || null;
            break;
          case 'strength':
            medication.strength = value;
            break;
          case 'dosage_form':
          case 'dosage form':
            medication.dosage_form = value || 'Tablet';
            break;
          case 'manufacturer':
            medication.manufacturer = value || null;
            break;
          case 'quantity_in_stock':
          case 'quantity':
          case 'stock':
            medication.quantity_in_stock = parseInt(value) || 0;
            break;
          case 'reorder_level':
          case 'reorder level':
            medication.reorder_level = parseInt(value) || 10;
            break;
          case 'unit_price':
          case 'unit price':
          case 'price':
            medication.unit_price = parseFloat(value) || 0;
            break;
          case 'expiry_date':
          case 'expiry date':
            medication.expiry_date = value || null;
            break;
        }
      });

      // Validate required fields
      if (!medication.name || !medication.strength) {
        medication.error = 'Missing required fields: name or strength';
      }

      return medication;
    }).filter(Boolean);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setImportFile(file);

    const text = await file.text();
    const medications = parseCSV(text);

    const validMedications = medications.filter(med => !med.error);
    const invalidMedications = medications.filter(med => med.error);

    setImportPreview(validMedications);

    if (invalidMedications.length > 0) {
      toast.warning(`${invalidMedications.length} rows have errors and will be skipped`);
    }

    if (validMedications.length === 0) {
      toast.error('No valid medications found in the file');
      return;
    }

    toast.success(`Found ${validMedications.length} valid medications to import`);
  };

  const handleBulkImport = async () => {
    if (importPreview.length === 0) {
      toast.error('No medications to import');
      return;
    }

    setImportLoading(true);
    setImportProgress(0);

    const medicationsToImport = importPreview.map(med => ({
      name: med.name,
      generic_name: med.generic_name,
      strength: med.strength,
      dosage_form: med.dosage_form,
      manufacturer: med.manufacturer,
      quantity_in_stock: med.quantity_in_stock,
      reorder_level: med.reorder_level,
      unit_price: med.unit_price,
      expiry_date: med.expiry_date,
    }));

    try {
      await api.post('/pharmacy/medications/bulk', { medications: medicationsToImport });
      toast.success(`Successfully imported ${medicationsToImport.length} medications`);
      setImportDialogOpen(false);
      setImportFile(null);
      setImportPreview([]);
      loadPharmacyData(false); // Background refresh
    } catch (error: any) {
      console.error('Bulk import error:', error);
      toast.error(`Failed to import medications: ${error.message}`);
    } finally {
      setImportLoading(false);
      setImportProgress(0);
    }
  };

  const createInvoiceFromPrescription = async (prescription: {
    id: string;
    medication_id: string;
    patient_id: string;
    quantity: number;
    dosage: string;
    [key: string]: any;
  }) => {
    try {
      console.log('Starting invoice creation for prescription:', prescription.id);

      if (!prescription.medication_id) {
        throw new Error('Prescription does not have a valid medication ID');
      }

      // Get medication details to calculate pricing
      console.log('Fetching medication details for ID:', prescription.medication_id);
      let medicationRes;
      try {
        medicationRes = await api.get(`/pharmacy/medications/${prescription.medication_id}`);
      } catch (error: any) {
        console.error('Error fetching medication:', error);
        throw new Error(`Failed to fetch medication details: ${error.message}`);
      }

      const medicationData = medicationRes.data.medication;

      if (!medicationData) {
        throw new Error('Medication not found');
      }

      console.log('Medication found:', medicationData.name);

      // Calculate total amount (medication price * quantity + 10% tax)
      const subtotal = medicationData.unit_price * prescription.quantity;
      const tax = subtotal * 0.1;
      const totalAmount = subtotal + tax;

      console.log(`Calculated amounts - Subtotal: ${subtotal}, Tax: ${tax}, Total: ${totalAmount}`);

      // Create invoice with retry logic for duplicate invoice numbers
      let invoice = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const invoiceNumber = await generateInvoiceNumber();
          const invoiceData = {
            invoice_number: invoiceNumber,
            patient_id: prescription.patient_id,
            total_amount: totalAmount,
            tax: tax,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            notes: `Auto-generated invoice for prescription: ${medicationData.name} (${prescription.dosage})`,
            status: 'unpaid' // Using 'unpaid' as it's a standard invoice status
          };

          console.log(`Attempt ${attempts + 1}: Creating invoice with number:`, invoiceNumber);
          
          let data;
          try {
            const invoiceRes = await api.post('/billing/invoices', invoiceData);
            data = invoiceRes.data.invoice;
          } catch (error: any) {
            console.error(`Invoice creation attempt ${attempts + 1} failed:`, error);
            
            // If it's a duplicate key error and we have retries left, try again
            if (error.response?.status === 409 || (error as any).code === '23505') {
              if (attempts < maxAttempts - 1) {
              console.warn(`Duplicate invoice number ${invoiceNumber}, retrying...`);
                attempts++;
                console.warn(`Duplicate invoice number detected, retrying (${attempts}/${maxAttempts})...`);
                // Add an increasing delay between retries
                await new Promise(resolve => setTimeout(resolve, 200 * attempts));
                continue;
              } else {
                // If we're out of retries, try one last time with a timestamp-based number
                console.warn('Max retries reached, trying with timestamp-based invoice number');
                const timestamp = Date.now().toString().slice(-6);
                const fallbackInvoiceNumber = `INV-${timestamp}`;
                
                try {
                  const fallbackRes = await api.post('/billing/invoices', {
                    ...invoiceData,
                    invoice_number: fallbackInvoiceNumber,
                    status: 'unpaid' // Ensure status is set for fallback as well
                  });
                  
                  data = fallbackRes.data.invoice;
                } catch (fallbackError: any) {
                  console.error('Fallback invoice creation failed:', fallbackError);
                  throw new Error(`Failed to create invoice after ${maxAttempts} attempts and fallback: ${fallbackError.message}`);
                }
                
                break;
              }
            }
            // If it's a different error, throw it
            throw new Error(`Failed to create invoice: ${error.message}`);
          }


          
          invoice = data;
          break; // Success, exit the retry loop
          
        } catch (error) {
          if (attempts >= maxAttempts - 1) {
            console.error(`Failed to create invoice after ${maxAttempts} attempts:`, error);
            throw error;
          }
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      if (!invoice) {
        throw new Error('Failed to create invoice after multiple attempts');
      }

      console.log('Invoice created:', invoice);

      // Create invoice item
      const invoiceItemData = {
        invoice_id: invoice.id,
        description: `${medicationData.name} ${prescription.dosage}`,
        item_type: 'medication',
        quantity: prescription.quantity,
        unit_price: medicationData.unit_price,
        total_price: subtotal,
        medication_id: prescription.medication_id
      };

      console.log('Creating invoice item:', invoiceItemData);
      try {
        await api.post('/billing/invoice-items', invoiceItemData);
      } catch (error: any) {
        console.error('Error creating invoice item:', error);
        throw new Error(`Failed to create invoice item: ${error.message}`);
      }

      console.log('Invoice item created successfully');
      return invoice;
    } catch (error) {
      console.error('Error in createInvoiceFromPrescription:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Pharmacy Dashboard">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg"></div>)}
          </div>
          <div className="h-96 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Pharmacy Dashboard">
      <div className="space-y-6">
        {/* Background Refresh Indicator */}
        {refreshing && (
          <div className="fixed top-4 right-4 z-50 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 shadow-sm animate-in slide-in-from-right-2">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Updating...</span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Prescriptions</CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPrescriptions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingPrescriptions === 0 ? 'All caught up!' : 'Awaiting fulfillment'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lowStock}</div>
              <p className="text-xs text-muted-foreground">
                {stats.lowStock === 0 ? 'Stock levels good' : 'Below reorder level'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Medications</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMedications}</div>
              <p className="text-xs text-muted-foreground">In inventory</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="prescriptions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="prescriptions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Prescriptions</CardTitle>
                  <CardDescription>
                    {prescriptionFilter === 'pending' 
                      ? (prescriptions.filter(p => p.status === 'Active' || p.status === 'Pending').length > 0 
                          ? `Showing ${Math.min(prescriptions.filter(p => p.status === 'Active' || p.status === 'Pending').length, 10)} of ${prescriptions.filter(p => p.status === 'Active' || p.status === 'Pending').length} pending`
                          : 'No pending prescriptions')
                      : (prescriptions.length > 0 
                          ? `Showing ${Math.min(prescriptions.length, 10)} of ${prescriptions.length} prescriptions`
                          : 'No prescriptions found')}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                    <Button
                      variant={prescriptionFilter === 'pending' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPrescriptionFilter('pending')}
                    >
                      Pending
                    </Button>
                    <Button
                      variant={prescriptionFilter === 'all' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPrescriptionFilter('all')}
                    >
                      All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(prescriptionFilter === 'pending' 
                    ? prescriptions.filter(p => p.status === 'Active' || p.status === 'Pending') 
                    : prescriptions
                  ).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">
                      {prescriptionFilter === 'pending' ? 'No pending prescriptions' : 'No prescriptions found'}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      When prescriptions are created, they will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      // Group prescriptions by patient
                      const filteredPrescriptions = prescriptionFilter === 'pending' 
                        ? prescriptions.filter(p => p.status === 'Active' || p.status === 'Pending') 
                        : prescriptions;
                      
                      const groupedByPatient = filteredPrescriptions.reduce((acc: any, prescription) => {
                        const patientId = prescription.patient_id;
                        if (!acc[patientId]) {
                          acc[patientId] = {
                            patient: prescription.patient,
                            prescriptions: []
                          };
                        }
                        acc[patientId].prescriptions.push(prescription);
                        return acc;
                      }, {});

                      return Object.entries(groupedByPatient).slice(0, 10).map(([patientId, data]: [string, any]) => {
                        const isExpanded = expandedPatients.has(patientId);
                        const patientPrescriptions = data.prescriptions;
                        const firstPrescription = patientPrescriptions[0];
                        
                        return (
                          <Card key={patientId} className="overflow-hidden">
                            <div 
                              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => {
                                const newExpanded = new Set(expandedPatients);
                                if (isExpanded) {
                                  newExpanded.delete(patientId);
                                } else {
                                  newExpanded.add(patientId);
                                }
                                setExpandedPatients(newExpanded);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <div className="font-semibold text-lg">{data.patient?.full_name || 'Unknown Patient'}</div>
                                    <Badge variant="secondary">
                                      {patientPrescriptions.length} prescription{patientPrescriptions.length !== 1 ? 's' : ''}
                                    </Badge>
                                    {patientPrescriptions.some((p: any) => p.status === 'Active' || p.status === 'Pending') && (
                                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                        Pending
                                      </Badge>
                                    )}
                                  </div>
                                  {data.patient?.date_of_birth && (
                                    <div className="text-sm text-muted-foreground mt-1">
                                      DOB: {format(new Date(data.patient.date_of_birth), 'MM/dd/yyyy')} • {data.patient?.phone || 'No phone'}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {patientPrescriptions.some((p: any) => p.status === 'Active' || p.status === 'Pending') && (
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Dispense all pending prescriptions
                                        const pendingPrescriptions = patientPrescriptions.filter((p: any) => p.status === 'Active' || p.status === 'Pending');
                                        if (pendingPrescriptions.length > 0) {
                                          handleOpenDispenseDialog(pendingPrescriptions[0]);
                                        }
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Dispense All ({patientPrescriptions.filter((p: any) => p.status === 'Active' || p.status === 'Pending').length})
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm">
                                    {isExpanded ? 'Hide' : 'View'} Prescriptions
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="border-t">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Medication</TableHead>
                                      <TableHead>Dosage</TableHead>
                                      <TableHead>Quantity</TableHead>
                                      <TableHead>Prescribed By</TableHead>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {patientPrescriptions.flatMap((prescription: any) => {
                                      // Get items or medications (support both formats)
                                      const prescriptionItems = prescription.items || prescription.medications || [];
                                      const meds = Array.isArray(prescriptionItems) 
                                        ? prescriptionItems 
                                        : (typeof prescriptionItems === 'string' 
                                            ? JSON.parse(prescriptionItems) 
                                            : [prescription]);
                                      
                                      // Create a row for each medication in the prescription
                                      return meds.map((med: any, index: number) => (
                                        <TableRow 
                                          key={`${prescription.id}-${index}`}
                                          className={loadingStates[prescription.id] ? 'opacity-50' : ''}
                                        >
                                          <TableCell>
                                            <div className="font-medium">
                                              {med.medication_name || med.name}
                                            </div>
                                            {med.instructions && (
                                              <div className="text-xs text-muted-foreground">
                                                {med.instructions}
                                              </div>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            <div className="text-sm">{med.dosage}</div>
                                            <div className="text-xs text-muted-foreground">{med.frequency}</div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="font-medium">{med.quantity}</div>
                                            <div className="text-xs text-muted-foreground">{med.duration}</div>
                                          </TableCell>
                                        <TableCell>
                                          {prescription.doctor_profile ? (
                                            <div className="text-sm">{prescription.doctor_profile.full_name}</div>
                                          ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {(() => {
                                            const dateValue = prescription.prescribed_date || prescription.prescription_date || prescription.created_at;
                                            if (!dateValue) return <span className="text-muted-foreground text-sm">-</span>;
                                            try {
                                              const date = new Date(dateValue);
                                              if (isNaN(date.getTime())) return <span className="text-muted-foreground text-sm">-</span>;
                                              return (
                                                <>
                                                  <div className="text-sm">{format(date, 'MMM d')}</div>
                                                  <div className="text-xs text-muted-foreground">
                                                    {format(date, 'h:mm a')}
                                                  </div>
                                                </>
                                              );
                                            } catch (e) {
                                              return <span className="text-muted-foreground text-sm">-</span>;
                                            }
                                          })()}
                                        </TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={
                                              prescription.status === 'Dispensed'
                                                ? 'default'
                                                : prescription.status === 'Cancelled'
                                                ? 'destructive'
                                                : 'secondary'
                                            }
                                            className="capitalize"
                                          >
                                            {prescription.status.toLowerCase()}
                                          </Badge>
                                        </TableCell>
                                          <TableCell className="text-right">
                                            {index === 0 && (prescription.status === 'Active' || prescription.status === 'Pending') ? (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleOpenDispenseDialog(prescription);
                                                }}
                                                disabled={loadingStates[prescription.id]}
                                              >
                                                {loadingStates[prescription.id] ? (
                                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : (
                                                  <CheckCircle className="h-4 w-4 mr-2" />
                                                )}
                                                Dispense All
                                              </Button>
                                            ) : index === 0 ? (
                                              <span className="text-muted-foreground text-sm">
                                                Dispensed
                                              </span>
                                            ) : null}
                                          </TableCell>
                                        </TableRow>
                                      ));
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </Card>
                        );
                      });
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            {/* Critical Low Stock Alert */}
            {medications.filter(m => (m.stock_quantity || m.quantity_in_stock || 0) <= 5).length > 0 && (
              <Card className="shadow-lg border-red-200 bg-red-50 mb-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    Critical Low Stock Alert
                  </CardTitle>
                  <CardDescription className="text-red-600">
                    {medications.filter(m => (m.stock_quantity || m.quantity_in_stock || 0) <= 5).length} medication(s) have 5 or fewer units remaining
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {medications
                      .filter(m => (m.stock_quantity || m.quantity_in_stock || 0) <= 5)
                      .sort((a, b) => (a.stock_quantity || a.quantity_in_stock || 0) - (b.stock_quantity || b.quantity_in_stock || 0))
                      .map(med => (
                        <div key={med.id} className="flex items-center justify-between p-3 bg-white rounded-md border border-red-200">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <div>
                              <p className="font-medium text-red-900">{med.name} ({med.strength})</p>
                              <p className="text-sm text-red-700">
                                Only <span className="font-bold">{med.stock_quantity || med.quantity_in_stock || 0}</span> units left
                                {(med.stock_quantity || med.quantity_in_stock || 0) === 0 && <span className="ml-2 text-red-800 font-bold">OUT OF STOCK!</span>}
                              </p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => openStockDialog(med)}
                          >
                            Restock Now
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Medication Inventory</CardTitle>
                  <CardDescription>Track and manage medication stock levels</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Medications
                  </Button>
                  <Button onClick={() => setMedicationDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Medication
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Generic Name</TableHead>
                        <TableHead>Strength</TableHead>
                        <TableHead>Form</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Reorder Level</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medications.map((med) => {
                        const isLowStock = (med.stock_quantity || med.quantity_in_stock || 0) <= med.reorder_level;
                        return (
                          <TableRow key={med.id}>
                            <TableCell className="font-medium">{med.name}</TableCell>
                            <TableCell className="text-muted-foreground">{med.generic_name || '-'}</TableCell>
                            <TableCell>{med.strength}</TableCell>
                            <TableCell className="text-muted-foreground">{med.dosage_form || 'Tablet'}</TableCell>
                            <TableCell className="font-semibold">{med.stock_quantity || med.quantity_in_stock || 0}</TableCell>
                            <TableCell>{med.reorder_level}</TableCell>
                            <TableCell className="font-medium">TSh{Number(med.unit_price).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={isLowStock ? 'destructive' : 'default'}>
                                {isLowStock ? 'Low Stock' : 'In Stock'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => openEditDialog(med)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" onClick={() => openStockDialog(med)}>
                                  Update Stock
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>

              {/* Import Medications Dialog */}
              <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Bulk Import Medications</DialogTitle>
                    <DialogDescription>
                      Upload a CSV file to import multiple medications at once
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* CSV Format Instructions */}
                    <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
                      <h4 className="font-semibold text-sm">CSV Format Required:</h4>
                      <div className="space-y-2 text-sm">
                        <p className="font-mono text-xs bg-background p-2 rounded border">
                          name,generic_name,strength,dosage_form,manufacturer,quantity_in_stock,reorder_level,unit_price,expiry_date
                        </p>
                        <div className="space-y-1 text-muted-foreground">
                          <p><strong>name:</strong> Brand/Trade name (e.g., Panadol, Amoxil)</p>
                          <p><strong>generic_name:</strong> Generic name (e.g., Paracetamol, Amoxicillin)</p>
                          <p><strong>strength:</strong> Dosage strength (e.g., 500mg, 250mg/5ml)</p>
                          <p><strong>dosage_form:</strong> Tablet, Capsule, Syrup, Injection, etc.</p>
                          <p><strong>manufacturer:</strong> Manufacturer name</p>
                          <p><strong>quantity_in_stock:</strong> Current stock quantity (number)</p>
                          <p><strong>reorder_level:</strong> Minimum stock level before reorder (number)</p>
                          <p><strong>unit_price:</strong> Price per unit in TSh (number)</p>
                          <p><strong>expiry_date:</strong> Expiry date in YYYY-MM-DD format</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold text-sm">Example rows:</p>
                        <div className="font-mono text-xs bg-background p-2 rounded border space-y-1">
                          <p>Panadol,Paracetamol,500mg,Tablet,GSK,1000,100,500,2025-12-31</p>
                          <p>Amoxil,Amoxicillin,250mg,Capsule,GSK,500,50,1500,2025-06-30</p>
                          <p>Brufen,Ibuprofen,400mg,Tablet,Abbott,800,80,800,2025-09-15</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="csvFile">Select CSV File</Label>
                      <Input
                        id="csvFile"
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        disabled={importLoading}
                      />
                    </div>

                    {importPreview.length > 0 && (
                      <div className="space-y-2">
                        <Label>Preview ({importPreview.length} medications)</Label>
                        <div className="border rounded-lg max-h-60 overflow-y-auto">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Strength</TableHead>
                                  <TableHead>Stock</TableHead>
                                  <TableHead>Price</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {importPreview.slice(0, 10).map((med, index) => (
                                  <TableRow key={med.name + med.strength || index}>
                                    <TableCell className="font-medium">{med.name}</TableCell>
                                    <TableCell>{med.strength}</TableCell>
                                    <TableCell>{med.stock_quantity || med.quantity_in_stock || 0}</TableCell>
                                    <TableCell>TSh{Number(med.unit_price).toFixed(2)}</TableCell>
                                    <TableCell>
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    </TableCell>
                                  </TableRow>
                                ))}
                                {importPreview.length > 10 && (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                      ... and {importPreview.length - 10} more medications
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setImportDialogOpen(false);
                          setImportFile(null);
                          setImportPreview([]);
                        }}
                        disabled={importLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleBulkImport}
                        disabled={importPreview.length === 0 || importLoading}
                      >
                        {importLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Import {importPreview.length} Medications
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Add/Edit Medication Dialog */}
              <Dialog open={medicationDialogOpen} onOpenChange={(open) => {
                setMedicationDialogOpen(open);
                if (!open) setEditingMedication(null);
              }}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingMedication ? 'Edit' : 'Add'} Medication</DialogTitle>
                    <DialogDescription>
                      {editingMedication ? 'Update' : 'Enter'} medication details
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveMedication} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Medication Name *</Label>
                        <Input id="name" name="name" defaultValue={editingMedication?.name} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="genericName">Generic Name</Label>
                        <Input id="genericName" name="genericName" defaultValue={editingMedication?.generic_name} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="strength">Strength *</Label>
                        <Input id="strength" name="strength" placeholder="e.g., 500mg" defaultValue={editingMedication?.strength} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dosageForm">Dosage Form *</Label>
                        <Select name="dosageForm" defaultValue={editingMedication?.dosage_form || "Tablet"}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tablet">Tablet</SelectItem>
                            <SelectItem value="Capsule">Capsule</SelectItem>
                            <SelectItem value="Syrup">Syrup</SelectItem>
                            <SelectItem value="Injection">Injection</SelectItem>
                            <SelectItem value="Cream">Cream</SelectItem>
                            <SelectItem value="Drops">Drops</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manufacturer">Manufacturer</Label>
                      <Input id="manufacturer" name="manufacturer" defaultValue={editingMedication?.manufacturer} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity in Stock *</Label>
                        <Input id="quantity" name="quantity" type="number" defaultValue={editingMedication?.quantity_in_stock} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reorderLevel">Reorder Level *</Label>
                        <Input id="reorderLevel" name="reorderLevel" type="number" defaultValue={editingMedication?.reorder_level || 10} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unitPrice">Unit Price *</Label>
                        <Input id="unitPrice" name="unitPrice" type="number" step="0.01" defaultValue={editingMedication?.unit_price} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input id="expiryDate" name="expiryDate" type="date" defaultValue={editingMedication?.expiry_date} />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingMedication ? 'Update' : 'Add'} Medication
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Update Stock Dialog */}
              <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Stock</DialogTitle>
                    <DialogDescription>
                      Update stock quantity for {selectedMedication?.name}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateStock} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentStock">Current Stock</Label>
                      <Input
                        id="currentStock"
                        value={selectedMedication?.stock_quantity || selectedMedication?.quantity_in_stock || 0}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">New Stock Quantity *</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        defaultValue={selectedMedication?.stock_quantity || selectedMedication?.quantity_in_stock || 0}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">Update Stock</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dispense Dialog */}
        {selectedPrescriptionForDispense && (
          <DispenseDialog
            open={dispenseDialogOpen}
            onOpenChange={setDispenseDialogOpen}
            prescription={selectedPrescriptionForDispense}
            medications={medications}
            onDispense={handleDispenseWithDetails}
            loading={loadingStates[selectedPrescriptionForDispense.id]}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
