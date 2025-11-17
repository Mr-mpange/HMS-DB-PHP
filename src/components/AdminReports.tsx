import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Printer, Download } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { PrintHeader } from '@/components/PrintHeader';

type DateFilter = 'today' | 'week' | 'month' | 'all';

export default function AdminReports() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [reportData, setReportData] = useState<any>({
    patients: [],
    appointments: [],
    visits: [],
    prescriptions: [],
    labTests: [],
    invoices: []
  });
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    totalVisits: 0,
    totalPrescriptions: 0,
    totalLabTests: 0,
    totalInvoices: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    hospitalName: 'Medical Center',
    reportHeader: 'Healthcare Management System Report',
    consultationFee: 2000,
    includePatientDetails: true,
    includeAppointments: true,
    includeVisits: true,
    includePrescriptions: true,
    includeLabTests: true,
    includeInvoices: true
  });

  useEffect(() => {
    fetchReportData();
    fetchSystemSettings();
  }, [dateFilter]);

  const fetchSystemSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      const settings = data.settings || [];

      if (settings.length > 0) {
        const settingsMap: Record<string, string> = {};
        settings.forEach((setting: any) => {
          settingsMap[setting.key] = setting.value;
        });

        setSettings(prev => ({
          ...prev,
          consultationFee: Number(settingsMap.consultation_fee || prev.consultationFee),
          hospitalName: settingsMap.hospital_name || prev.hospitalName,
          reportHeader: settingsMap.report_header || prev.reportHeader
        }));
      }
    } catch (error) {
      console.log('Using default settings');
    }
  };

  const getDateRange = () => {
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        return {
          start: startOfDay(now),
          end: endOfDay(now)
        };
      case 'week':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now)
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'all':
        return {
          start: new Date('2000-01-01'),
          end: now
        };
      default:
        return {
          start: startOfDay(now),
          end: endOfDay(now)
        };
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const startStr = start.toISOString();
      const endStr = end.toISOString();

      // Fetch all data from MySQL API with individual error handling
      const [patientsRes, appointmentsRes, visitsRes, prescriptionsRes, labTestsRes, invoicesRes] = await Promise.allSettled([
        api.get(`/patients?from=${startStr}&to=${endStr}`),
        api.get(`/appointments?from=${startStr}&to=${endStr}`),
        api.get(`/visits?from=${startStr}&to=${endStr}`),
        api.get(`/prescriptions?from=${startStr}&to=${endStr}`),
        api.get(`/lab-tests?from=${startStr}&to=${endStr}`),
        api.get(`/billing/invoices?from=${startStr}&to=${endStr}&limit=1000`)
      ]);

      const patientsData = patientsRes.status === 'fulfilled' ? (patientsRes.value.data.patients || []) : [];
      const appointmentsData = appointmentsRes.status === 'fulfilled' ? (appointmentsRes.value.data.appointments || []) : [];
      const visitsData = visitsRes.status === 'fulfilled' ? (visitsRes.value.data.visits || []) : [];
      const prescriptionsData = prescriptionsRes.status === 'fulfilled' ? (prescriptionsRes.value.data.prescriptions || []) : [];
      const labTestsData = labTestsRes.status === 'fulfilled' ? (labTestsRes.value.data.tests || []) : [];
      const invoicesData = invoicesRes.status === 'fulfilled' ? (invoicesRes.value.data.invoices || []) : [];

      console.log('Prescriptions Data:', prescriptionsData);
      console.log('Lab Tests Data:', labTestsData);
      console.log('Invoices Data:', invoicesData);

      // Calculate total revenue from invoices
      const totalRevenue = invoicesData.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount) || 0), 0);
      
      // Calculate total invoice amounts (same as revenue but kept separate for clarity)
      const totalInvoiceAmount = invoicesData.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount) || 0), 0);
      
      // Calculate total lab test count (keeping as count since lab tests don't have individual prices in the table)
      const totalLabTestCount = labTestsData.length;

      console.log('Total Prescriptions:', prescriptionsData.length);
      console.log('Total Revenue:', totalRevenue);
      console.log('Total Invoice Amount:', totalInvoiceAmount);
      console.log('Total Lab Tests:', totalLabTestCount);

      setReportData({
        patients: patientsData,
        appointments: appointmentsData,
        visits: visitsData,
        prescriptions: prescriptionsData,
        labTests: labTestsData,
        invoices: invoicesData
      });

      setStats({
        totalPatients: patientsData.length,
        totalAppointments: appointmentsData.length,
        totalVisits: visitsData.length,
        totalPrescriptions: prescriptionsData.length,
        totalLabTests: totalLabTestCount,
        totalInvoices: totalInvoiceAmount,
        totalRevenue: totalRevenue
      });

      // Log any failed requests
      if (patientsRes.status === 'rejected') console.warn('Failed to fetch patients:', patientsRes.reason);
      if (appointmentsRes.status === 'rejected') console.warn('Failed to fetch appointments:', appointmentsRes.reason);
      if (visitsRes.status === 'rejected') console.warn('Failed to fetch visits:', visitsRes.reason);
      if (prescriptionsRes.status === 'rejected') console.warn('Failed to fetch prescriptions:', prescriptionsRes.reason);
      if (labTestsRes.status === 'rejected') console.warn('Failed to fetch lab tests:', labTestsRes.reason);
      if (invoicesRes.status === 'rejected') console.warn('Failed to fetch invoices:', invoicesRes.reason);

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${dateFilter}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const generateCSV = () => {
    let csv = `${settings.reportHeader}\n`;
    csv += `Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}\n`;
    csv += `Period: ${dateFilter.toUpperCase()}\n\n`;

    // Summary
    csv += 'SUMMARY\n';
    csv += `Total Patients,${stats.totalPatients}\n`;
    csv += `Total Appointments,${stats.totalAppointments}\n`;
    csv += `Total Visits,${stats.totalVisits}\n`;
    csv += `Total Prescriptions,${stats.totalPrescriptions}\n`;
    csv += `Total Lab Tests,${stats.totalLabTests}\n\n`;

    // Patients
    if (settings.includePatientDetails && reportData.patients.length > 0) {
      csv += 'PATIENTS\n';
      csv += 'Name,Phone,Gender,Blood Group,Date of Birth,Status\n';
      reportData.patients.forEach((p: any) => {
        csv += `${p.full_name},${p.phone},${p.gender},${p.blood_group || 'N/A'},${p.date_of_birth},${p.status}\n`;
      });
      csv += '\n';
    }

    // Appointments
    if (settings.includeAppointments && reportData.appointments.length > 0) {
      csv += 'APPOINTMENTS\n';
      csv += 'Patient,Doctor,Date,Time,Status,Reason\n';
      reportData.appointments.forEach((a: any) => {
        csv += `${a.patient?.full_name || 'N/A'},${a.doctor?.full_name || 'N/A'},${a.appointment_date},${a.appointment_time},${a.status},${a.reason || 'N/A'}\n`;
      });
      csv += '\n';
    }

    return csv;
  };

  const getFilterLabel = () => {
    switch (dateFilter) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'all': return 'All Time';
      default: return 'Today';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-20 bg-gray-200 animate-pulse rounded-lg"></div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 print:space-y-4">
      {/* Header - Hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold">Admin Reports</h2>
          <p className="text-muted-foreground">Generate and export system reports</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateFilter} onValueChange={(value: DateFilter) => setDateFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Print Header - Only visible on print */}
      <PrintHeader
        title={settings.reportHeader}
        hospitalName={settings.hospitalName}
        showDate={true}
        additionalInfo={`Period: ${getFilterLabel()}`}
      />

      {/* Stats Cards - Hidden on print */}
      <div className="grid gap-4 md:grid-cols-5 print:hidden">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrescriptions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lab Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLabTests}</div>
          </CardContent>
        </Card>
      </div>

      {/* Print-Only Professional Summary */}
      <div className="hidden print:block print:mt-8">
        <div className="p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 pb-4 border-b-2 border-gray-800">
            SUMMARY REPORT
          </h2>
          
          <div className="space-y-8">
            {/* Patient Statistics */}
            <div>
              <h3 className="text-lg font-bold mb-3 text-gray-800">PATIENT STATISTICS</h3>
              <div className="space-y-2 ml-4">
                <div className="flex justify-between py-1">
                  <span>Total Patients:</span>
                  <span className="font-bold">{stats.totalPatients}</span>
                </div>
              </div>
            </div>

            {/* Appointment Statistics */}
            <div>
              <h3 className="text-lg font-bold mb-3 text-gray-800">APPOINTMENT STATISTICS</h3>
              <div className="space-y-2 ml-4">
                <div className="flex justify-between py-1">
                  <span>Total Appointments:</span>
                  <span className="font-bold">{stats.totalAppointments}</span>
                </div>
              </div>
            </div>

            {/* Visit Statistics */}
            <div>
              <h3 className="text-lg font-bold mb-3 text-gray-800">VISIT STATISTICS</h3>
              <div className="space-y-2 ml-4">
                <div className="flex justify-between py-1">
                  <span>Total Visits:</span>
                  <span className="font-bold">{stats.totalVisits}</span>
                </div>
              </div>
            </div>

            {/* Prescription Statistics */}
            <div>
              <h3 className="text-lg font-bold mb-3 text-gray-800">PRESCRIPTION STATISTICS</h3>
              <div className="space-y-2 ml-4">
                <div className="flex justify-between py-1">
                  <span>Total Prescriptions:</span>
                  <span className="font-bold">{stats.totalPrescriptions}</span>
                </div>
              </div>
            </div>

            {/* Lab Test Statistics */}
            <div>
              <h3 className="text-lg font-bold mb-3 text-gray-800">LAB TEST STATISTICS</h3>
              <div className="space-y-2 ml-4">
                <div className="flex justify-between py-1">
                  <span>Total Lab Tests:</span>
                  <span className="font-bold">{stats.totalLabTests}</span>
                </div>
              </div>
            </div>

            {/* Billing Statistics */}
            {reportData.invoices.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3 text-gray-800">BILLING STATISTICS</h3>
                <div className="space-y-2 ml-4">
                  <div className="flex justify-between py-1">
                    <span>Total Invoices:</span>
                    <span className="font-bold">{reportData.invoices.length}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Paid Invoices:</span>
                    <span className="font-bold">
                      {reportData.invoices.filter((inv: any) => inv.status === 'Paid').length}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Pending Invoices:</span>
                    <span className="font-bold">
                      {reportData.invoices.filter((inv: any) => inv.status !== 'Paid').length}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 mt-4 pt-4 border-t border-gray-300">
                    <span className="font-semibold">Total Revenue:</span>
                    <span className="font-bold text-lg">
                      TSh {reportData.invoices
                        .filter((inv: any) => inv.status === 'Paid')
                        .reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Outstanding Amount:</span>
                    <span className="font-bold">
                      TSh {reportData.invoices
                        .filter((inv: any) => inv.status !== 'Paid')
                        .reduce((sum: number, inv: any) => sum + (Number(inv.total_amount || 0) - Number(inv.paid_amount || 0)), 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-12 pt-6 border-t-2 border-gray-800 text-center text-sm text-gray-600">
            Generated by Hospital Management System
          </div>
        </div>
      </div>

      {/* Patients Table - Hidden on print */}
      {settings.includePatientDetails && reportData.patients.length > 0 && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Patients ({stats.totalPatients})</CardTitle>
            <CardDescription>Patient registrations for {getFilterLabel().toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Blood Group</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.patients.map((patient: any) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.full_name}</TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>{patient.gender}</TableCell>
                    <TableCell>{patient.blood_group || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(patient.date_of_birth), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant={patient.status === 'Active' ? 'default' : 'secondary'}>
                        {patient.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Appointments Table - Hidden on print */}
      {settings.includeAppointments && reportData.appointments.length > 0 && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Appointments ({stats.totalAppointments})</CardTitle>
            <CardDescription>Scheduled appointments for {getFilterLabel().toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.appointments.map((appointment: any) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{appointment.patient?.full_name || 'N/A'}</TableCell>
                    <TableCell>{appointment.doctor?.full_name || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(appointment.appointment_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{appointment.appointment_time}</TableCell>
                    <TableCell>
                      <Badge variant={
                        appointment.status === 'Completed' ? 'default' :
                        appointment.status === 'Scheduled' ? 'secondary' :
                        'outline'
                      }>
                        {appointment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{appointment.reason || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Visits Table - Hidden on print */}
      {settings.includeVisits && reportData.visits.length > 0 && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Patient Visits ({stats.totalVisits})</CardTitle>
            <CardDescription>Patient visits for {getFilterLabel().toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Visit Date</TableHead>
                  <TableHead>Current Stage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.visits.map((visit: any) => (
                  <TableRow key={visit.id}>
                    <TableCell>{visit.patient?.full_name || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(visit.visit_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="capitalize">{visit.current_stage}</TableCell>
                    <TableCell>
                      <Badge variant={visit.overall_status === 'Active' ? 'default' : 'secondary'}>
                        {visit.overall_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Lab Tests Table - Hidden on print */}
      {settings.includeLabTests && reportData.labTests.length > 0 && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Lab Tests ({stats.totalLabTests})</CardTitle>
            <CardDescription>Laboratory tests for {getFilterLabel().toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Ordered Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.labTests.map((test: any) => (
                  <TableRow key={test.id}>
                    <TableCell>{test.patient?.full_name || 'N/A'}</TableCell>
                    <TableCell>{test.test_name}</TableCell>
                    <TableCell>{test.test_type}</TableCell>
                    <TableCell>
                      <Badge variant={
                        test.priority === 'STAT' ? 'destructive' :
                        test.priority === 'Urgent' ? 'default' :
                        'secondary'
                      }>
                        {test.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(test.ordered_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant={test.status === 'Completed' ? 'default' : 'secondary'}>
                        {test.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Billing/Invoices Table - Hidden on print */}
      {settings.includeInvoices && reportData.invoices.length > 0 && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Billing & Invoices ({reportData.invoices.length})</CardTitle>
            <CardDescription>Financial transactions for {getFilterLabel().toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.invoices.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.patient?.full_name || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(invoice.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-semibold">TSh {Number(invoice.total_amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={
                        invoice.payment_status === 'Paid' ? 'default' :
                        invoice.payment_status === 'Pending' ? 'secondary' :
                        'destructive'
                      }>
                        {invoice.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{invoice.payment_method || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">TSh {stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print Styles - Only print report content */}
      <style>{`
        @media print {
          @page {
            margin: 1cm;
          }
          
          /* Hide everything by default */
          body * {
            visibility: hidden;
          }
          
          /* Only show the report container and its children */
          .space-y-8, .space-y-8 * {
            visibility: visible;
          }
          
          /* Make sure print header is visible */
          .print-header, .print-header * {
            visibility: visible !important;
          }
          
          /* Position the report at top of page */
          .space-y-8 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          /* Hide sidebar, navbar, and other dashboard elements */
          nav, aside, header, footer {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
