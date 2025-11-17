import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, Printer, Calendar as CalendarIcon, Loader2, FileText, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  blood_group?: string;
  created_at: string;
};

type PatientHistory = {
  appointments: any[];
  prescriptions: any[];
  labTests: any[];
  invoices: any[];
  totalSpent: number;
};

export default function PatientReports() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [patientHistory, setPatientHistory] = useState<PatientHistory | null>(null);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (patientHistory) {
      console.log('🖨️ PRINT VIEW DATA UPDATED:', {
        prescriptions: patientHistory.prescriptions?.length || 0,
        labTests: patientHistory.labTests?.length || 0,
        prescriptionsData: patientHistory.prescriptions,
        labTestsData: patientHistory.labTests
      });
    }
  }, [patientHistory]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/patients', { params: { limit: 1000 } });
      setPatients(data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientHistory = async (patientId: string) => {
    setLoadingHistory(true);
    try {
      const params: any = {};
      if (dateRange.from) params.from = dateRange.from.toISOString();
      if (dateRange.to) params.to = dateRange.to.toISOString();

      // Fetch all patient data
      const [appointmentsRes, prescriptionsRes, labTestsRes, invoicesRes] = await Promise.all([
        api.get(`/appointments`, { params: { ...params, patient_id: patientId } }).catch((err) => {
          console.error('Appointments fetch error:', err);
          return { data: { appointments: [] } };
        }),
        api.get(`/prescriptions`, { params: { ...params, patient_id: patientId } }).catch((err) => {
          console.error('Prescriptions fetch error:', err);
          return { data: { prescriptions: [] } };
        }),
        api.get(`/labs`, { params: { ...params, patient_id: patientId } }).catch((err) => {
          console.error('Lab tests fetch error:', err);
          return { data: { labTests: [] } };
        }),
        api.get(`/billing/invoices`, { params: { ...params, patient_id: patientId } }).catch((err) => {
          console.error('Invoices fetch error:', err);
          return { data: { invoices: [] } };
        })
      ]);

      const invoices = invoicesRes.data.invoices || [];
      const totalSpent = invoices
        .filter((inv: any) => inv.status === 'Paid')
        .reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0);

      // Debug logging
      console.log('=== PATIENT HISTORY DEBUG ===');
      console.log('Appointments Response:', appointmentsRes.data);
      console.log('Prescriptions Response:', prescriptionsRes.data);
      console.log('Lab Tests Response:', labTestsRes.data);
      console.log('Invoices Response:', invoicesRes.data);
      
      const appointments = appointmentsRes.data.appointments || [];
      const prescriptions = prescriptionsRes.data.prescriptions || [];
      const labTests = labTestsRes.data.labTests || [];
      
      console.log('Processed Data:', {
        appointments: appointments.length,
        prescriptions: prescriptions.length,
        prescriptionsWithMeds: prescriptions.filter(p => p.medications?.length > 0).length,
        totalMedications: prescriptions.reduce((sum, rx) => sum + (rx.medications?.length || 0), 0),
        labTests: labTests.length,
        invoices: invoices.length,
        totalSpent
      });
      
      // Log detailed prescription data
      if (prescriptions.length > 0) {
        console.log('📋 Prescription Details:');
        prescriptions.forEach((rx, i) => {
          console.log(`  Prescription ${i + 1}:`, {
            id: rx.id,
            date: rx.prescription_date,
            doctor: rx.doctor?.full_name,
            status: rx.status,
            medicationsCount: rx.medications?.length || 0,
            medications: rx.medications
          });
        });
      }
      
      // Log detailed lab test data
      if (labTests.length > 0) {
        console.log('🔬 Lab Test Details:');
        labTests.forEach((test, i) => {
          console.log(`  Lab Test ${i + 1}:`, {
            id: test.id,
            name: test.test_name,
            type: test.test_type,
            result: test.result_value,
            status: test.status
          });
        });
      }

      setPatientHistory({
        appointments,
        prescriptions,
        labTests,
        invoices,
        totalSpent
      });
    } catch (error) {
      console.error('Error fetching patient history:', error);
      toast.error('Failed to load patient history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    fetchPatientHistory(patient.id);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredPatients = patients.filter(p => {
    const fullName = p.full_name || `${p.first_name} ${p.last_name}`;
    return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           p.phone.includes(searchTerm);
  });

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <>
      {selectedPatient && patientHistory && (
        <style data-print-style="patient-report">{`
          @media print {
            /* When patient report exists, hide everything else */
            body * { 
              visibility: hidden;
            }
            
            /* FORCE HIDE admin reports specifically */
            .hidden.print\\:block,
            .hidden.print\\:block *,
            .print-report,
            .print-report * {
              visibility: hidden !important;
              display: none !important;
              position: absolute !important;
              left: -99999px !important;
            }
            
            /* Show ONLY patient report */
            #patient-report-print {
              visibility: visible !important;
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
            }
            
            #patient-report-print * { 
              visibility: visible !important;
              height: auto !important;
              overflow: visible !important;
            }
          
          /* Ensure proper display for elements */
          #patient-report-print div {
            display: block !important;
          }
          
          #patient-report-print span,
          #patient-report-print strong,
          #patient-report-print em {
            display: inline !important;
          }
          
          #patient-report-print table {
            display: table !important;
          }
          
          #patient-report-print thead {
            display: table-header-group !important;
          }
          
          #patient-report-print tbody {
            display: table-row-group !important;
          }
          
          #patient-report-print tr {
            display: table-row !important;
          }
          
          #patient-report-print td,
          #patient-report-print th {
            display: table-cell !important;
          }
          
          #patient-report-print p,
          #patient-report-print h1,
          #patient-report-print h2,
          #patient-report-print h3 {
            display: block !important;
          }
          
          /* Support flex layouts */
          #patient-report-print div[style*="display: flex"],
          #patient-report-print div[style*="display:flex"] {
            display: flex !important;
          }
          
          /* Page settings */
          @page {
            margin: 1cm;
            size: A4;
          }
          
          /* Position and style patient report */
          #patient-report-print { 
            display: block !important;
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important;
            max-width: 210mm !important;
            padding: 0 !important;
            margin: 0 !important;
            font-family: Arial, sans-serif !important;
            font-size: 12pt !important;
            line-height: 1.4 !important;
            color: #000 !important;
          }
          
          /* Headers */
          #patient-report-print h1 {
            font-size: 20pt !important;
            font-weight: bold !important;
            margin: 0 0 10px 0 !important;
            color: #000 !important;
          }
          
          #patient-report-print h2 {
            font-size: 14pt !important;
            font-weight: bold !important;
            margin: 20px 0 10px 0 !important;
            padding-bottom: 5px !important;
            border-bottom: 1px solid #333 !important;
            color: #000 !important;
          }
          
          /* Paragraphs */
          #patient-report-print p {
            margin: 5px 0 !important;
            line-height: 1.4 !important;
          }
          
          /* Tables */
          #patient-report-print table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 10px 0 !important;
            page-break-inside: avoid !important;
          }
          
          #patient-report-print th {
            background-color: #f0f0f0 !important;
            font-weight: bold !important;
            text-align: left !important;
            padding: 8px !important;
            border: 1px solid #999 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          #patient-report-print td {
            padding: 6px 8px !important;
            border: 1px solid #ccc !important;
            vertical-align: top !important;
          }
          
          #patient-report-print tbody tr:nth-child(even) {
            background-color: #fafafa !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Divs and sections */
          #patient-report-print > div {
            page-break-inside: avoid !important;
          }
          
          /* Summary boxes */
          #patient-report-print div[style*="border: 1px solid"] {
            border: 1px solid #999 !important;
            padding: 10px !important;
            margin: 5px !important;
            background-color: #f9f9f9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Prescription boxes */
          #patient-report-print div[style*="backgroundColor: '#f9f9f9'"] {
            background-color: #f0f0f0 !important;
            padding: 10px !important;
            margin-bottom: 10px !important;
            border-radius: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Status badges */
          #patient-report-print span[style*="padding: '2px 6px'"] {
            padding: 2px 6px !important;
            border: 1px solid #999 !important;
            border-radius: 3px !important;
            font-size: 10pt !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Footer */
          #patient-report-print div[style*="borderTop: '1px solid #ddd'"] {
            margin-top: 30px !important;
            padding-top: 15px !important;
            border-top: 1px solid #999 !important;
            font-size: 9pt !important;
            color: #666 !important;
            text-align: center !important;
          }
          
          /* Avoid page breaks */
          #patient-report-print h2,
          #patient-report-print table {
            page-break-after: avoid !important;
          }
          
          #patient-report-print tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
      )}

      <Card className="no-print">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Patient Reports
              </CardTitle>
              <CardDescription>Search and print patient medical history reports</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient Search */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Search Patient</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Patient List */}
            {searchTerm && (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No patients found
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredPatients.slice(0, 10).map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                      >
                        <div className="font-medium">
                          {patient.full_name || `${patient.first_name} ${patient.last_name}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {patient.phone} • {patient.gender} • {calculateAge(patient.date_of_birth)} years
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Patient & Date Filter */}
          {selectedPatient && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedPatient.full_name || `${selectedPatient.first_name} ${selectedPatient.last_name}`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Patient ID: {selectedPatient.id}
                  </p>
                </div>
                <Button onClick={handlePrint} className="gap-2">
                  <Printer className="h-4 w-4" />
                  Print Report
                </Button>
              </div>

              {/* Date Range Filter */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>From Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => {
                          setDateRange(prev => ({ ...prev, from: date }));
                          if (selectedPatient) fetchPatientHistory(selectedPatient.id);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1">
                  <Label>To Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => {
                          setDateRange(prev => ({ ...prev, to: date }));
                          if (selectedPatient) fetchPatientHistory(selectedPatient.id);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Patient History Summary */}
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : patientHistory ? (
                <>
                  {console.log('📊 Rendering summary cards with:', {
                    appointments: patientHistory.appointments?.length || 0,
                    prescriptions: patientHistory.prescriptions?.length || 0,
                    medications: patientHistory.prescriptions?.reduce((sum, rx) => sum + (rx.medications?.length || 0), 0) || 0,
                    labTests: patientHistory.labTests?.length || 0
                  })}
                  <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{patientHistory.appointments?.length || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{patientHistory.prescriptions?.length || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Medications</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {patientHistory.prescriptions?.reduce((sum, rx) => 
                            sum + (rx.medications?.length || 0), 0
                          ) || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Lab Tests</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{patientHistory.labTests?.length || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">TSh {(patientHistory.totalSpent || 0).toLocaleString()}</div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print View */}
      {selectedPatient && patientHistory && (
        <div id="patient-report-print" style={{ display: 'none' }}>
          <div style={{ fontFamily: 'Arial, sans-serif', padding: '30px 40px', lineHeight: '1.6' }}>
            {/* Header with Logo */}
            <div style={{ marginBottom: '40px', borderBottom: '3px solid #2563eb', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                {/* Logo placeholder */}
                <div style={{ width: '80px', height: '80px', backgroundColor: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>H</span>
                </div>
                
                {/* Hospital Info */}
                <div style={{ flex: 1, textAlign: 'center', paddingLeft: '20px' }}>
                  <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', color: '#1e40af', fontWeight: 'bold', letterSpacing: '1.5px' }}>HASET MEDICAL CENTER</h1>
                  <p style={{ margin: '0', fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                    Excellence in Healthcare | Comprehensive Medical Services
                  </p>
                </div>
                
                {/* Report ID */}
                <div style={{ width: '80px', textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>Report ID</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af', fontFamily: 'monospace' }}>
                    {selectedPatient.id.substring(0, 8).toUpperCase()}
                  </div>
                </div>
              </div>
              
              <div style={{ textAlign: 'center', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#374151', fontWeight: '600' }}>PATIENT MEDICAL HISTORY REPORT</p>
                <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
                  Generated on {format(new Date(), 'PPP')} at {format(new Date(), 'p')}
                </p>
              </div>
            </div>

            {/* Patient Demographics */}
            <div style={{ marginBottom: '35px', backgroundColor: '#f8fafc', padding: '25px 30px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '18px', color: '#1e40af', fontWeight: 'bold', marginBottom: '20px', marginTop: '0' }}>
                PATIENT INFORMATION
              </h2>
              <table style={{ width: '100%', fontSize: '14px', lineHeight: '2' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: '600', width: '35%', color: '#475569' }}>Name:</td>
                    <td style={{ padding: '8px 0', color: '#1e293b', fontSize: '15px' }}>
                      {selectedPatient.full_name || `${selectedPatient.first_name} ${selectedPatient.last_name}`}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: '600', color: '#475569' }}>Patient ID:</td>
                    <td style={{ padding: '8px 0', color: '#1e293b', fontFamily: 'monospace', fontSize: '13px' }}>{selectedPatient.id}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: '600', color: '#475569' }}>Date of Birth:</td>
                    <td style={{ padding: '8px 0', color: '#1e293b' }}>
                      {format(new Date(selectedPatient.date_of_birth), 'PPP')} ({calculateAge(selectedPatient.date_of_birth)} years old)
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: '600', color: '#475569' }}>Gender:</td>
                    <td style={{ padding: '8px 0', color: '#1e293b' }}>{selectedPatient.gender}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: '600', color: '#475569' }}>Phone:</td>
                    <td style={{ padding: '8px 0', color: '#1e293b' }}>{selectedPatient.phone}</td>
                  </tr>
                  {selectedPatient.email && (
                    <tr>
                      <td style={{ padding: '8px 0', fontWeight: '600', color: '#475569' }}>Email:</td>
                      <td style={{ padding: '8px 0', color: '#1e293b' }}>{selectedPatient.email}</td>
                    </tr>
                  )}
                  {selectedPatient.blood_group && (
                    <tr>
                      <td style={{ padding: '8px 0', fontWeight: '600', color: '#475569' }}>Blood Group:</td>
                      <td style={{ padding: '8px 0', color: '#dc2626', fontWeight: 'bold', fontSize: '16px' }}>{selectedPatient.blood_group}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Appointment History */}
            {patientHistory.appointments.length > 0 && (
              <div style={{ marginBottom: '35px', pageBreakInside: 'avoid' }}>
                <h2 style={{ fontSize: '18px', color: '#1e40af', fontWeight: 'bold', marginBottom: '18px', marginTop: '0', paddingBottom: '10px', borderBottom: '2px solid #3b82f6' }}>
                  APPOINTMENT HISTORY
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Date</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Time</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Doctor</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Reason</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientHistory.appointments.map((appointment: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {format(new Date(appointment.appointment_date), 'MMM dd, yyyy')}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{appointment.appointment_time || 'N/A'}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{appointment.doctor?.full_name || 'N/A'}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{appointment.reason || 'N/A'}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{appointment.status || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Prescriptions & Medications Provided */}
            <div style={{ marginBottom: '35px', pageBreakInside: 'avoid' }}>
              <h2 style={{ fontSize: '18px', color: '#1e40af', fontWeight: 'bold', marginBottom: '18px', marginTop: '0', paddingBottom: '10px', borderBottom: '2px solid #3b82f6' }}>
                PRESCRIPTIONS & MEDICATIONS PROVIDED
              </h2>
              {(() => {
                const hasData = patientHistory.prescriptions && patientHistory.prescriptions.length > 0;
                console.log('📋 Print: Prescriptions check:', {
                  exists: !!patientHistory.prescriptions,
                  length: patientHistory.prescriptions?.length,
                  hasData,
                  data: patientHistory.prescriptions
                });
                return null;
              })()}
              {patientHistory.prescriptions && patientHistory.prescriptions.length > 0 ? (
                <>
                  {patientHistory.prescriptions.map((rx: any, rxIdx: number) => (
                    <div key={rxIdx} style={{ marginBottom: '25px', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#eff6ff', padding: '15px 20px', borderBottom: '1px solid #bfdbfe' }}>
                      <strong style={{ color: '#1e40af' }}>📋 Prescription Date:</strong> <span style={{ color: '#1e293b' }}>{format(new Date(rx.prescription_date || rx.created_at), 'MMM dd, yyyy')}</span>
                      {rx.doctor?.full_name && (
                        <span style={{ marginLeft: '20px' }}>
                          <strong style={{ color: '#1e40af' }}>Doctor:</strong> <span style={{ color: '#1e293b' }}>{rx.doctor.full_name}</span>
                        </span>
                      )}
                      {rx.status && (
                        <span style={{ marginLeft: '20px' }}>
                          <strong style={{ color: '#1e40af' }}>Status:</strong> <span style={{ color: rx.status === 'Active' ? '#059669' : '#6b7280', fontWeight: '600' }}>{rx.status}</span>
                        </span>
                      )}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#dbeafe' }}>
                          <th style={{ border: '1px solid #93c5fd', padding: '12px 15px', textAlign: 'left', color: '#1e40af', fontWeight: '600' }}>Medication</th>
                          <th style={{ border: '1px solid #93c5fd', padding: '12px 15px', textAlign: 'left', color: '#1e40af', fontWeight: '600' }}>Dosage</th>
                          <th style={{ border: '1px solid #93c5fd', padding: '12px 15px', textAlign: 'left', color: '#1e40af', fontWeight: '600' }}>Frequency</th>
                          <th style={{ border: '1px solid #93c5fd', padding: '12px 15px', textAlign: 'left', color: '#1e40af', fontWeight: '600' }}>Duration</th>
                          <th style={{ border: '1px solid #93c5fd', padding: '12px 15px', textAlign: 'center', color: '#1e40af', fontWeight: '600' }}>Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(rx.medications || []).map((med: any, medIdx: number) => (
                          <tr key={medIdx} style={{ backgroundColor: medIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                            <td style={{ border: '1px solid #e2e8f0', padding: '12px 15px', color: '#1e293b', fontWeight: '500' }}>{med.medication_name || 'N/A'}</td>
                            <td style={{ border: '1px solid #e2e8f0', padding: '12px 15px', color: '#475569' }}>{med.dosage || 'N/A'}</td>
                            <td style={{ border: '1px solid #e2e8f0', padding: '12px 15px', color: '#475569' }}>{med.frequency || 'N/A'}</td>
                            <td style={{ border: '1px solid #e2e8f0', padding: '12px 15px', color: '#475569' }}>{med.duration || 'N/A'}</td>
                            <td style={{ border: '1px solid #e2e8f0', padding: '12px 15px', textAlign: 'center', color: '#1e293b', fontWeight: '600' }}>{med.quantity || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rx.instructions && (
                      <div style={{ fontSize: '13px', color: '#475569', backgroundColor: '#fef3c7', padding: '15px 20px', borderTop: '1px solid #fde047', lineHeight: '1.6' }}>
                        <strong style={{ color: '#92400e' }}>⚠️ Instructions:</strong> <span style={{ color: '#78350f' }}>{rx.instructions}</span>
                      </div>
                    )}
                  </div>
                  ))}
                </>
              ) : (
                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  No prescriptions found for this patient.
                </p>
              )}
            </div>

            {/* Lab Tests & Results */}
            <div style={{ marginBottom: '35px', pageBreakInside: 'avoid' }}>
              <h2 style={{ fontSize: '18px', color: '#1e40af', fontWeight: 'bold', marginBottom: '18px', marginTop: '0', paddingBottom: '10px', borderBottom: '2px solid #3b82f6' }}>
                LABORATORY TESTS & RESULTS
              </h2>
              {(() => {
                const hasData = patientHistory.labTests && patientHistory.labTests.length > 0;
                console.log('🔬 Print: Lab Tests check:', {
                  exists: !!patientHistory.labTests,
                  length: patientHistory.labTests?.length,
                  hasData,
                  data: patientHistory.labTests
                });
                return null;
              })()}
              {patientHistory.labTests && patientHistory.labTests.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Date Ordered</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Test Name</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Test Type</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Result</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientHistory.labTests.map((test: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {format(new Date(test.test_date || test.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{test.test_name || 'N/A'}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{test.test_type || 'N/A'}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {test.result_value || test.result || 'Pending'}
                          {test.result_unit && ` ${test.result_unit}`}
                          {test.reference_range && (
                            <div style={{ fontSize: '10px', color: '#666' }}>
                              Normal: {test.reference_range}
                            </div>
                          )}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                          <span style={{ 
                            padding: '2px 6px', 
                            borderRadius: '3px',
                            backgroundColor: test.status === 'Completed' ? '#d4edda' : 
                                           test.status === 'Pending' ? '#fff3cd' : '#f8d7da',
                            color: test.status === 'Completed' ? '#155724' : 
                                   test.status === 'Pending' ? '#856404' : '#721c24',
                            fontSize: '11px'
                          }}>
                            {test.status || 'N/A'}
                          </span>
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {test.completed_at ? format(new Date(test.completed_at), 'MMM dd, yyyy') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  No lab tests found for this patient.
                </p>
              )}
            </div>

            {/* Billing Summary */}
            {patientHistory.invoices.length > 0 && (
              <div style={{ marginBottom: '35px', pageBreakInside: 'avoid' }}>
                <h2 style={{ fontSize: '18px', color: '#1e40af', fontWeight: 'bold', marginBottom: '18px', marginTop: '0', paddingBottom: '10px', borderBottom: '2px solid #3b82f6' }}>
                  BILLING SUMMARY
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Invoice #</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Date</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Amount</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientHistory.invoices.map((invoice: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{invoice.invoice_number}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>
                          TSh {Number(invoice.total_amount).toLocaleString()}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{invoice.status}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                      <td colSpan={2} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>
                        Total Spent:
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>
                        TSh {patientHistory.totalSpent.toLocaleString()}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: '50px', paddingTop: '25px', borderTop: '2px solid #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '11px', color: '#64748b' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#475569' }}>HASET Medical Center</p>
                  <p style={{ margin: '0 0 2px 0' }}>📍 Dar es Salaam, Tanzania</p>
                  <p style={{ margin: '0 0 2px 0' }}>📞 +255 XXX XXX XXX</p>
                  <p style={{ margin: '0' }}>✉️ info@hasetmedical.com</p>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#475569' }}>Report Information</p>
                  <p style={{ margin: '0 0 2px 0' }}>Patient ID: {selectedPatient.id}</p>
                  <p style={{ margin: '0 0 2px 0' }}>Generated: {format(new Date(), 'PPP')}</p>
                  <p style={{ margin: '0' }}>Time: {format(new Date(), 'p')}</p>
                </div>
              </div>
              <div style={{ textAlign: 'center', paddingTop: '15px', borderTop: '1px solid #e2e8f0', fontSize: '10px', color: '#9ca3af' }}>
                <p style={{ margin: '0' }}>This is a confidential computer-generated medical report. Unauthorized disclosure is prohibited.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
