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
import Logo from '@/components/Logo';


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



      {/* Professional Print Report - Only visible on print */}
      <div className="hidden print:block" style={{ padding: '20px', fontFamily: 'monospace' }}>
        {/* Header with Logo */}
        <div style={{ textAlign: 'center', borderTop: '3px double #000', borderBottom: '3px double #000', padding: '20px 0', marginBottom: '30px' }}>
          {/* Logo - Centered */}
          <div style={{ width: '120px', height: '120px', margin: '0 auto 15px auto' }}>
            <Logo size="xl" showText={false} />
          </div>
          
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0', letterSpacing: '3px', color: '#1A5A42' }}>
            HASET
          </h1>
          <h2 style={{ fontSize: '18px', margin: '5px 0', fontWeight: '600', color: '#2D7A5F' }}>
            Hospital Management System
          </h2>
          <h3 style={{ fontSize: '16px', margin: '5px 0', fontWeight: 'normal', color: '#666' }}>
            Healthcare Management System Report
          </h3>
          
          <div style={{ marginTop: '15px', fontSize: '14px', color: '#333' }}>
            <p style={{ margin: '5px 0' }}>
              <strong>Generated:</strong> {format(new Date(), 'MMMM dd, yyyy - HH:mm')}
            </p>
            <p style={{ margin: '5px 0' }}>
              <strong>Period:</strong> {getFilterLabel()}
            </p>
          </div>
        </div>

        {/* Summary Report */}
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '30px' }}>
          SUMMARY REPORT
        </h3>

        <div style={{ lineHeight: '1.8', maxWidth: '700px', margin: '0 auto' }}>
          {/* Patient Statistics */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>PATIENT STATISTICS</h4>
            <div style={{ paddingLeft: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Patients:</span>
                <span style={{ fontWeight: 'bold', minWidth: '100px', textAlign: 'right' }}>{stats.totalPatients}</span>
              </div>
            </div>
          </div>

          {/* Appointment Statistics */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>APPOINTMENT STATISTICS</h4>
            <div style={{ paddingLeft: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Appointments:</span>
                <span style={{ fontWeight: 'bold', minWidth: '100px', textAlign: 'right' }}>{stats.totalAppointments}</span>
              </div>
            </div>
          </div>

          {/* Visit Statistics */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>VISIT STATISTICS</h4>
            <div style={{ paddingLeft: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Visits:</span>
                <span style={{ fontWeight: 'bold', minWidth: '100px', textAlign: 'right' }}>{stats.totalVisits}</span>
              </div>
            </div>
          </div>

          {/* Prescription Statistics */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>PRESCRIPTION STATISTICS</h4>
            <div style={{ paddingLeft: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Prescriptions:</span>
                <span style={{ fontWeight: 'bold', minWidth: '100px', textAlign: 'right' }}>{stats.totalPrescriptions}</span>
              </div>
            </div>
          </div>

          {/* Lab Test Statistics */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>LAB TEST STATISTICS</h4>
            <div style={{ paddingLeft: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Lab Tests:</span>
                <span style={{ fontWeight: 'bold', minWidth: '100px', textAlign: 'right' }}>{stats.totalLabTests}</span>
              </div>
            </div>
          </div>

          {/* Billing Statistics */}
          {reportData.invoices.length > 0 && (
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>BILLING STATISTICS</h4>
              <div style={{ paddingLeft: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>Total Invoices:</span>
                  <span style={{ fontWeight: 'bold', minWidth: '150px', textAlign: 'right' }}>{reportData.invoices.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>Paid Invoices:</span>
                  <span style={{ fontWeight: 'bold', minWidth: '150px', textAlign: 'right' }}>
                    {reportData.invoices.filter((inv: any) => inv.status === 'Paid').length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span>Pending Invoices:</span>
                  <span style={{ fontWeight: 'bold', minWidth: '150px', textAlign: 'right' }}>
                    {reportData.invoices.filter((inv: any) => inv.status !== 'Paid').length}
                  </span>
                </div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 'bold' }}>Total Revenue:</span>
                    <span style={{ fontWeight: 'bold', minWidth: '150px', textAlign: 'right' }}>
                      TSh {reportData.invoices
                        .filter((inv: any) => inv.status === 'Paid')
                        .reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Outstanding Amount:</span>
                    <span style={{ fontWeight: 'bold', minWidth: '150px', textAlign: 'right' }}>
                      TSh {reportData.invoices
                        .filter((inv: any) => inv.status !== 'Paid')
                        .reduce((sum: number, inv: any) => sum + (Number(inv.total_amount || 0) - Number(inv.paid_amount || 0)), 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', borderTop: '3px double #000', borderBottom: '3px double #000', padding: '15px 0', marginTop: '50px' }}>
          <p style={{ margin: '5px 0', fontWeight: 'bold' }}>End of Report</p>
          <p style={{ margin: '5px 0', fontSize: '12px' }}>Generated by Hospital Management System</p>
        </div>
      </div>

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


      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide everything first */
          body * {
            visibility: hidden !important;
          }
          
          /* Show only the print report */
          .hidden.print\\:block,
          .hidden.print\\:block * {
            visibility: visible !important;
            display: block !important;
          }
          
          /* Position print report at top */
          .hidden.print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          /* Ensure tables are hidden */
          .print\\:hidden,
          .print\\:hidden * {
            display: none !important;
            visibility: hidden !important;
          }
          
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
