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
import api from '@/lib/api';
import { Calendar, Users, Activity, Heart, Thermometer, Loader2, Stethoscope, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function NurseDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [vitalSigns, setVitalSigns] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showVitalsDialog, setShowVitalsDialog] = useState(false);
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
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingVitals: 0,
    completedTasks: 0
  });
  const [loading, setLoading] = useState(false);
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

      // Update visit with vitals and move to doctor stage
      await api.put(`/visits/${visit.id}`, {
        nurse_status: 'Completed',
        nurse_notes: vitalsData, // Store vitals in nurse_notes as JSON
        nurse_completed_at: new Date().toISOString(),
        current_stage: 'doctor',
        doctor_status: 'Pending'
      });

      toast.success(`Vital signs recorded. Patient sent to doctor.`);
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
      
      // Update local state
      setPendingVisits(prev => prev.filter(v => v.id !== visit.id));
      fetchData(); // Refresh data
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
    
    fetchData();

    // Set up periodic refresh instead of realtime subscriptions
    const refreshInterval = setInterval(() => {
      fetchData();
    }, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(refreshInterval);
    };
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch visits waiting for nurse
      const visitsResponse = await api.get('/visits?current_stage=nurse&nurse_status=Pending&overall_status=Active');
      const visitsData = Array.isArray(visitsResponse.data.visits) ? visitsResponse.data.visits : [];

      // Fetch today's appointments for this nurse
      const today = new Date().toISOString().split('T')[0];
      const appointmentsResponse = await api.get(`/appointments?date=${today}`);
      const appointmentsData = Array.isArray(appointmentsResponse.data.appointments) ? appointmentsResponse.data.appointments : [];

      // Fetch recent patients
      const patientsResponse = await api.get('/patients?limit=10&sort=updated_at&order=desc');
      const patientsData = Array.isArray(patientsResponse.data.patients) ? patientsResponse.data.patients : [];

      // Calculate stats
      setPendingVisits(visitsData);
      setAppointments(appointmentsData);
      setPatients(patientsData);
      setStats({
        totalPatients: patientsData.length,
        todayAppointments: appointmentsData.filter((a: any) => a.appointment_date === today).length,
        pendingVitals: visitsData.length,
        completedTasks: visitsData.filter((v: any) => v.nurse_status === 'Completed').length
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
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Nurse Dashboard">
        <div className="space-y-8">
          <div className="h-20 bg-gray-200 animate-pulse rounded-lg"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        {/* Pending Patients (Nurse Stage) */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patients Waiting for Nurse
            </CardTitle>
            <CardDescription>Patients ready for vital signs assessment</CardDescription>
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
                    </div>
                    <Button onClick={() => handleRecordVitals(visit.patient)}>
                      <Thermometer className="h-4 w-4 mr-2" />
                      Record Vitals
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Search */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Patient Search</CardTitle>
            <CardDescription>Search for patients in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="default"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </DashboardLayout>
  );
}
