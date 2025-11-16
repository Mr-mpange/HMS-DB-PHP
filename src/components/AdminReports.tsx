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
    labTests: []
  });
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    totalVisits: 0,
    totalPrescriptions: 0,
    totalLabTests: 0
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
    includeLabTests: true
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
      const [patientsRes, appointmentsRes, visitsRes, prescriptionsRes, labTestsRes] = await Promise.allSettled([
        api.get(`/patients?from=${startStr}&to=${endStr}`),
        api.get(`/appointments?from=${startStr}&to=${endStr}`),
        api.get(`/visits?from=${startStr}&to=${endStr}`),
        api.get(`/prescriptions?from=${startStr}&to=${endStr}`),
        api.get(`/lab-tests?from=${startStr}&to=${endStr}`)
      ]);

      const patientsData = patientsRes.status === 'fulfilled' ? (patientsRes.value.data.patients || []) : [];
      const appointmentsData = appointmentsRes.status === 'fulfilled' ? (appointmentsRes.value.data.appointments || []) : [];
      const visitsData = visitsRes.status === 'fulfilled' ? (visitsRes.value.data.visits || []) : [];
      const prescriptionsData = prescriptionsRes.status === 'fulfilled' ? (prescriptionsRes.value.data.prescriptions || []) : [];
      const labTestsData = labTestsRes.status === 'fulfilled' ? (labTestsRes.value.data.tests || []) : [];

      setReportData({
        patients: patientsData,
        appointments: appointmentsData,
        visits: visitsData,
        prescriptions: prescriptionsData,
        labTests: labTestsData
      });

      setStats({
        totalPatients: patientsData.length,
        totalAppointments: appointmentsData.length,
        totalVisits: visitsData.length,
        totalPrescriptions: prescriptionsData.length,
        totalLabTests: labTestsData.length
      });

      // Log any failed requests
      if (patientsRes.status === 'rejected') console.warn('Failed to fetch patients:', patientsRes.reason);
      if (appointmentsRes.status === 'rejected') console.warn('Failed to fetch appointments:', appointmentsRes.reason);
      if (visitsRes.status === 'rejected') console.warn('Failed to fetch visits:', visitsRes.reason);
      if (prescriptionsRes.status === 'rejected') console.warn('Failed to fetch prescriptions:', prescriptionsRes.reason);
      if (labTestsRes.status === 'rejected') console.warn('Failed to fetch lab tests:', labTestsRes.reason);

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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5 print:grid-cols-5">
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

      {/* Patients Table */}
      {settings.includePatientDetails && reportData.patients.length > 0 && (
        <Card>
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

      {/* Appointments Table */}
      {settings.includeAppointments && reportData.appointments.length > 0 && (
        <Card className="print:break-inside-avoid">
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

      {/* Visits Table */}
      {settings.includeVisits && reportData.visits.length > 0 && (
        <Card className="print:break-inside-avoid">
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

      {/* Lab Tests Table */}
      {settings.includeLabTests && reportData.labTests.length > 0 && (
        <Card className="print:break-inside-avoid">
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

      {/* Print Styles - Component specific */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .space-y-8, .space-y-8 * {
            visibility: visible;
          }
          
          .print-header, .print-header * {
            visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
