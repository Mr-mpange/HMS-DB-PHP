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
        api.get(`/appointments`, { params: { ...params, patient_id: patientId } }).catch(() => ({ data: { appointments: [] } })),
        api.get(`/prescriptions`, { params: { ...params, patient_id: patientId } }).catch(() => ({ data: { prescriptions: [] } })),
        api.get(`/lab-tests`, { params: { ...params, patient_id: patientId } }).catch(() => ({ data: { labTests: [] } })),
        api.get(`/billing/invoices`, { params: { ...params, patient_id: patientId } }).catch(() => ({ data: { invoices: [] } }))
      ]);

      const invoices = invoicesRes.data.invoices || [];
      const totalSpent = invoices
        .filter((inv: any) => inv.status === 'Paid')
        .reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0);

      setPatientHistory({
        appointments: appointmentsRes.data.appointments || [],
        prescriptions: prescriptionsRes.data.prescriptions || [],
        labTests: labTestsRes.data.labTests || [],
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
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #patient-report-print, #patient-report-print * { visibility: visible; }
          #patient-report-print { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            padding: 20px;
          }
          .no-print { display: none !important; }
        }
      `}</style>

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
              ) : patientHistory && (
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{patientHistory.appointments.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{patientHistory.prescriptions.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Lab Tests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{patientHistory.labTests.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">TSh {patientHistory.totalSpent.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print View */}
      {selectedPatient && patientHistory && (
        <div id="patient-report-print" style={{ display: 'none' }}>
          <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
              <h1 style={{ margin: '0', fontSize: '24px', color: '#333' }}>HASET MEDICAL CENTER</h1>
              <p style={{ margin: '5px 0', color: '#666' }}>Patient Medical History Report</p>
              <p style={{ margin: '5px 0', fontSize: '12px', color: '#999' }}>
                Generated on {format(new Date(), 'PPP')}
              </p>
            </div>

            {/* Patient Demographics */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '15px' }}>
                Patient Information
              </h2>
              <table style={{ width: '100%', fontSize: '14px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '5px', fontWeight: 'bold', width: '30%' }}>Name:</td>
                    <td style={{ padding: '5px' }}>
                      {selectedPatient.full_name || `${selectedPatient.first_name} ${selectedPatient.last_name}`}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px', fontWeight: 'bold' }}>Patient ID:</td>
                    <td style={{ padding: '5px' }}>{selectedPatient.id}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px', fontWeight: 'bold' }}>Date of Birth:</td>
                    <td style={{ padding: '5px' }}>
                      {format(new Date(selectedPatient.date_of_birth), 'PPP')} ({calculateAge(selectedPatient.date_of_birth)} years)
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px', fontWeight: 'bold' }}>Gender:</td>
                    <td style={{ padding: '5px' }}>{selectedPatient.gender}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px', fontWeight: 'bold' }}>Phone:</td>
                    <td style={{ padding: '5px' }}>{selectedPatient.phone}</td>
                  </tr>
                  {selectedPatient.email && (
                    <tr>
                      <td style={{ padding: '5px', fontWeight: 'bold' }}>Email:</td>
                      <td style={{ padding: '5px' }}>{selectedPatient.email}</td>
                    </tr>
                  )}
                  {selectedPatient.blood_group && (
                    <tr>
                      <td style={{ padding: '5px', fontWeight: 'bold' }}>Blood Group:</td>
                      <td style={{ padding: '5px' }}>{selectedPatient.blood_group}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Statistics */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '15px' }}>
                Summary
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
                <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Appointments</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{patientHistory.appointments.length}</div>
                </div>
                <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Prescriptions</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{patientHistory.prescriptions.length}</div>
                </div>
                <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Lab Tests</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{patientHistory.labTests.length}</div>
                </div>
                <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Spent</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>TSh {patientHistory.totalSpent.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Appointment History */}
            {patientHistory.appointments.length > 0 && (
              <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
                <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '15px' }}>
                  Appointment History
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

            {/* Prescriptions */}
            {patientHistory.prescriptions.length > 0 && (
              <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
                <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '15px' }}>
                  Prescriptions
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Date</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Medication</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Dosage</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientHistory.prescriptions.map((rx: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {format(new Date(rx.prescription_date || rx.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{rx.medication_name || 'N/A'}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{rx.dosage || 'N/A'}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{rx.duration || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Lab Tests */}
            {patientHistory.labTests.length > 0 && (
              <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
                <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '15px' }}>
                  Lab Tests & Results
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Date</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Test Name</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Result</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientHistory.labTests.map((test: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {format(new Date(test.test_date || test.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{test.test_name || 'N/A'}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{test.result || 'Pending'}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{test.status || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Billing Summary */}
            {patientHistory.invoices.length > 0 && (
              <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
                <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '15px' }}>
                  Billing Summary
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
            <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ddd', fontSize: '10px', color: '#999', textAlign: 'center' }}>
              <p>This is a computer-generated report. For any queries, please contact HASET Medical Center.</p>
              <p>Report generated on {format(new Date(), 'PPP p')}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
