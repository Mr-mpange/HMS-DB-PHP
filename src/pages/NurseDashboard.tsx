import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ServiceFormDialog } from '@/components/ServiceFormDialog';
import api from '@/lib/api';
import { Calendar, Users, Activity, Heart, Thermometer, Loader2, Stethoscope, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from '

export default function NurseDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [vitalSigns, setVitalSigns] = useState<any[]>([]);
  const [labResultsReady, setLabResultsReady] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showVitalsDialog, setShowVitalsDialog] = useState(false);
  const [showLabResultsDialog, setShowLabResultsDialog] = useState(false);
  const [selectedVisitForResults, setSelectedVisitForResults] = useState<any>(null);
  const [labTestResults, setLabTestResults] = useState<any[]>([]);
  const [showOrderLabTestsDialog, setShowOrderLabTestsDialog] = useState(false);
  const [selectedPatientForLabTests, setSelectedPatientForLabTests] = useState<any>(null);
  const [availableLabTests, setAvailableLabTests] = useState<any[]>([]);
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);
  const [showServiceFormDialog, setShowServiceFormDialog] = useState(false);
  const [selectedVisitForForm, setSelectedVisitForForm] = useState<any>(null);
  const [serviceFormTemplate, setServiceFormTemplate] = useState<any>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [services, setServices] = useState<any
  const [showRegisterPatientDialog, setShowRegisterPatientDialog] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    full_name: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    address: ''
  });
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    blood_pressure: '',
    heart_rate: '',
    temperature: '',
    oxygen_saturation: '',
    weight: '',
    weight_unit: 'kg',
    height: '',
    height_unit: 'cm',
    muac: '',
    muac_unit: 'cm',
    notes: ''
  });
  const [notesForm, setNotesForm] = useState({
    patient_id: '',
    notes: '',
    category: 'general'
  });
  const [scheduleForm, setScheduleForm] = useState({
    patient_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
    department_id: ''
  });
  const [showServiceFormDialog, setShowServiceFormDialog] = useState(false);
  const [selectedVisitForForm, setSelectedVisitForForm] = useState<any>(null);
  const [serviceFormTemplate, setServiceFormTemplate] = useState<any>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingVitals: 0,
    completedTasks: 0
  });
  const [loading, setLoading] = useState(true); // Initial load only
  const [refreshing, setRefreshing] = useState(false); // Background refresh
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [pendingVisits, setPendingVisits] = useState<any[]>([]);

  // Handler functions
  const handleRecordVitals = (patient: any) => {
    setSelectedPatient(patient);
    setVitalsForm({
      blood_pressure: '',
      heart_rate: '',
      temperature: '',
      oxygen_saturation: '',
      weight: '',
      weight_unit: 'kg',
      height: '',
      height_unit: 'cm',
      muac: '',
      muac_unit: 'cm',
      notes: ''
    });
    setShowVitalsDialog(true);
  };

  const handleAddNotes = (patient: any) => {
    setSelectedPatient(patient);
    setNotesForm({
      patient_id: patient.id,
      notes: '',
      category: 'general'
    });
    setShowNotesDialog(true);
  };

  const handleScheduleFollowUp = (patient: any) => {
    setSelectedPatient(patient);
    setScheduleForm({
      patient_id: patient.id,
      appointment_date: '',
      appointment_time: '',
      reason: '',
      department_id: ''
    });
    setShowScheduleDialog(true);
  };

  const handleCompleteQuickService = async (visit: any) => {
    try {
      // Check if service requires a form
      if (!services.length) {
        // Fetch services if not loaded
        const servicesRes = await api.get('/services');
        setServices(servicesRes.data.services || []);
      }
      
      // Find the service from visit notes (extract service name)
      const serviceMatch = visit.notes?.match(/Quick Service: ([^-]+)/);
      const serviceName = serviceMatch ? serviceMatch[1].trim() : null;
      
      let service = null;
      if (serviceName) {
        service = services.find((s: any) => 
          serviceName.includes(s.service_name) || s.service_name.includes(serviceName)
        );
      }
      
      // Check if service requires form
      if (service && service.requires_form && service.form_template) {
        // Show form dialog
        setSelectedVisitForForm(visit);
        setServiceFormTemplate(service.form_template);
        setShowServiceFormDialog(true);
        return;
      }
      
      // No form required - direct discharge
      await dischargeQuickServicePatient(visit);
    } catch (error: any) {
      console.error('Error completing quick service:', error);
      toast.error(error.response?.data?.error || 'Failed to complete service');
    }
  };

  const dischargeQuickServicePatient = async (visit: any) => {
    try {
      await api.put(`/visits/${visit.id}`, {
        nurse_status: 'Completed',
        nurse_completed_at: new Date().toISOString(),
        current_stage: 'completed',
        overall_status: 'Completed',
        discharge_time: new Date().toISOString(),
        discharge_notes: `Quick Service completed: ${visit.notes || 'Service provided'}`
      });

      toast.success(`Service completed for ${visit.patient?.full_name}. Patient discharged.`);
      
      // Remove from pending visits
      setPendingVisits(prev => prev.filter(v => v.id !== visit.id));
      
      // Refresh data
      setTimeout(() => {
        fetchData(false);
      }, 1000);
    } catch (error: any) {
      console.error('Error discharging patient:', error);
      toast.error(error.response?.data?.error || 'Failed to discharge patient');
    }
  };

  const handleServiceFormSubmit = async (formData: any) => {
    setFormSubmitting(true);
    try {
      // Save form data
      await api.post('/service-forms', {
        visit_id: selectedVisitForForm.id,
        patient_id: selectedVisitForForm.patient_id,
        form_data: formData,
        completed_by: user?.id
      });
      
      toast.success('Form saved successfully');
      
      // Close form dialog
      setShowServiceFormDialog(false);
      
      // Discharge patient
      await dischargeQuickServicePatient(selectedVisitForForm);
      
      // Reset form state
      setSelectedVisitForForm(null);
      setServiceFormTemplate(null);
    } catch (error: any) {
      console.error('Error saving form:', error);
      toast.error(error.response?.data?.error || 'Failed to save form');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handlePatientSearch = () => {
    setShowPatientSearch(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  const searchPatients = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await api.get(`/patients?search=${encodeURIComponent(query)}&limit=20`);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      setSearchResults(response.data.patients || []);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.response?.data?.error || 'Failed to search patients');
    }
  };

  // Real-time search effect
  useEffect(() => {
    if (!showPatientSearch) return;
    
    const timeoutId = setTimeout(() => {
      searchPatients(searchQuery);
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, showPatientSearch]);

  const submitVitals = async () => {
    if (!selectedPatient) return;

    try {
      // Find the active visit for this patient
      const visitsResponse = await api.get(`/visits?patient_id=${selectedPatient.id}&current_stage=nurse&overall_status=Active&limit=1`);
      const visits = visitsResponse.data.visits || [];

      if (visits.length === 0) {
        toast.error('No active visit found for this patient');
        return;
      }

      const visit = visits[0];

      // Prepare vitals data as JSON string
      const vitalsData = JSON.stringify(vitalsForm);

      console.log('🔄 Updating visit:', visit.id, 'for patient:', selectedPatient.full_name);
      console.log('📤 Sending update:', {
        nurse_status: 'Completed',
        current_stage: 'doctor',
        doctor_status: 'Pending'
      });

      // Determine next stage based on visit type
      const visitType = visit.visit_type || 'Consultation';
      let nextStage = 'doctor';
      let nextStatus = 'Pending';
      let successMessage = 'Vital signs recorded. Patient sent to doctor.';
      
      if (visitType === 'Lab Only') {
        nextStage = 'lab';
        nextStatus = 'Pending';
        successMessage = 'Sample collected. Patient sent to lab.';
      }
      
      // Update visit with vitals and move to next stage
      const updateData: any = {
        nurse_status: 'Completed',
        nurse_notes: vitalsData,
        nurse_completed_at: new Date().toISOString(),
        current_stage: nextStage
      };
      
      if (nextStage === 'doctor') {
        updateData.doctor_status = nextStatus;
      } else if (nextStage === 'lab') {
        updateData.lab_status = nextStatus;
      }
      
      const response = await api.put(`/visits/${visit.id}`, updateData);

      console.log('✅ Visit updated successfully!', response.data);
      toast.success(successMessage);
      
      // Update local state immediately to remove patient from list
      setPendingVisits(prev => prev.filter(v => v.id !== visit.id));
      
      // Close dialog and reset form
      setShowVitalsDialog(false);
      setSelectedPatient(null);
      
      // Reset vitals form
      setVitalsForm({
        blood_pressure: '',
        heart_rate: '',
        temperature: '',
        oxygen_saturation: '',
        weight: '',
        weight_unit: 'kg',
        height: '',
        height_unit: 'cm',
        muac: '',
        muac_unit: 'cm',
        notes: ''
      });
      
      // Refresh data after a delay to ensure backend has processed
      setTimeout(() => {
        console.log('🔄 Refreshing nurse dashboard data...');
        fetchData(false);
      }, 2000); // Increased to 2 seconds
    } catch (error: any) {
      console.error('Vitals submission error:', error);
      toast.error(error.response?.data?.error || 'Failed to record vital signs');
    }
  };

  const submitNotes = async () => {
    if (!selectedPatient) return;

    try {
      // TODO: Implement notes API endpoint
      toast.success(`Notes added for ${selectedPatient.full_name}`);
      setShowNotesDialog(false);
      setSelectedPatient(null);
    } catch (error) {
      console.error('Notes submission error:', error);
      toast.error('Failed to add notes');
    }
  };

  const submitScheduleFollowUp = async () => {
    if (!selectedPatient) return;

    try {
      await api.post('/appointments', {
        patient_id: selectedPatient.id,
        doctor_id: user?.id,
        appointment_date: scheduleForm.appointment_date,
        appointment_time: scheduleForm.appointment_time,
        reason: scheduleForm.reason,
        appointment_type: 'Follow-up',
        status: 'Scheduled'
      });

      toast.success(`Follow-up scheduled for ${selectedPatient.full_name}`);
      setShowScheduleDialog(false);
      setSelectedPatient(null);
      
      // Reset form
      setScheduleForm({
        patient_id: '',
        appointment_date: '',
        appointment_time: '',
        reason: '',
        department_id: ''
      });
    } catch (error: any) {
      console.error('Schedule error:', error);
      toast.error(error.response?.data?.error || 'Failed to schedule follow-up');
    }
  };

  useEffect(() => {
    if (!user) return;
    
    fetchData(true); // Initial load with loading indicator

    // Set up periodic refresh instead of realtime subscriptions
    const refreshInterval = setInterval(() => {
      fetchData(false); // Background refresh without loading indicator
    }, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(refreshInterval);
    };
  }, [user]);

  const fetchData = async (isInitialLoad = true) => {
    if (!user) return;

    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      // Fetch visits waiting for nurse - don't filter by nurse_status in API call
      // because some visits may have NULL nurse_status
      const visitsResponse = await api.get('/visits?current_stage=nurse&overall_status=Active');
      const allVisits = Array.isArray(visitsResponse.data.visits) ? visitsResponse.data.visits : [];
      
      // Filter for visits that are pending for nurse (Pending, null, undefined, or empty string)
      const visitsData = allVisits.filter(v => 
        v.current_stage === 'nurse' && 
        (!v.nurse_status || v.nurse_status === 'Pending' || v.nurse_status === '')
      );
      
      console.log('👥 Nurse Dashboard - Visits fetched:', {
        totalFromAPI: allVisits.length,
        afterFilter: visitsData.length,
        filtered: allVisits.length - visitsData.length,
        visits: visitsData.map(v => ({
          id: v.id,
          patient: v.patient?.full_name,
          current_stage: v.current_stage,
          nurse_status: v.nurse_status
        }))
      });

      // Fetch today's appointments for this nurse
      const today = new Date().toISOString().split('T')[0];
      const appointmentsResponse = await api.get(`/appointments?date=${today}`);
      const appointmentsData = Array.isArray(appointmentsResponse.data.appointments) ? appointmentsResponse.data.appointments : [];

      // Fetch recent patients
      const patientsResponse = await api.get('/patients?limit=10&sort=updated_at&order=desc');
      const patientsData = Array.isArray(patientsResponse.data.patients) ? patientsResponse.data.patients : [];
      const totalPatientsCount = patientsResponse.data.total || patientsData.length;

      // Fetch completed tasks for today
      const completedResponse = await api.get(`/visits?nurse_status=Completed&nurse_completed_at=${today}`);
      const completedVisitsToday = Array.isArray(completedResponse.data.visits) ? completedResponse.data.visits : [];

      // Fetch patients returning from lab (Lab Only visits with completed lab tests)
      const labResultsResponse = await api.get('/visits?visit_type=Lab Only&lab_status=Completed&current_stage=nurse');
      const labResultsData = Array.isArray(labResultsResponse.data.visits) ? labResultsResponse.data.visits : [];

      // Calculate stats
      setPendingVisits(visitsData);
      setLabResultsReady(labResultsData);
      setAppointments(appointmentsData);
      setPatients(patientsData);
      
      // Fetch available lab test services
      try {
        const labServicesRes = await api.get('/labs/services');
        setAvailableLabTests(labServicesRes.data.services || []);
      } catch (error) {
        console.error('Failed to fetch lab services:', error);
      }
      
      // Count today's appointments - extract date from datetime string
      const todayCount = appointmentsData.filter((a: any) => {
        if (!a.appointment_date) return false;
        const aptDate = typeof a.appointment_date === 'string' ? a.appointment_date.split('T')[0] : '';
        return aptDate === today;
      }).length;
      
      setStats({
        totalPatients: totalPatientsCount, // Use total from API, not just fetched count
        todayAppointments: todayCount,
        pendingVitals: visitsData.length,
        completedTasks: completedVisitsToday.length
      });

    } catch (error: any) {
      console.error('Error fetching nurse data:', error);

      // Set empty data to prevent crashes
      setPendingVisits([]);
      setAppointments([]);
      setPatients([]);
      setStats({
        totalPatients: 0,
        todayAppointments: 0,
        pendingVitals: 0,
        completedTasks: 0
      });

      toast.error(`Failed to load dashboard data: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Nurse Dashboard">
        <div className="space-y-8">
          <div className="h-20 bg-gray-200 animate-pulse rounded-lg"></div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg"></div>)}
          </div>
          <div className="h-96 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Nurse Dashboard">
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

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Stethoscope className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Welcome back, Nurse!</h2>
              <p className="text-gray-600">Here's your patient care overview for today</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Patients</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground">Total assigned patients</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Schedule</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.todayAppointments}</div>
              <p className="text-xs text-muted-foreground">Appointments today</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Vitals</CardTitle>
              <Thermometer className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingVitals}</div>
              <p className="text-xs text-muted-foreground">Vital signs to record</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground">Tasks completed today</p>
            </CardContent>
          </Card>
        </div>

        {/* Lab Results Ready - Patients returning from lab */}
        {labResultsReady.length > 0 && (
          <Card className="shadow-lg border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Activity className="h-5 w-5" />
                Lab Results Ready (Nurse-Ordered Tests)
              </CardTitle>
              <CardDescription>Patients returning from lab with completed nurse-ordered tests - print reports and send to billing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {labResultsReady.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-3 border border-green-300 rounded-lg bg-white">
                    <div>
                      <p className="font-medium">{visit.patient?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Phone: {visit.patient?.phone}
                      </p>
                      <Badge variant="default" className="mt-1 bg-green-600">Lab Tests Completed</Badge>
                    </div>
                    <Button 
                      onClick={async () => {
                        try {
                          // Fetch lab test results for this patient
                          const response = await api.get(`/labs?patient_id=${visit.patient_id}`);
                          const tests = response.data.labTests || response.data.tests || [];
                          
                          // Filter to only show:
                          // 1. Completed tests
                          // 2. Tests from this specific visit (nurse-ordered, not doctor-ordered)
                          // 3. Tests where visit_type is "Lab Only" (nurse → lab → nurse workflow)
                          const completedTests = tests.filter((t: any) => {
                            const isCompleted = t.status === 'Completed';
                            const isFromThisVisit = t.visit_id === visit.id || t.visit?.id === visit.id;
                            const isLabOnlyVisit = visit.visit_type === 'Lab Only';
                            
                            // Only show if completed AND (from this visit OR this is a Lab Only visit)
                            return isCompleted && (isFromThisVisit || isLabOnlyVisit);
                          });
                          
                          if (completedTests.length === 0) {
                            toast.info('No completed lab tests found for this visit');
                            return;
                          }
                          
                          setLabTestResults(completedTests);
                          setSelectedVisitForResults(visit);
                          setShowLabResultsDialog(true);
                        } catch (error) {
                          console.error('Error fetching lab results:', error);
                          toast.error('Failed to load lab results');
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      View & Print Results
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Patients (Nurse Stage) */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patients Waiting for Nurse
            </CardTitle>
            <CardDescription>Patients ready for vital signs assessment or lab test ordering</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingVisits.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No patients waiting</p>
              ) : (
              <div className="space-y-3">
                {pendingVisits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{visit.patient?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Phone: {visit.patient?.phone} • Blood Group: {visit.patient?.blood_group || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Checked in: {format(new Date(visit.reception_completed_at || visit.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                      {visit.visit_type && visit.visit_type !== 'Consultation' && (
                        <Badge variant="outline" className="mt-1">{visit.visit_type}</Badge>
                      )}
                      {visit.visit_type === 'Quick Service' && visit.notes && (
                        <p className="text-xs text-blue-600 mt-1">📋 {visit.notes}</p>
                      )}
                    </div>
                    {visit.visit_type === 'Lab Only' ? (
                      <Button 
                        onClick={() => {
                          setSelectedPatientForLabTests(visit);
                          setSelectedLabTests([]);
                          setShowOrderLabTestsDialog(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Order Lab Tests
                      </Button>
                    ) : visit.visit_type === 'Quick Service' ? (
                      <Button 
                        onClick={() => handleCompleteQuickService(visit)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Stethoscope className="h-4 w-4 mr-2" />
                        Complete Service
                      </Button>
                    ) : (
                      <Button onClick={() => handleRecordVitals(visit.patient)}>
                        <Thermometer className="h-4 w-4 mr-2" />
                        Record Vitals
                      </Button>
                    )}
                </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Search & Register */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Register new patient or search existing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => {
                setNewPatientForm({
                  full_name: '',
                  phone: '',
                  gender: '',
                  date_of_birth: '',
                  address: ''
                });
                setShowRegisterPatientDialog(true);
              }}
            >
              <Users className="h-5 w-5 mr-2" />
              Register New Patient (Lab Only)
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handlePatientSearch}
            >
              <Users className="h-5 w-5 mr-2" />
              Search Patients
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Vitals Dialog */}
      <Dialog open={showVitalsDialog} onOpenChange={setShowVitalsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Thermometer className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Record Vital Signs</DialogTitle>
                <DialogDescription className="text-sm">
                  Recording vitals for <span className="font-semibold text-foreground">{selectedPatient?.full_name}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Primary Vitals Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Primary Vitals
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="blood_pressure" className="text-sm font-medium flex items-center gap-2">
                    Blood Pressure <span className="text-xs text-muted-foreground">(mmHg)</span>
                  </Label>
                  <Input
                    id="blood_pressure"
                    placeholder="120/80"
                    value={vitalsForm.blood_pressure}
                    onChange={(e) => setVitalsForm({...vitalsForm, blood_pressure: e.target.value})}
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heart_rate" className="text-sm font-medium flex items-center gap-2">
                    Heart Rate <span className="text-xs text-muted-foreground">(bpm)</span>
                  </Label>
                  <Input
                    id="heart_rate"
                    type="number"
                    placeholder="72"
                    value={vitalsForm.heart_rate}
                    onChange={(e) => setVitalsForm({...vitalsForm, heart_rate: e.target.value})}
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature" className="text-sm font-medium flex items-center gap-2">
                    Temperature <span className="text-xs text-muted-foreground">(°C or °F)</span>
                  </Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    placeholder="37.0"
                    value={vitalsForm.temperature}
                    onChange={(e) => setVitalsForm({...vitalsForm, temperature: e.target.value})}
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oxygen_saturation" className="text-sm font-medium flex items-center gap-2">
                    Oxygen Saturation <span className="text-xs text-muted-foreground">(%)</span>
                  </Label>
                  <Input
                    id="oxygen_saturation"
                    type="number"
                    placeholder="98"
                    value={vitalsForm.oxygen_saturation}
                    onChange={(e) => setVitalsForm({...vitalsForm, oxygen_saturation: e.target.value})}
                    className="h-11 text-base"
                  />
                </div>
              </div>
            </div>

            {/* Body Measurements Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Body Measurements
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm font-medium">Weight</Label>
                  <div className="flex gap-2">
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="70.5"
                      value={vitalsForm.weight}
                      onChange={(e) => setVitalsForm({...vitalsForm, weight: e.target.value})}
                      className="flex-1 h-11 text-base"
                    />
                    <Select 
                      value={vitalsForm.weight_unit} 
                      onValueChange={(value) => setVitalsForm({...vitalsForm, weight_unit: value})}
                    >
                      <SelectTrigger className="w-24 h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-sm font-medium">Height</Label>
                  <div className="flex gap-2">
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      placeholder="175"
                      value={vitalsForm.height}
                      onChange={(e) => setVitalsForm({...vitalsForm, height: e.target.value})}
                      className="flex-1 h-11 text-base"
                    />
                    <Select 
                      value={vitalsForm.height_unit} 
                      onValueChange={(value) => setVitalsForm({...vitalsForm, height_unit: value})}
                    >
                      <SelectTrigger className="w-24 h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="m">m</SelectItem>
                        <SelectItem value="ft">ft</SelectItem>
                        <SelectItem value="in">in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="muac" className="text-sm font-medium">
                    MUAC <span className="text-xs text-muted-foreground">(Mid-Upper Arm Circumference)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="muac"
                      type="number"
                      step="0.1"
                      placeholder="25.5"
                      value={vitalsForm.muac}
                      onChange={(e) => setVitalsForm({...vitalsForm, muac: e.target.value})}
                      className="flex-1 h-11 text-base"
                      title="Mid-Upper Arm Circumference"
                    />
                    <Select 
                      value={vitalsForm.muac_unit} 
                      onValueChange={(value) => setVitalsForm({...vitalsForm, muac_unit: value})}
                    >
                      <SelectTrigger className="w-24 h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="mm">mm</SelectItem>
                        <SelectItem value="in">in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="vitals_notes" className="text-sm font-medium">Additional Notes</Label>
              <Textarea
                id="vitals_notes"
                placeholder="Any observations or additional information..."
                value={vitalsForm.notes}
                onChange={(e) => setVitalsForm({...vitalsForm, notes: e.target.value})}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowVitalsDialog(false)} className="min-w-24">
              Cancel
            </Button>
            <Button onClick={submitVitals} className="min-w-32 bg-blue-600 hover:bg-blue-700">
              <Thermometer className="h-4 w-4 mr-2" />
              Record Vitals
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Patient Notes</DialogTitle>
            <DialogDescription>
              Add notes for {selectedPatient?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes_category">Category</Label>
              <Select value={notesForm.category} onValueChange={(value) => setNotesForm({...notesForm, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="medication">Medication</SelectItem>
                  <SelectItem value="symptoms">Symptoms</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="patient_notes">Notes</Label>
              <Textarea
                id="patient_notes"
                placeholder="Enter your notes..."
                value={notesForm.notes}
                onChange={(e) => setNotesForm({...notesForm, notes: e.target.value})}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
                Cancel
              </Button>
              <Button onClick={submitNotes}>Add Notes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Follow-up Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Follow-up</DialogTitle>
            <DialogDescription>
              Schedule a follow-up appointment for {selectedPatient?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appointment_date">Date</Label>
                <Input
                  id="appointment_date"
                  type="date"
                  value={scheduleForm.appointment_date}
                  onChange={(e) => setScheduleForm({...scheduleForm, appointment_date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="appointment_time">Time</Label>
                <Input
                  id="appointment_time"
                  type="time"
                  value={scheduleForm.appointment_time}
                  onChange={(e) => setScheduleForm({...scheduleForm, appointment_time: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="Follow-up reason"
                value={scheduleForm.reason}
                onChange={(e) => setScheduleForm({...scheduleForm, reason: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={submitScheduleFollowUp}>Schedule</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Patient Search Dialog */}
      <Dialog open={showPatientSearch} onOpenChange={setShowPatientSearch}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Search Patients</DialogTitle>
            <DialogDescription>
              Search for patients by name or phone number
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Start typing to search in real-time
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {searchResults.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery ? 'No patients found' : 'Enter search term to find patients'}
                </p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((patient) => (
                    <div key={patient.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{patient.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {patient.phone} • DOB: {format(new Date(patient.date_of_birth), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Badge variant={patient.status === 'Active' ? 'default' : 'secondary'}>
                          {patient.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lab Results Print Dialog */}
      <Dialog open={showLabResultsDialog} onOpenChange={setShowLabResultsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Lab Test Results - {selectedVisitForResults?.patient?.full_name}
            </DialogTitle>
            <DialogDescription>
              Lab tests ordered by nurse - Review and print results for the patient
            </DialogDescription>
          </DialogHeader>

          <div id="lab-results-print-area" className="space-y-6">
            {/* Header for Print */}
            <div className="text-center border-b pb-4 print:block">
              <h1 className="text-2xl font-bold">Laboratory Test Results</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Patient: {selectedVisitForResults?.patient?.full_name} | 
                Phone: {selectedVisitForResults?.patient?.phone} | 
                Date: {selectedVisitForResults?.visit_date ? format(new Date(selectedVisitForResults.visit_date), 'MMM dd, yyyy') : 'N/A'}
              </p>
            </div>

            {/* Lab Test Results Table */}
            {labTestResults.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No completed lab tests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {labTestResults.map((test, index) => (
                  <Card key={test.id} className="print:border print:shadow-none">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{index + 1}. {test.test_name}</CardTitle>
                          <CardDescription>{test.test_type}</CardDescription>
                        </div>
                        <Badge variant="default" className="bg-green-600">Completed</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Test Results */}
                        {test.lab_results && test.lab_results.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Parameter</TableHead>
                                <TableHead>Result</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Reference Range</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {test.lab_results.map((result: any, idx: number) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-medium">{result.parameter || result.test_name || '-'}</TableCell>
                                  <TableCell className="font-semibold">{result.result_value || result.value || '-'}</TableCell>
                                  <TableCell>{result.unit || '-'}</TableCell>
                                  <TableCell>{result.reference_range || '-'}</TableCell>
                                  <TableCell>
                                    {result.abnormal_flag ? (
                                      <Badge variant="destructive">Abnormal</Badge>
                                    ) : (
                                      <Badge variant="secondary">Normal</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : test.results ? (
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="font-medium mb-2">Results:</p>
                            <p className="whitespace-pre-wrap">{typeof test.results === 'string' ? test.results : JSON.stringify(test.results, null, 2)}</p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No detailed results available</p>
                        )}

                        {/* Notes */}
                        {test.notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-medium text-blue-900">Notes:</p>
                            <p className="text-sm text-blue-800 mt-1">{test.notes}</p>
                          </div>
                        )}

                        {/* Test Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mt-3 pt-3 border-t">
                          <div>
                            <span className="font-medium">Test Date:</span> {test.test_date ? format(new Date(test.test_date), 'MMM dd, yyyy') : 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Completed:</span> {test.completed_at ? format(new Date(test.completed_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Footer for Print */}
            <div className="text-center text-sm text-muted-foreground border-t pt-4 print:block">
              <p>This is an official laboratory report</p>
              <p className="mt-1">Printed on: {format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-4 print:hidden">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowLabResultsDialog(false);
                setSelectedVisitForResults(null);
                setLabTestResults([]);
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => {
                // Print the results
                window.print();
              }}
            >
              <Activity className="h-4 w-4 mr-2" />
              Print Results
            </Button>
            <Button
              className="flex-1"
              onClick={async () => {
                try {
                  // Update visit to send to billing
                  await api.put(`/visits/${selectedVisitForResults.id}`, {
                    current_stage: 'billing',
                    billing_status: 'Pending',
                    nurse_report_printed_at: new Date().toISOString()
                  });
                  toast.success('Patient sent to billing.');
                  setShowLabResultsDialog(false);
                  setLabResultsReady(prev => prev.filter(v => v.id !== selectedVisitForResults.id));
                  setSelectedVisitForResults(null);
                  setLabTestResults([]);
                } catch (error) {
                  toast.error('Failed to send patient to billing');
                }
              }}
            >
              Send to Billing
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send to Lab Dialog - Simplified (Lab tech will enter tests) */}
      <Dialog open={showOrderLabTestsDialog} onOpenChange={setShowOrderLabTestsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Send Patient to Lab
            </DialogTitle>
            <DialogDescription>
              Send {selectedPatientForLabTests?.patient?.full_name} to lab for testing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> The lab technician will enter the specific tests and perform the procedures.
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Patient Information:</p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedPatientForLabTests?.patient?.full_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedPatientForLabTests?.patient?.phone}
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowOrderLabTestsDialog(false);
                  setSelectedPatientForLabTests(null);
                  setSelectedLabTests([]);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={async () => {
                  try {
                    const visit = selectedPatientForLabTests;
                    
                    // Just update visit to send to lab
                    // Lab technician will enter the specific tests themselves
                    // Set doctor_status to 'Not Required' so lab knows to send to billing (not doctor)
                    await api.put(`/visits/${visit.id}`, {
                      nurse_status: 'Completed',
                      nurse_completed_at: new Date().toISOString(),
                      current_stage: 'lab',
                      lab_status: 'Pending',
                      doctor_status: 'Not Required', // Lab will route to billing instead of doctor
                      notes: (visit.notes || '') + ' | Sent to lab by nurse - tests to be determined by lab tech'
                    });

                    toast.success(`Patient sent to lab. Lab technician will enter the tests.`);
                    setShowOrderLabTestsDialog(false);
                    setSelectedPatientForLabTests(null);
                    setSelectedLabTests([]);
                    setPendingVisits(prev => prev.filter(v => v.id !== visit.id));
                    
                    // Refresh data
                    fetchData();
                  } catch (error: any) {
                    console.error('Error sending patient to lab:', error);
                    toast.error(error.response?.data?.error || 'Failed to send patient to lab');
                  }
                }}
              >
                <Activity className="h-4 w-4 mr-2" />
                Send to Lab
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register New Patient Dialog */}
      <Dialog open={showRegisterPatientDialog} onOpenChange={setShowRegisterPatientDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Register New Patient for Lab Tests
            </DialogTitle>
            <DialogDescription>
              Register a walk-in patient who needs lab tests only
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={newPatientForm.full_name}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, full_name: e.target.value })}
                  placeholder="Patient full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={newPatientForm.phone}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                  placeholder="+255..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={newPatientForm.gender}
                  onValueChange={(value) => setNewPatientForm({ ...newPatientForm, gender: value })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={newPatientForm.date_of_birth}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, date_of_birth: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  value={newPatientForm.address}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, address: e.target.value })}
                  placeholder="Patient address"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRegisterPatientDialog(false);
                  setNewPatientForm({
                    full_name: '',
                    phone: '',
                    gender: '',
                    date_of_birth: '',
                    address: ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={async () => {
                  try {
                    // Validate required fields
                    if (!newPatientForm.full_name || !newPatientForm.phone || !newPatientForm.gender || !newPatientForm.date_of_birth) {
                      toast.error('Please fill in all required fields');
                      return;
                    }

                    // Register patient
                    const patientRes = await api.post('/patients', {
                      full_name: newPatientForm.full_name,
                      phone: newPatientForm.phone,
                      gender: newPatientForm.gender,
                      date_of_birth: newPatientForm.date_of_birth,
                      address: newPatientForm.address || 'Walk-in',
                      status: 'Active'
                    });

                    const newPatient = patientRes.data.patient || patientRes.data;

                    // Create Lab Only visit
                    const visitRes = await api.post('/visits', {
                      patient_id: newPatient.id,
                      visit_date: new Date().toISOString().split('T')[0],
                      visit_type: 'Lab Only',
                      status: 'Active',
                      current_stage: 'nurse',
                      nurse_status: 'Pending',
                      reception_status: 'Checked In',
                      reception_completed_at: new Date().toISOString(),
                      overall_status: 'Active',
                      notes: 'Walk-in patient registered by nurse for lab tests'
                    });

                    const newVisit = visitRes.data.visit || visitRes.data;

                    toast.success(`${newPatientForm.full_name} registered successfully! Now order lab tests.`);
                    
                    // Close registration dialog
                    setShowRegisterPatientDialog(false);
                    setNewPatientForm({
                      full_name: '',
                      phone: '',
                      gender: '',
                      date_of_birth: '',
                      address: ''
                    });

                    // Immediately open lab test ordering dialog for this patient
                    setSelectedPatientForLabTests({
                      ...newVisit,
                      patient: newPatient,
                      patient_id: newPatient.id
                    });
                    setSelectedLabTests([]);
                    setShowOrderLabTestsDialog(true);

                    // Refresh data in background
                    fetchData();
                  } catch (error: any) {
                    console.error('Error registering patient:', error);
                    toast.error(error.response?.data?.error || 'Failed to register patient');
                  }
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Register & Add to Queue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Form Dialog */}
      <ServiceFormDialog
        open={showServiceFormDialog}
        onOpenChange={setShowServiceFormDialog}
        formTemplate={serviceFormTemplate}
        visit={selectedVisitForForm}
        onSubmit={handleServiceFormSubmit}
        submitting={formSubmitting}
      />
    </DashboardLayout>
  );
}
