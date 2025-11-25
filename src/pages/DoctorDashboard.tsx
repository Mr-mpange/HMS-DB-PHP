import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { fetchWithCache, invalidateCache } from '@/lib/cache';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Users, Activity, Loader2, FlaskConical, Pill, Clock, CheckCircle, X, Eye, Stethoscope, TestTube } from 'lucide-react';
import { format, isAfter, isToday, parseISO, isBefore, addMinutes, addDays } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn, logActivity } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatInTimeZone } from 'date-fns-tz';

interface LabTestResult {
  id: string;
  test_name: string;
  status: string;
  lab_results: Array<{
    id: string;
    result_value: string;
    unit: string;
    abnormal_flag: boolean;
    reference_range?: string;
  }>;
  notes?: string;
  test_type?: string;
}

interface Prescription {
  id: string;
  medication_name: string;
  status: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions?: string;
  prescribed_date: string;
  medications?: {
    strength: string;
    dosage_form: string;
  };
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [pendingVisits, setPendingVisits] = useState<any[]>([]);
  const [completedVisits, setCompletedVisits] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalAppointments: 0, todayAppointments: 0, totalPatients: 0, pendingConsultations: 0 });
  const [loading, setLoading] = useState(true); // Initial load only
  const [refreshing, setRefreshing] = useState(false); // Background refresh
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showLabResults, setShowLabResults] = useState(false);
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date>();
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedLabTests, setSelectedLabTests] = useState<LabTestResult[]>([]);
  const [selectedPrescriptions, setSelectedPrescriptions] = useState<Prescription[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // New dialog states for consultation, lab tests, and prescriptions
  const [showConsultationDialog, setShowConsultationDialog] = useState(false);
  const [showLabTestDialog, setShowLabTestDialog] = useState(false);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [availableLabTests, setAvailableLabTests] = useState<any[]>([]);
  const [availableMedications, setAvailableMedications] = useState<any[]>([]);
  
  // Consultation form state
  const [consultationForm, setConsultationForm] = useState({
    diagnosis: '',
    notes: '',
    treatment_plan: ''
  });
  
  // Lab test order form state
  const [labTestForm, setLabTestForm] = useState({
    selectedTests: [] as string[],
    priority: 'Normal',
    notes: ''
  });
  
  // Prescription form state - now supports multiple medications
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const [prescriptionForms, setPrescriptionForms] = useState<Record<string, any>>({});
  const [prescriptionForm, setPrescriptionForm] = useState({
    medication_id: '',
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '',
    instructions: ''
  });

  // Generate time slots for the time selector
  const generateTimeSlots = useCallback(() => {
    const times = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  }, []);

  // Helper functions for appointment display
  // Standardize status values
  const normalizeStatus = (status: string) => {
    if (!status) return 'Scheduled'; // Default status
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const getAppointmentBadgeVariant = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus) {
      case 'In Progress':
        return 'default';
      case 'Completed':
        return 'secondary';
      case 'Scheduled':
        return 'outline';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

    // Handle different appointment actions
  const handleStartAppointment = async (appointment: any) => {
    try {
      // Update appointment status to 'Confirmed' (valid status per DB constraint)
      const response = await api.put(`/appointments/${appointment.id}`, { status: 'Confirmed' });

      if (response.status !== 200) throw new Error('Failed to update appointment');

      // Update local state with the correct status value
      setAppointments(prev => 
        prev.map(a => 
          a.id === appointment.id 
            ? { ...a, status: 'Confirmed' } 
            : a
        )
      );
      
      // Invalidate cache to get fresh data on next poll
      invalidateCache(`doctor_appointments_${user.id}`);
      
      toast.success('Appointment started successfully');
    } catch (error) {
      console.error('Error starting appointment:', error);
      toast.error('Failed to start appointment');
    }
  };

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState<any>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [nextAction, setNextAction] = useState<'discharge' | 'lab' | 'pharmacy'>('discharge');
  const [isCompletingWithAction, setIsCompletingWithAction] = useState(false); // Track if completing with lab/pharmacy

  const handleCompleteAppointment = async (appointment: any) => {
    // Show dialog to collect notes
    setAppointmentToComplete(appointment);
    setCompletionNotes('');
    setShowCompleteDialog(true);
  };

  const confirmCompleteAppointment = async () => {
    if (!appointmentToComplete) return;
    
    if (!completionNotes.trim()) {
      toast.error('Please enter consultation notes before completing');
      return;
    }

    try {
      // Don't set loading to true - it causes the whole page to reload
      // The dialog will close and show success message instead
      
      // Update appointment status to 'Completed' with notes
      const response = await api.put(`/appointments/${appointmentToComplete.id}`, { 
        status: 'Completed',
        notes: completionNotes,
        completed_at: new Date().toISOString()
      });

      if (response.status !== 200) throw new Error('Failed to update appointment');

      // Find the visit associated with this appointment
      const visitsRes = await api.get(`/visits?appointment_id=${appointmentToComplete.id}`);
      const visits = visitsRes.data.visits || [];
      
      if (visits.length > 0) {
        const visit = visits[0];
        
        if (nextAction === 'discharge') {
          // Discharge patient - mark visit as completed
          await api.put(`/visits/${visit.id}`, {
            doctor_status: 'Completed',
            doctor_completed_at: new Date().toISOString(),
            overall_status: 'Completed',
            current_stage: 'completed',
            discharge_notes: completionNotes
          });
          toast.success('Appointment completed. Patient discharged.');
        } else if (nextAction === 'lab') {
          // Send to lab
          await api.put(`/visits/${visit.id}`, {
            doctor_status: 'Completed',
            doctor_completed_at: new Date().toISOString(),
            current_stage: 'lab',
            lab_status: 'Pending'
          });
          toast.success('Appointment completed. Patient sent to lab.');
        } else if (nextAction === 'pharmacy') {
          // Send to pharmacy
          await api.put(`/visits/${visit.id}`, {
            doctor_status: 'Completed',
            doctor_completed_at: new Date().toISOString(),
            current_stage: 'pharmacy',
            pharmacy_status: 'Pending'
          });
          toast.success('Appointment completed. Patient sent to pharmacy.');
        }
      } else {
        // No visit found - just complete the appointment
        toast.success('Appointment completed successfully');
      }

      // Update local state - remove completed appointment from list
      setAppointments(prev => 
        prev.filter(a => a.id !== appointmentToComplete.id)
      );
      
      // If there's a visit, remove it from pending visits
      if (visits.length > 0) {
        setPendingVisits(prev => 
          prev.filter(v => v.appointment_id !== appointmentToComplete.id)
        );
      }
      
      setShowCompleteDialog(false);
      setAppointmentToComplete(null);
      setCompletionNotes('');
      setNextAction('discharge');
      
      // Invalidate cache to get fresh data on next poll
      invalidateCache(`doctor_visits_${user.id}`);
      invalidateCache(`doctor_appointments_${user.id}`);
    } catch (error: any) {
      console.error('Error completing appointment:', error);
      toast.error(error.response?.data?.error || 'Failed to complete appointment');
    }
  };

  const handleCancelAppointment = async (appointment: any) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      // Update appointment status to 'cancelled' to match database enum
      const response = await api.put(`/appointments/${appointment.id}`, { 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      });

      if (response.status !== 200) throw new Error('Failed to update appointment');

      // Remove cancelled appointment from local state
      setAppointments(prev => 
        prev.filter(a => a.id !== appointment.id)
      );
      
      // Invalidate cache to get fresh data on next poll
      invalidateCache(`doctor_appointments_${user.id}`);
      
      toast.success('Appointment cancelled successfully');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowDetailsDialog(true);
  };

  const handleAppointmentAction = (appointment: any) => {
    const status = normalizeStatus(appointment.status);
    
    // Show loading state for the specific appointment being processed
    const isProcessing = loading && selectedAppointment?.id === appointment.id;

    // Check if appointment can be started
    // Allow starting appointments on the same day (no time restriction)
    const canStartAppointment = () => {
      if (!appointment.appointment_date) {
        console.log('Missing appointment date');
        return false;
      }
      
      try {
        // Extract the appointment date (ignore time for now)
        let appointmentDate;
        
        if (appointment.appointment_date.includes('T')) {
          // It's a full datetime string
          appointmentDate = appointment.appointment_date.split('T')[0];
        } else {
          // It's just a date
          appointmentDate = appointment.appointment_date;
        }
        
        // Get today's date
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // Allow starting if appointment is today or in the past
        const canStart = appointmentDate <= today;
        
        // Debug logging (only when button is disabled)
        if (!canStart) {
          console.log(`${appointment.patient?.full_name}: Cannot start yet. Appointment is scheduled for ${appointmentDate} (today is ${today}).`);
        }
        
        return canStart;
      } catch (error) {
        console.error('Error checking appointment time:', error, appointment);
        return false;
      }
    };

    switch (status) {
      case 'Scheduled':
        const canStart = canStartAppointment();
        return (
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="default" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAppointment(appointment);
                handleStartAppointment(appointment);
              }}
              disabled={isProcessing || !canStart}
              className="min-w-[80px]"
              title={!canStart ? 'Appointment time has not arrived yet' : 'Start appointment'}
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Start'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAppointment(appointment);
                handleCancelAppointment(appointment);
              }}
              disabled={isProcessing}
              className="min-w-[80px]"
            >
              Cancel
            </Button>
          </div>
        );
      case 'Confirmed':
        return (
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="default" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAppointment(appointment);
                handleCompleteAppointment(appointment);
              }}
              disabled={isProcessing}
              className="min-w-[100px]"
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Complete'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAppointment(appointment);
                handleViewDetails(appointment);
              }}
            >
              View
            </Button>
          </div>
        );
      case 'Completed':
      case 'Cancelled':
        return (
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAppointment(appointment);
              handleViewDetails(appointment);
            }}
            className="w-full"
          >
            View Details
          </Button>
        );
      default:
        return null;
    }
  };

  const getAppointmentDotClass = (appointment: any) => {
    const apptTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const now = new Date();
    
    if (appointment.status === 'Completed') return 'bg-gray-400';
    if (appointment.status === 'Confirmed') return 'bg-green-500 animate-pulse';
    if (isBefore(now, apptTime)) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  const getAppointmentRowClass = (appointment: any) => {
    if (appointment.status === 'Completed') return 'opacity-60';
    if (appointment.status === 'Confirmed') return 'bg-blue-50';
    return '';
  };

  const getCurrentWeekRange = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate start of week (Monday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1)); // If Sunday, go back 6 days to Monday
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Calculate end of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { start: startOfWeek, end: endOfWeek };
  };

  const getAppointmentStatusBadge = (appointment: any) => {
    if (!appointment.appointment_date || !appointment.appointment_time) {
      return null;
    }

    try {
      const apptTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
      
      // Check if date is valid
      if (isNaN(apptTime.getTime())) {
        return null;
      }

      const now = new Date();
      
      if (appointment.status === 'Completed') return null;
      
      if (isBefore(now, apptTime)) {
        const minsToAppt = Math.ceil((apptTime.getTime() - now.getTime()) / (1000 * 60));
        if (minsToAppt <= 30) {
          return (
            <span className="text-xs text-amber-600">
              Starts in {minsToAppt} min
            </span>
          );
        }
        return (
          <span className="text-xs text-muted-foreground">
            {format(apptTime, 'h:mm a')}
          </span>
        );
      }
      
      if (isBefore(now, addMinutes(apptTime, 30))) {
        return (
          <span className="text-xs font-medium text-green-600">
            In progress
          </span>
        );
      }
      
      return (
        <span className="text-xs text-muted-foreground">
          {format(apptTime, 'h:mm a')}
        </span>
      );
    } catch (error) {
      console.error('Error formatting appointment time:', error, appointment);
      return null;
    }
  };

  // Update current time every 30 seconds to enable Start button when time arrives
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      console.log('Time updated:', now.toLocaleTimeString());
      
      // Check if any appointment time has been reached
      appointments.forEach(appointment => {
        if (!appointment.appointment_date || !appointment.appointment_time) return;
        
        try {
          const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
          
          // Check if date is valid
          if (isNaN(appointmentDateTime.getTime())) return;
          
          const appointmentEndTime = addMinutes(appointmentDateTime, 30); // Assuming 30 min appointments
          
          // If current time is within the appointment window and status is not 'Completed' or 'Confirmed'
          if (
            isAfter(now, appointmentDateTime) && 
            isBefore(now, appointmentEndTime) &&
            !['Completed', 'Confirmed'].includes(appointment.status)
          ) {
            // We'll use the full updateAppointmentStatus function instead of the incomplete one
          }
        } catch (error) {
          console.error('Error processing appointment time:', error, appointment);
        }
      });
    }, 10000); // Check every 10 seconds for better responsiveness
    
    return () => clearInterval(timer);
  }, [appointments]);

  // Remove duplicate functions
  // The complete versions are defined later in the file
  
  // Fetch data when component mounts or user changes

  // Fetch appointments with retry logic
  const fetchAppointments = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // First, fetch only the essential appointment data
      const response = await api.get(`/appointments?doctor_id=${user.id}`);
      
      if (response.status !== 200) throw new Error('Failed to fetch appointments');
      const appointmentsData = response.data.appointments;
      if (!appointmentsData) return;

      // Get unique patient IDs
      const patientIds = [...new Set(appointmentsData.map((appt: any) => appt.patient_id))];
      
      // Fetch patient data in a separate query
      let patientsData: any[] = [];
      if (patientIds.length > 0) {
        const patientResponse = await api.get(`/patients?ids=${patientIds.join(',')}`);
        
        if (patientResponse.status === 200) {
          patientsData = patientResponse.data.patients || [];
        }
      }
      
      // Combine the data
      const processedAppointments = appointmentsData.map((appt: any) => {
        const patient = patientsData.find((p: any) => p.id === appt.patient_id) || {};
        return {
          ...appt,
          status: normalizeStatus(appt.status),
          patient
        };
      });
      
      setAppointments(processedAppointments);
      
      // Update stats
      const today = new Date().toISOString().split('T')[0];
      const todayApps = processedAppointments.filter(
        (appt: any) => {
          const aptDate = appt.appointment_date ? appt.appointment_date.split('T')[0] : '';
          return aptDate === today && !['Completed', 'Cancelled'].includes(appt.status);
        }
      ).length;
      
      setStats({
        totalAppointments: processedAppointments.length,
        todayAppointments: todayApps,
        totalPatients: patients.length,
        pendingConsultations: processedAppointments.filter(
          (appt: any) => appt.status === 'Scheduled' || appt.status === 'Confirmed'
        ).length
      });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch available lab tests from medical services catalog
  const fetchAvailableLabTests = useCallback(async () => {
    try {
      const response = await api.get('/labs/services');
      if (response.data.error) throw new Error(response.data.error);
      // Map services to lab test format for compatibility
      const services = (response.data.services || []).map((service: any) => ({
        id: service.id,
        service_id: service.id,
        test_name: service.service_name,
        test_type: service.service_type || 'Laboratory',
        description: service.description,
        price: service.base_price || service.price,
        currency: service.currency || 'TZS'
      }));
      setAvailableLabTests(services);
      console.log('Loaded lab services from medical_services:', services.length);
    } catch (error: any) {
      console.error('Error fetching lab services:', error);
      // Don't show error toast - just log it
    }
  }, []);

  // Fetch available medications
  const fetchAvailableMedications = useCallback(async () => {
    try {
      const response = await api.get('/pharmacy/medications');
      if (response.data.error) throw new Error(response.data.error);
      setAvailableMedications(response.data.medications || []);
    } catch (error: any) {
      console.error('Error fetching medications:', error);
      // Don't show error toast - just log it
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchAvailableLabTests();
    fetchAvailableMedications();
  }, [fetchAppointments, fetchAvailableLabTests, fetchAvailableMedications]);

  // Function to update appointment status - moved to line 708

  // Function to handle rescheduling an appointment - moved to line 1270

  // Function to handle consultation submission
  const handleConsultationSubmit = async () => {
    if (!consultationForm.diagnosis || !consultationForm.treatment_plan) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await api.post('/consultations', {
        appointment_id: selectedVisit.id,
        diagnosis: consultationForm.diagnosis,
        notes: consultationForm.notes,
        treatment_plan: consultationForm.treatment_plan
      });

      if (response.status !== 200) throw new Error('Failed to submit consultation');

      toast.success('Consultation submitted successfully');
      setShowConsultationDialog(false);
      
      // Refresh appointments to get updated data
      await fetchAppointments();
      
      // Keep selectedVisit so doctor can continue adding lab tests/prescriptions
      // Don't clear it here - only clear when explicitly closing the patient view
    } catch (error) {
      console.error('Error submitting consultation:', error);
      toast.error('Failed to submit consultation');
    } finally {
      setConsultationForm({ diagnosis: '', notes: '', treatment_plan: '' });
    }
  };

  // Function to handle lab test order submission
  const handleLabTestOrderSubmit = async () => {
    if (labTestForm.selectedTests.length === 0) {
      toast.error('Please select at least one test');
      return;
    }

    try {
      // This function is not currently used - submitLabTestOrder is the active function
      toast.info('This feature is being updated. Please use the main lab test order button.');
      setShowLabTestDialog(false);
    } catch (error) {
      console.error('Error ordering lab tests:', error);
      toast.error('Failed to order lab tests');
    } finally {
      setSelectedVisit(null);
      setLabTestForm({ selectedTests: [], priority: 'Normal', notes: '' });
    }
  };

  // Function to handle prescription submission
  const handlePrescriptionSubmit = async () => {
    if (selectedMedications.length === 0) {
      toast.error('Please add at least one medication');
      return;
    }

    try {
      const prescriptions = selectedMedications.map(medicationId => ({
        appointment_id: selectedVisit.id,
        medication_id: medicationId,
        dosage: prescriptionForms[medicationId].dosage,
        frequency: prescriptionForms[medicationId].frequency,
        duration: prescriptionForms[medicationId].duration,
        quantity: prescriptionForms[medicationId].quantity,
        instructions: prescriptionForms[medicationId].instructions
      }));

      const response = await api.post('/prescriptions', prescriptions);

      if (response.status !== 200) throw new Error('Failed to create prescriptions');

      toast.success('Prescriptions created successfully');
      setShowPrescriptionDialog(false);
    } catch (error) {
      console.error('Error creating prescriptions:', error);
      toast.error('Failed to create prescriptions');
    } finally {
      setSelectedVisit(null);
      setSelectedMedications([]);
      setPrescriptionForms({});
    }
  };

  // Fetch data when component mounts or user changes
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;
    let pollTimer: NodeJS.Timeout;
    
    const setupPolling = async () => {
      try {
        // Initial data fetch
        if (isMounted) {
          await fetchAppointments();
        }
        
        // Real-time updates handled by Socket.io in main useEffect
        // No polling needed
      } catch (error) {
        console.error('Error setting up polling:', error);
        if (isMounted) {
          toast.error('Failed to set up data polling');
        }
      }
    };
    
    setupPolling();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, [user?.id, fetchAppointments]); // Depend on user.id and fetchAppointments to prevent unnecessary re-renders

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      // Input validation
      if (!appointmentId) {
        console.error('No appointment ID provided');
        toast.error('Error: No appointment ID provided');
        return;
      }

      const validStatuses = ['Scheduled', 'Confirmed', 'Completed', 'Cancelled'];
      if (!validStatuses.includes(newStatus)) {
        console.error('Invalid status provided:', newStatus);
        toast.error(`Error: Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        return;
      }

      console.log('Updating appointment status:', { appointmentId, newStatus });

      // Map display statuses to database enum values where needed
      const dbStatus = newStatus === 'Completed' ? 'completed' : newStatus === 'Cancelled' ? 'cancelled' : newStatus;
      const updateData: any = { 
        status: dbStatus,
        updated_at: new Date().toISOString()
      };

      // Only set completed_at when marking as completed
      if (newStatus === 'Completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const response = await api.put(`/appointments/${appointmentId}`, updateData);

      if (response.status !== 200) {
        throw new Error('Failed to update appointment');
      }

      const data = response.data;
      if (!data) {
        throw new Error('No data returned from update - appointment may not exist');
      }

      console.log('Update successful, response data:', data);

      // Update local state
      setAppointments(prev => {
        const updated = prev.map(appt =>
          appt.id === appointmentId ? { 
            ...appt, 
            ...data,
            patient: data.patient || appt.patient // Preserve patient data if not in response
          } : appt
        );
        console.log('Updated appointments state:', updated);
        return updated;
      });

      // Show appropriate toast message
      const appointment = data;
      const patientName = appointment?.patient?.full_name || 'the patient';
      
      const statusMessages = {
        'Scheduled': `Appointment with ${patientName} has been rescheduled`,
        'Confirmed': `Started consultation with ${patientName}`,
        'Completed': `Completed appointment with ${patientName}`,
        'Cancelled': `Cancelled appointment with ${patientName}`
      };

      const message = statusMessages[newStatus as keyof typeof statusMessages] || 'Appointment updated';
      console.log('Showing success message:', message);
      toast.success(message);
      
      // If completing an appointment, check if there are pending lab tests or prescriptions
      if (newStatus === 'Completed') {
        console.log('Appointment completed, check for pending tests/prescriptions');
        // You could add logic here to check for pending tests/prescriptions
        // and prompt the doctor if they want to order any
      }
    } catch (error) {
      console.error('Error in updateAppointmentStatus:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Full error details:', error);
      toast.error(`Failed to update appointment status: ${errorMessage}`);
    }
  };

  // Get appointment actions based on status and time
  const getAppointmentActions = (appointment: any) => {
    const now = new Date();
    const apptTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const apptEndTime = addMinutes(apptTime, 30);
    
    // If appointment is in the future
    if (isBefore(now, apptTime)) {
      return (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => updateAppointmentStatus(appointment.id, 'Cancelled')}
          >
            Cancel
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => {
              setSelectedAppointment(appointment);
              setRescheduleDate(new Date(appointment.appointment_date));
              setRescheduleTime(appointment.appointment_time);
              setShowRescheduleForm(true);
            }}
          >
            Reschedule
          </Button>
        </div>
      );
    }
    
    // If appointment time has arrived but not yet confirmed
    if (isBefore(now, apptEndTime) && appointment.status !== 'Confirmed') {
      return (
        <Button 
          variant="default" 
          size="sm" 
          className="h-7 text-xs"
          onClick={() => updateAppointmentStatus(appointment.id, 'Confirmed')}
        >
          Start Consultation
        </Button>
      );
    }
    
    // If appointment is confirmed (in progress)
    if (appointment.status === 'Confirmed') {
      return (
        <div className="flex gap-2">
          <Button 
            variant="default" 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => {
              // This would open a form to add consultation notes
              toast.info('Would open consultation notes form');
            }}
          >
            Add Notes
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => updateAppointmentStatus(appointment.id, 'Completed')}
          >
            Complete
          </Button>
        </div>
      );
    }
    
    // For completed appointments
    if (appointment.status === 'Completed') {
      return (
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => {
              // This would open the patient's record
              if (appointment.patient_id) {
                window.open(`/patients/${appointment.patient_id}`, '_blank');
              }
            }}
          >
            View Record
          </Button>
        </div>
      );
    }
    
    // For no show or cancelled appointments
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 text-xs"
        onClick={() => {
          // Option to reschedule
          toast.info('Would open reschedule form');
        }}
      >
        Reschedule
      </Button>
    );
  };
  
  const handleViewLabResults = async (tests: any[], visit?: any) => {
    // Deduplicate tests by ID to avoid duplicate key warnings
    const uniqueTests = tests.filter((test, index, self) => 
      index === self.findIndex((t) => t.id === test.id)
    );
    setSelectedLabTests(uniqueTests);
    setShowLabResults(true);
    
    // If visit is provided and has lab results that haven't been reviewed, mark as reviewed
    if (visit && visit.lab_completed_at && !visit.lab_results_reviewed) {
      try {
        const response = await api.put(`/visits/${visit.id}`, {
          lab_results_reviewed: true,
          lab_results_reviewed_at: new Date().toISOString()
        });
        
        if (response.status === 200) {
          // Update local state
          setPendingVisits(prev => prev.map(v => 
            v.id === visit.id 
              ? { ...v, lab_results_reviewed: true, lab_results_reviewed_at: new Date().toISOString() }
              : v
          ));
        }
      } catch (error) {
        console.error('Error marking lab results as reviewed:', error);
      }
    }
  };
  
  const handleViewPrescriptions = (prescriptions: any[]) => {
    // Deduplicate prescriptions by ID to avoid duplicate key warnings
    const uniquePrescriptions = prescriptions.filter((prescription, index, self) => 
      index === self.findIndex((p) => p.id === prescription.id)
    );
    setSelectedPrescriptions(uniquePrescriptions);
    setShowPrescriptions(true);
  };

  // Handler for starting consultation
  const handleStartConsultation = async (visit: any) => {
    setSelectedVisit(visit);
    setConsultationForm({
      diagnosis: '',
      notes: '',
      treatment_plan: ''
    });
    
    // If this patient came from lab, mark lab results as reviewed
    if (visit.lab_completed_at && !visit.lab_results_reviewed) {
      try {
        const response = await api.put(`/visits/${visit.id}`, {
          lab_results_reviewed: true,
          lab_results_reviewed_at: new Date().toISOString()
        });
        
        if (response.status === 200) {
          // Update local state
          setPendingVisits(prev => prev.map(v => 
            v.id === visit.id 
              ? { ...v, lab_results_reviewed: true, lab_results_reviewed_at: new Date().toISOString() }
              : v
          ));
        }
      } catch (error) {
        console.error('Error marking lab results as reviewed:', error);
      }
    }
    
    setShowConsultationDialog(true);
  };

  // Handler for ordering lab tests
  const handleOrderLabTests = async (visit: any) => {
    setSelectedVisit(visit);
    setLabTestForm({
      selectedTests: [],
      priority: 'Normal',
      notes: ''
    });
    
    // Fetch available lab tests from medical services catalog
    // Note: availableLabTests is already loaded in useEffect via fetchAvailableLabTests()
    // which calls /labs/services endpoint
    
    // If not loaded yet, fetch now
    if (!availableLabTests || availableLabTests.length === 0) {
      await fetchAvailableLabTests();
    }
    
    setShowLabTestDialog(true);
  };

  // Handler for writing prescription
  const handleWritePrescription = async (visit: any) => {
    setSelectedVisit(visit);
    setSelectedMedications([]);
    setPrescriptionForms({});
    setPrescriptionForm({
      medication_id: '',
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: '',
      instructions: ''
    });
    
    // Fetch available medications
    try {
      const response = await api.get('/pharmacy/medications');
      
      if (response.status !== 200) {
        console.error('Error fetching medications:', response.statusText);
        toast.error(`Failed to load medications: ${response.statusText}`);
        // Use predefined list as fallback
        const predefinedMeds = [
          { id: 'amox', name: 'Amoxicillin', strength: '500mg', dosage_form: 'Capsule' },
          { id: 'para', name: 'Paracetamol', strength: '500mg', dosage_form: 'Tablet' },
          { id: 'ibu', name: 'Ibuprofen', strength: '400mg', dosage_form: 'Tablet' },
          { id: 'met', name: 'Metformin', strength: '500mg', dosage_form: 'Tablet' },
          { id: 'ome', name: 'Omeprazole', strength: '20mg', dosage_form: 'Capsule' },
          { id: 'aml', name: 'Amlodipine', strength: '5mg', dosage_form: 'Tablet' },
          { id: 'cipro', name: 'Ciprofloxacin', strength: '500mg', dosage_form: 'Tablet' },
          { id: 'azith', name: 'Azithromycin', strength: '250mg', dosage_form: 'Tablet' }
        ];
        setAvailableMedications(predefinedMeds);
      } else {
        setAvailableMedications(response.data.medications || []);
      }
    } catch (error: any) {
      console.error('Error fetching medications:', error);
      toast.error(`Failed to load medications: ${error.message || 'Unknown error'}`);
    }
    
    setShowPrescriptionDialog(true);
  };

  // Submit consultation - Save diagnosis and notes only, don't complete yet
  const submitConsultation = async () => {
    if (!selectedVisit || !consultationForm.diagnosis) {
      toast.error('Please enter a diagnosis');
      return;
    }

    try {
      // Combine notes and treatment plan into doctor_notes field
      const combinedNotes = consultationForm.treatment_plan 
        ? `${consultationForm.notes}\n\nTreatment Plan:\n${consultationForm.treatment_plan}`
        : consultationForm.notes;

      // Save consultation notes but keep status as "In Consultation"
      // Doctor must order lab tests or write prescription to complete
      const response = await api.put(`/visits/${selectedVisit.id}`, {
        doctor_diagnosis: consultationForm.diagnosis,
        doctor_notes: combinedNotes,
        doctor_status: 'In Consultation',
        updated_at: new Date().toISOString()
      });

      if (response.status !== 200) throw new Error('Failed to update visit');

      toast.success('Consultation notes saved. Please order lab tests or write prescription.');
      setShowConsultationDialog(false);
      
      // Invalidate cache to fetch fresh data
      invalidateCache(`doctor_visits_${user?.id}`);
      
      // Don't remove from pending visits - patient stays in doctor queue
      // Refresh the visit data to show updated notes
      const updatedVisits = pendingVisits.map(v => 
        v.id === selectedVisit.id 
          ? { ...v, doctor_diagnosis: consultationForm.diagnosis, doctor_notes: combinedNotes }
          : v
      );
      setPendingVisits(updatedVisits);
    } catch (error) {
      console.error('Error saving consultation:', error);
      toast.error('Failed to save consultation notes');
    }
  };

  // Submit lab test order
  const submitLabTestOrder = async () => {
    if (!selectedVisit || labTestForm.selectedTests.length === 0) {
      toast.error('Please select at least one lab test');
      return;
    }

    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      // Create lab test orders one by one to better handle errors
      const labTests = labTestForm.selectedTests.map(testId => {
        const test = availableLabTests.find(t => t.id === testId);
        return {
          patient_id: selectedVisit.patient_id,
          service_id: test?.service_id || test?.id, // Link to medical service
          test_name: test?.test_name || '',
          test_type: test?.test_type || '',
          status: 'Pending',
          priority: labTestForm.priority,
          notes: labTestForm.notes || null,
          ordered_by_doctor_id: user.id,
          ordered_date: new Date().toISOString()
        };
      });

      console.log('Ordering lab tests:', labTests);

      // Insert lab tests one by one
      const createdTests = [];
      for (const test of labTests) {
        try {
          const response = await api.post('/labs', {
            patient_id: test.patient_id,
            doctor_id: user.id,
            test_name: test.test_name,
            test_type: test.test_type || 'Laboratory',
            test_date: new Date().toISOString().split('T')[0],
            status: 'Pending',
            notes: test.notes
          });
          
          if (response.data.error) {
            throw new Error(response.data.error);
          }
          
          createdTests.push(response.data);
        } catch (testError: any) {
          console.error('Error creating lab test:', testError);
          throw new Error(`Failed to create test "${test.test_name}": ${testError.message}`);
        }
      }

      console.log('Lab tests created successfully:', createdTests.length);

      // Add lab tests to patient billing (patient-services)
      // Each lab test should be billed as a service
      for (const testData of labTests) {
        try {
          const test = availableLabTests.find(t => t.id === testData.service_id || t.service_id === testData.service_id);
          if (test && test.service_id) {
            // Get the service details to get the price
            const serviceRes = await api.get(`/services/${test.service_id}`);
            const service = serviceRes.data.service;
            
            if (service) {
              // Create patient-service entry for billing
              await api.post('/patient-services', {
                patient_id: selectedVisit.patient_id,
                service_id: service.id,
                quantity: 1,
                unit_price: service.base_price,
                total_price: service.base_price,
                service_date: new Date().toISOString().split('T')[0],
                status: 'Pending',
                notes: `Lab test: ${testData.test_name}`
              });
              
              console.log(`✅ Added ${testData.test_name} (TSh ${service.base_price}) to patient bill`);
            }
          }
        } catch (billingError) {
          console.error('Error adding lab test to billing:', billingError);
          // Continue - don't fail the whole operation if billing fails
        }
      }

      // Update or create patient visit to lab stage
      // Patient will return to doctor after lab is completed
      if (selectedVisit.id) {
        // Update existing visit
        const visitResponse = await api.put(`/visits/${selectedVisit.id}`, {
          current_stage: 'lab',
          lab_status: 'Pending',
          doctor_status: 'Pending Review', // Doctor needs to review lab results
          updated_at: new Date().toISOString()
        });

        if (visitResponse.status !== 200) {
          console.error('Visit update error:', visitResponse.statusText);
          throw new Error(`Failed to update patient visit: ${visitResponse.statusText}`);
        }
        
        console.log('Visit updated - patient sent to lab');
      } else if (selectedVisit.patient_id) {
        // Create a new visit for appointment-based flow
        console.log('Creating visit for appointment-based lab order');
        try {
          const visitResponse = await api.post('/visits', {
            patient_id: selectedVisit.patient_id,
            visit_date: new Date().toISOString().split('T')[0],
            current_stage: 'lab',
            overall_status: 'Active',
            reception_status: 'Checked In',
            nurse_status: 'Completed',
            lab_status: 'Pending',
            doctor_status: 'Pending Review',
            doctor_id: user?.id
          });
          
          if (visitResponse.status === 201) {
            console.log('Visit created successfully for lab workflow');
          }
        } catch (createError) {
          console.error('Failed to create visit:', createError);
          // Continue anyway - lab tests are already created
        }
      }

      toast.success(`${labTests.length} lab test(s) ordered successfully. Patient sent to lab.`);
      setShowLabTestDialog(false);
      
      // If completing appointment with lab tests, mark appointment as "In Progress" not "Completed"
      // Patient will return to doctor after lab
      if (isCompletingWithAction && appointmentToComplete) {
        await api.put(`/appointments/${appointmentToComplete.id}`, {
          status: 'In Progress', // Not completed yet - waiting for lab results
          notes: completionNotes
        });
        setAppointmentToComplete(null);
        setCompletionNotes('');
        setNextAction('discharge');
        setIsCompletingWithAction(false);
        toast.info('Patient sent to lab. They will return to you after lab work is completed.');
      }
      
      // Reset form
      setLabTestForm({
        selectedTests: [],
        priority: 'Normal',
        notes: ''
      });
      
      // Remove from pending visits
      setPendingVisits(prev => prev.filter(v => v.id !== selectedVisit.id));
    } catch (error: any) {
      console.error('Error ordering lab tests:', error);
      const errorMessage = error.message || 'Failed to order lab tests';
      toast.error(errorMessage);
    }
  };

  // Submit prescriptions (multiple)
  const submitPrescription = async () => {
    if (!selectedVisit || selectedMedications.length === 0) {
      toast.error('Please select at least one medication');
      return;
    }

    console.log('Selected visit for prescription:', selectedVisit);

    // Validate all selected medications have required fields
    for (const medId of selectedMedications) {
      const form = prescriptionForms[medId];
      const med = availableMedications.find(m => m.id === medId);
      const medName = med?.name || 'medication';
      
      if (!form || !form.dosage || !form.frequency || !form.duration || !form.quantity) {
        toast.error(`Please fill in all required fields for ${medName}`);
        return;
      }
    }

    try {
      // Create prescription items for all selected medications
      const prescriptionItems = selectedMedications.map(medId => {
        const form = prescriptionForms[medId];
        const med = availableMedications.find(m => m.id === medId);
        
        const quantity = parseInt(form.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(`Invalid quantity for ${med?.name || 'medication'}`);
        }
        
        return {
          medication_id: medId,
          medication_name: med?.name || '',
          dosage: form.dosage,
          frequency: form.frequency,
          duration: form.duration,
          quantity: quantity,
          instructions: form.instructions || null
        };
      });

      // Create a single prescription with multiple items
      const prescriptionData = {
        patient_id: selectedVisit.patient_id,
        doctor_id: user?.id,
        visit_id: selectedVisit.id || null,
        prescription_date: new Date().toISOString(),
        diagnosis: selectedVisit.doctor_diagnosis || null,
        notes: selectedVisit.doctor_notes || null,
        items: prescriptionItems
      };

      console.log('Creating prescription:', prescriptionData);
      const response = await api.post('/prescriptions', prescriptionData);

      console.log('Prescription response:', response.data);
      if (response.status !== 201 && response.status !== 200) {
        throw new Error(response.data?.error || 'Failed to create prescriptions');
      }

      // Log prescription creation
      // Note: We're removing the logActivity call as it's not part of the API
      console.log('Prescription creation logged', {
        doctor_id: user?.id,
        patient_id: selectedVisit.patient_id,
        visit_id: selectedVisit.id,
        prescription_count: selectedMedications.length,
        medications: prescriptionItems.map(p => ({
          medication: p.medication_name,
          quantity: p.quantity,
          dosage: p.dosage
        }))
      });

      // After writing prescription, complete consultation and send to pharmacy
      // Update or create visit
      if (selectedVisit.id) {
        // Update existing visit
        const visitResponse = await api.put(`/visits/${selectedVisit.id}`, {
          doctor_status: 'Completed',
          doctor_completed_at: new Date().toISOString(),
          current_stage: 'pharmacy',
          pharmacy_status: 'Pending',
          updated_at: new Date().toISOString()
        });

        if (visitResponse.status !== 200) {
          console.error('Error updating visit after prescription:', visitResponse.statusText);
          toast.error('Prescription saved but failed to send patient to pharmacy');
          return;
        }
        
        console.log('Visit updated - patient sent to pharmacy');
      } else if (selectedVisit.patient_id) {
        // Create a new visit for appointment-based flow
        console.log('Creating visit for appointment-based pharmacy order');
        try {
          await api.post('/visits', {
            patient_id: selectedVisit.patient_id,
            visit_date: new Date().toISOString().split('T')[0],
            current_stage: 'pharmacy',
            overall_status: 'Active',
            reception_status: 'Checked In',
            nurse_status: 'Completed',
            doctor_status: 'Completed',
            doctor_completed_at: new Date().toISOString(),
            pharmacy_status: 'Pending',
            doctor_id: user?.id
          });
          console.log('Visit created successfully for pharmacy workflow');
        } catch (createError) {
          console.error('Failed to create visit:', createError);
          // Continue anyway - prescriptions are already created
        }
      }

      // Note: We're removing the logActivity call as it's not part of the API
      console.log('Consultation completion logged', {
        doctor_id: user?.id,
        patient_id: selectedVisit.patient_id,
        visit_id: selectedVisit.id,
        next_stage: 'pharmacy'
      });

      toast.success(`${selectedMedications.length} prescription(s) written. Patient sent to pharmacy.`);
      setShowPrescriptionDialog(false);
      
      // If completing appointment with prescription, complete it now
      if (isCompletingWithAction && appointmentToComplete) {
        await api.put(`/appointments/${appointmentToComplete.id}`, {
          status: 'Completed',
          notes: completionNotes || 'Prescription written', // Include notes to satisfy validation
          completed_at: new Date().toISOString()
        });
        setAppointmentToComplete(null);
        setCompletionNotes('');
        setNextAction('discharge');
        setIsCompletingWithAction(false);
        toast.success('Appointment completed. Patient sent to pharmacy.');
      }
      
      // Reset form for next prescription
      setSelectedMedications([]);
      setPrescriptionForms({});
      setPrescriptionForm({
        medication_id: '',
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        quantity: '',
        instructions: ''
      });

      // Remove from pending visits
      setPendingVisits(prev => prev.filter(v => v.id !== selectedVisit.id));
    } catch (error: any) {
      console.error('Error writing prescription:', error);
      console.error('Error details:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to write prescription';
      toast.error(errorMsg);
    }
  };

  const handleRescheduleAppointment = async () => {
    // Input validation
    if (!rescheduleDate || !rescheduleTime || !selectedAppointment) {
      console.error('Missing required fields for rescheduling:', { 
        rescheduleDate, 
        rescheduleTime, 
        selectedAppointment 
      });
      toast.error('Please fill in all required fields');
      return;
    }
    
    console.log('Starting reschedule with data:', {
      appointmentId: selectedAppointment.id,
      newDate: rescheduleDate,
      newTime: rescheduleTime,
      reason: rescheduleReason
    });

    setIsRescheduling(true);
    try {
      const newDate = format(rescheduleDate, 'yyyy-MM-dd');
      console.log('Formatted date for DB:', newDate);

      const updateData = { 
        appointment_date: newDate,
        appointment_time: rescheduleTime,
        status: 'Scheduled',
        rescheduled_at: new Date().toISOString(),
        reschedule_reason: rescheduleReason || 'No reason provided',
        updated_at: new Date().toISOString()
      };

      console.log('Sending update to database:', updateData);

      const response = await api.put(`/appointments/${selectedAppointment.id}`, updateData);

      if (response.status !== 200) {
        throw new Error(response.statusText || 'Failed to update appointment in database');
      }

      const data = response.data;
      if (!data) {
        throw new Error('No data returned from update - appointment may not exist');
      }

      console.log('Database update successful, response:', data);

      // Update local state with the complete appointment data from the server
      setAppointments(prev => {
        const updated = prev.map(appt =>
          appt.id === selectedAppointment.id 
            ? { 
                ...appt,
                ...data,
                patient: appt.patient // Preserve patient data
              } 
            : appt
        );
        console.log('Updated appointments state:', updated);
        return updated;
      });

      const successMessage = `Appointment rescheduled to ${format(rescheduleDate, 'PPP')} at ${rescheduleTime}`;
      console.log('Success:', successMessage);
      toast.success(successMessage);
      
      // Reset form
      setShowRescheduleForm(false);
      setRescheduleDate(undefined);
      setRescheduleTime('');
      setRescheduleReason('');
      setSelectedAppointment(null);
      
    } catch (error) {
      console.error('Error in handleRescheduleAppointment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error details:', error);
      toast.error(`Failed to reschedule appointment: ${errorMessage}`);
    } finally {
      setIsRescheduling(false);
    }
  };

  const fetchData = async (isInitialLoad = false) => {
    if (!user) {
      console.log('No user found, skipping data fetch');
      return;
    }

    console.log('Fetching doctor dashboard data for user:', user.id);
    
    // Only show full loading screen on initial load
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      // Fetch visits waiting for doctor (with caching)
      // Cache for 30 seconds, refetch after 15 seconds
      const visitsResponse = await fetchWithCache(
        `doctor_visits_${user.id}`,
        () => api.get(`/visits?current_stage=doctor&overall_status=Active&doctor_status=Pending`),
        { cacheTime: 30000, staleTime: 15000 }
      );
      
      if (visitsResponse.status !== 200) {
        console.error('Error fetching visits:', visitsResponse.statusText);
        throw new Error(visitsResponse.statusText);
      }
      
      const visitsData = visitsResponse.data.visits || [];
      
      console.log('Doctor Dashboard - Patients waiting:', {
        total_patients: visitsData?.length || 0,
        patients: visitsData?.map(v => ({
          id: v.id,
          patient: v.patient?.full_name,
          current_stage: v.current_stage,
          doctor_status: v.doctor_status,
          doctor_id: v.doctor_id,
          nurse_completed: v.nurse_completed_at ? 'Yes' : 'No',
          lab_status: v.lab_status,
          created_at: v.created_at
        })) || []
      });



      // Fetch doctor's appointments (with caching)
      const appointmentsResponse = await fetchWithCache(
        `doctor_appointments_${user.id}`,
        () => api.get(`/appointments?doctor_id=${user.id}`),
        { cacheTime: 60000, staleTime: 30000 }
      );
      
      if (appointmentsResponse.status !== 200) {
        console.error('Error fetching appointments:', appointmentsResponse.statusText);
        throw new Error(appointmentsResponse.statusText);
      }

      // Fetch total patients count
      const patientCountResponse = await api.get('/patients?limit=1');
      const totalPatientsCount = patientCountResponse.data.total || 0;
      
      const appointmentsData = appointmentsResponse.data.appointments || [];
      console.log('Fetched appointments:', appointmentsData?.length || 0);

      // Fetch patients (with caching)
      const patientsResponse = await fetchWithCache(
        'recent_patients',
        () => api.get('/patients?limit=10&sort=created_at&order=desc'),
        { cacheTime: 120000, staleTime: 60000 }
      );
      
      const patientsData = patientsResponse.status === 200 ? patientsResponse.data.patients || [] : [];

      // Fetch lab tests and results for patients in visits
      const visitsWithLabTests = await Promise.all(
        (visitsData || []).map(async (visit) => {
          let labTests = [];
          let allCompletedTests = [];
          let prescriptions = [];

          try {
            console.log('Fetching lab tests for patient:', visit.patient?.id, visit.patient?.full_name);

            const labTestsResponse = await api.get(`/labs?patient_id=${visit.patient?.id}`);
            
            if (!labTestsResponse.data.error) {
              labTests = labTestsResponse.data.labTests || [];
            }

            console.log('Lab tests found for patient:', visit.patient?.id, labTests.length);

            // Don't fetch completed tests separately - they're already in labTests
            // This was causing double counting (e.g., 1 test showing as "2 tests")
            allCompletedTests = []; // Keep empty to avoid duplication

            console.log('Fetching prescriptions for patient:', visit.patient?.id, visit.patient?.full_name);

            const prescriptionsResponse = await api.get(`/prescriptions?patient_id=${visit.patient?.id}`);
            
            if (prescriptionsResponse.status === 200) {
              prescriptions = prescriptionsResponse.data.prescriptions || [];
            }

            console.log('Prescriptions found for patient:', visit.patient?.id, prescriptions.length);

          } catch (error) {
            console.error('Error fetching data for patient:', visit.patient?.id, error);
          }

          return {
            ...visit,
            labTests,
            allCompletedLabTests: allCompletedTests,
            prescriptions
          };
        })
      );

      // Calculate stats - use local date to avoid timezone issues
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const todayAppointments = appointmentsData?.filter(a => {
        // Extract date from appointment_date using local time to avoid timezone shifts
        let aptDate = '';
        if (a.appointment_date instanceof Date) {
          const d = a.appointment_date;
          aptDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        } else if (typeof a.appointment_date === 'string') {
          // Parse the date string in local time
          const d = new Date(a.appointment_date);
          aptDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        return aptDate === today;
      }).length || 0;

      // Filter out visits that shouldn't be in doctor queue
      // Only show visits where:
      // 1. current_stage is 'doctor'
      // 2. doctor_status is NOT 'Completed' (includes 'Pending', 'In Consultation', 'Pending Review', null)
      // 3. overall_status is 'Active'
      // This filtering ensures that:
      // - New patients appear in the queue
      // - Patients in consultation stay in the queue even after refresh
      // - Patients returning from lab ONLY appear if their consultation is not yet complete
      const activeVisits = visitsWithLabTests.filter(visit => 
        visit.current_stage === 'doctor' && 
        visit.doctor_status !== 'Completed' &&
        visit.overall_status === 'Active'
      );

      // Deduplicate visits by ID (in case API returns duplicates)
      const uniqueVisits = activeVisits.filter((visit, index, self) =>
        index === self.findIndex(v => v.id === visit.id)
      );

      console.log('Filtered visits:', {
        total: visitsWithLabTests.length,
        active: activeVisits.length,
        duplicates: activeVisits.length - uniqueVisits.length,
        filtered_out: visitsWithLabTests.length - activeVisits.length
      });

      setPendingVisits(uniqueVisits);
      setAppointments(appointmentsData || []);
      setPatients(patientsData || []);
      
      // Fetch completed visits for "Today's Patients" section
      let completedVisitsData = [];
      try {
        const completedResponse = await api.get(`/visits?doctor_status=Completed&limit=50`);
        if (completedResponse.status === 200) {
          completedVisitsData = completedResponse.data.visits || [];
          setCompletedVisits(completedVisitsData);
        }
      } catch (error) {
        console.error('Error fetching completed visits:', error);
        setCompletedVisits([]);
      }
      
      setStats({
        totalAppointments: appointmentsData?.length || 0,
        todayAppointments: todayAppointments.length,
        totalPatients: totalPatientsCount,
        pendingConsultations: activeVisits.length
      });
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      console.error('Error details:', {
        message: error.message,
        // Removed error.code, error.details, error.hint as they may not exist on standard Error objects
      });

      // Set empty data to prevent crashes
      setPendingVisits([]);
      setAppointments([]);
      setPatients([]);
      setStats({
        totalAppointments: 0,
        todayAppointments: 0,
        totalPatients: 0,
        pendingConsultations: 0,
      });

      toast.error(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsInitialLoad(false);
    }
  };

  // Fetch data when component mounts or user changes
  useEffect(() => {
    if (!user?.id) return;
    
    // Initial load - show loading spinner
    fetchData(true);

    // Smart polling - only when tab is active
    let pollInterval: NodeJS.Timeout | null = null;
    let isTabActive = true;

    const handleVisibilityChange = () => {
      isTabActive = !document.hidden;
      
      if (isTabActive) {
        // Tab became active - fetch fresh data (no loading spinner)
        fetchData(false);
        // Resume polling
        if (!pollInterval) {
          pollInterval = setInterval(() => {
            if (isTabActive) {
              fetchData(false); // Background update
            }
          }, 60000); // Poll every 60 seconds when active
        }
      } else {
        // Tab became inactive - stop polling to save resources
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      }
    };

    // Set up visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start polling (only when tab is active)
    pollInterval = setInterval(() => {
      if (isTabActive) {
        fetchData(false); // Background update - no loading spinner
      }
    }, 60000); // Poll every 60 seconds

    // Cleanup
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]);

  // Show skeleton on initial load for better LCP
  if (isInitialLoad || (loading && appointments.length === 0)) {
    return <DashboardSkeleton />;
  }

  return (
    <DashboardLayout title="Doctor Dashboard">
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

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <CalendarIcon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.todayAppointments}</div>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <Activity className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.totalAppointments}</div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Consultations</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.pendingConsultations}</div>
              <p className="text-xs text-muted-foreground">Waiting for doctor</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground mt-1">Total registered patients</p>
            </CardContent>
          </Card>
        </div>


        {/* Lab Results Modal */}
        <Dialog open={showLabResults} onOpenChange={setShowLabResults}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lab Test Results</DialogTitle>
              <DialogDescription>
                Review all lab test results for your patients
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="all">All Tests</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                {selectedLabTests.length > 0 ? (
                  selectedLabTests.map((test) => (
                    <div key={`all-${test.id}`} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{test.test_name}</h4>
                          <p className="text-sm text-muted-foreground">{test.test_type}</p>
                        </div>
                        <Badge variant={test.status === 'Completed' ? 'default' : 'secondary'}>
                          {test.status}
                        </Badge>
                      </div>
                      
                      {test.lab_results?.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <h5 className="text-sm font-medium">Results:</h5>
                          <div className="space-y-2">
                            {test.lab_results.map((result: any) => (
                              <div key={result.id} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                                <span className="font-medium">{result.result_value} {result.unit}</span>
                                <div className="flex items-center gap-2">
                                  {result.reference_range && (
                                    <span className="text-muted-foreground text-xs">
                                      Ref: {result.reference_range}
                                    </span>
                                  )}
                                  {result.abnormal_flag && (
                                    <Badge variant="destructive" className="text-xs">
                                      Abnormal
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No lab test results available
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="completed" className="space-y-4">
                {selectedLabTests.filter(t => t.status === 'Completed').length > 0 ? (
                  selectedLabTests
                    .filter(t => t.status === 'Completed')
                    .map((test) => (
                      <div key={`completed-${test.id}`} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{test.test_name}</h4>
                            <p className="text-sm text-muted-foreground">{test.test_type}</p>
                          </div>
                          <Badge>Completed</Badge>
                        </div>
                        {/* Results display same as above */}
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No completed lab tests
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="pending" className="space-y-4">
                {selectedLabTests.filter(t => t.status !== 'Completed').length > 0 ? (
                  selectedLabTests
                    .filter(t => t.status !== 'Completed')
                    .map((test) => (
                      <div key={`pending-${test.id}`} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{test.test_name}</h4>
                            <p className="text-sm text-muted-foreground">{test.test_type}</p>
                          </div>
                          <Badge variant="secondary">{test.status}</Badge>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending lab tests
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Prescriptions Modal */}
        <Dialog open={showPrescriptions} onOpenChange={setShowPrescriptions}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Patient Prescriptions</DialogTitle>
              <DialogDescription>
                Review all prescriptions for your patients
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="all">All Prescriptions</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                {selectedPrescriptions.length > 0 ? (
                  selectedPrescriptions.map((prescription) => (
                    <div key={`all-${prescription.id}`} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{prescription.medication_name}</h4>
                          <div className="text-sm text-muted-foreground">
                            {prescription.medications && (
                              <span>{prescription.medications.strength} {prescription.medications.dosage_form} • </span>
                            )}
                            <span>Prescribed: {format(new Date(prescription.prescribed_date), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                        <Badge variant={prescription.status === 'Active' ? 'default' : 'secondary'}>
                          {prescription.status}
                        </Badge>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div><strong>Dosage:</strong> {prescription.dosage}</div>
                        <div><strong>Frequency:</strong> {prescription.frequency}</div>
                        <div><strong>Duration:</strong> {prescription.duration}</div>
                        <div><strong>Quantity:</strong> {prescription.quantity}</div>
                      </div>
                      
                      {prescription.instructions && (
                        <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 text-sm">
                          <strong>Instructions:</strong> {prescription.instructions}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No prescriptions found
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="active" className="space-y-4">
                {selectedPrescriptions.filter(p => p.status === 'Active').length > 0 ? (
                  selectedPrescriptions
                    .filter(p => p.status === 'Active')
                    .map((prescription) => (
                      <div key={`active-${prescription.id}`} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{prescription.medication_name}</h4>
                            <div className="text-sm text-muted-foreground">
                              {prescription.medications && (
                                <span>{prescription.medications.strength} {prescription.medications.dosage_form} • </span>
                              )}
                              <span>Prescribed: {format(new Date(prescription.prescribed_date), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>
                          <Badge>Active</Badge>
                        </div>
                        {/* Prescription details same as above */}
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No active prescriptions
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="completed" className="space-y-4">
                {selectedPrescriptions.filter(p => p.status === 'Completed').length > 0 ? (
                  selectedPrescriptions
                    .filter(p => p.status === 'Completed')
                    .map((prescription) => (
                      <div key={`rx-completed-${prescription.id}`} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{prescription.medication_name}</h4>
                            <div className="text-sm text-muted-foreground">
                              {prescription.medications && (
                                <span>{prescription.medications.strength} {prescription.medications.dosage_form} • </span>
                              )}
                              <span>Prescribed: {format(new Date(prescription.prescribed_date), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>
                          <Badge variant="secondary">Completed</Badge>
                        </div>
                        {/* Prescription details same as above */}
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No completed prescriptions
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Lab Workflow Queue - Highlighted Section */}
        {pendingVisits.filter(v => 
          v.lab_completed_at && 
          !v.lab_results_reviewed && 
          v.doctor_status !== 'Completed' && 
          v.current_stage === 'doctor' &&
          v.overall_status === 'Active'
        ).length > 0 && (
          <Card className="shadow-lg border-green-300 bg-green-50/30">
            <CardHeader className="bg-green-100/50">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <FlaskConical className="h-5 w-5" />
                Lab Results Queue
                <Badge variant="default" className="bg-green-600">
                  {pendingVisits.filter(v => 
                    v.lab_completed_at && 
                    !v.lab_results_reviewed && 
                    v.doctor_status !== 'Completed' && 
                    v.current_stage === 'doctor' &&
                    v.overall_status === 'Active'
                  ).length} patient{pendingVisits.filter(v => 
                    v.lab_completed_at && 
                    !v.lab_results_reviewed && 
                    v.doctor_status !== 'Completed' && 
                    v.current_stage === 'doctor' &&
                    v.overall_status === 'Active'
                  ).length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
              <CardDescription className="text-green-700">
                Patients with new lab results waiting for doctor review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Lab Tests</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingVisits
                      .filter(visit => 
                        visit.lab_completed_at && 
                        !visit.lab_results_reviewed && 
                        visit.doctor_status !== 'Completed' && 
                        visit.current_stage === 'doctor' &&
                        visit.overall_status === 'Active'
                      )
                      .map((visit) => {
                        const labTestCount = visit.labTests?.length || 0;
                        const hasAbnormal = (visit.labTests || [])
                          .some((test: any) => test.lab_results?.some((r: any) => r.abnormal_flag));
                        
                        return (
                          <TableRow key={visit.id} className="hover:bg-green-50">
                            <TableCell>
                              <div>
                                <div className="font-medium">{visit.patient?.full_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {visit.patient?.gender} • {visit.patient?.blood_group || 'N/A'}
                                  {visit.patient?.allergies && (
                                    <span className="text-red-600 ml-2">⚠ Allergies</span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-green-50">
                                  {labTestCount} test{labTestCount !== 1 ? 's' : ''}
                                </Badge>
                                {hasAbnormal && (
                                  <Badge variant="destructive" className="text-xs">
                                    Abnormal
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {format(new Date(visit.lab_completed_at), 'MMM dd, HH:mm')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Pending Review
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewLabResults(
                                    visit.labTests || [],
                                    visit
                                  )}
                                  className="flex items-center gap-1"
                                >
                                  <Eye className="h-3 w-3" />
                                  View Results
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleWritePrescription(visit)}
                                  className="flex items-center gap-1"
                                >
                                  <Pill className="h-3 w-3" />
                                  Write Prescription
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {pendingVisits.filter(v => v.lab_completed_at && !v.lab_results_reviewed && v.doctor_status !== 'Completed').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          <FlaskConical className="h-12 w-12 mx-auto mb-2 opacity-30" />
                          <p>No lab results waiting for review</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          )}

        {/* Regular Pending Consultations (includes new patients and reviewed lab patients) */}
        {pendingVisits.filter(v => 
          (!v.lab_completed_at || v.lab_results_reviewed) && 
          v.doctor_status !== 'Completed' && 
          v.current_stage === 'doctor' &&
          v.overall_status === 'Active'
        ).length > 0 && (
          <Card className="shadow-lg border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Patients Waiting for Consultation
                <Badge variant="secondary" className="ml-auto">
                  {pendingVisits.filter(v => 
                    (!v.lab_completed_at || v.lab_results_reviewed) && 
                    v.doctor_status !== 'Completed' && 
                    v.current_stage === 'doctor' &&
                    v.overall_status === 'Active'
                  ).length} patient{pendingVisits.filter(v => 
                    (!v.lab_completed_at || v.lab_results_reviewed) && 
                    v.doctor_status !== 'Completed' && 
                    v.current_stage === 'doctor' &&
                    v.overall_status === 'Active'
                  ).length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
              <CardDescription>Patients ready for doctor consultation (includes reviewed lab results)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Age/Gender</TableHead>
                      <TableHead>Vitals</TableHead>
                      <TableHead>Lab Results</TableHead>
                      <TableHead>Arrival</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                {pendingVisits
                  .filter(visit => 
                    (!visit.lab_completed_at || visit.lab_results_reviewed) && 
                    visit.doctor_status !== 'Completed' && 
                    visit.current_stage === 'doctor' &&
                    visit.overall_status === 'Active'
                  )
                  .map((visit) => {
                    const hasLabResults = visit.labTests && visit.labTests.length > 0;
                    const hasAbnormal = hasLabResults && [...(visit.labTests || []), ...(visit.allCompletedLabTests || [])]
                      .some((test: any) => test.lab_results?.some((r: any) => r.abnormal_flag));
                    const age = visit.patient?.date_of_birth 
                      ? new Date().getFullYear() - new Date(visit.patient.date_of_birth).getFullYear()
                      : 'N/A';
                    
                    return (
                  <TableRow key={visit.id} className="hover:bg-blue-50/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{visit.patient?.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {visit.patient?.phone}
                          {visit.patient?.allergies && (
                            <span className="text-red-600 ml-2">⚠ Allergies</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{age} yrs / {visit.patient?.gender}</div>
                        <div className="text-xs text-muted-foreground">
                          {visit.patient?.blood_group || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        try {
                          // Parse vitals from nurse_notes (stored as JSON string)
                          const vitals = visit.nurse_notes ? JSON.parse(visit.nurse_notes) : null;
                          if (vitals && vitals.blood_pressure) {
                            return (
                              <div className="text-xs">
                                <div>BP: {vitals.blood_pressure}</div>
                                <div className="text-muted-foreground">
                                  HR: {vitals.heart_rate} | Temp: {vitals.temperature}°C
                                </div>
                              </div>
                            );
                          }
                        } catch (e) {
                          console.error('Error parsing vitals:', e);
                        }
                        return <span className="text-xs text-muted-foreground">No vitals</span>;
                      })()}
                    </TableCell>
                    <TableCell>
                      {hasLabResults ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                            {[...(visit.labTests || []), ...(visit.allCompletedLabTests || [])].length} test(s)
                          </Badge>
                          {hasAbnormal && (
                            <Badge variant="destructive" className="text-xs">
                              Abnormal
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No tests</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(visit.arrival_time || visit.created_at), 'HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {hasLabResults && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedVisit(visit);
                              handleViewLabResults([...(visit.labTests || []), ...(visit.allCompletedLabTests || [])], visit);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View Results
                          </Button>
                        )}
                        {!visit.doctor_notes ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStartConsultation(visit)}
                            className="flex items-center gap-1"
                          >
                            <Stethoscope className="h-3 w-3" />
                            Start Consultation
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="flex items-center gap-1 opacity-50"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Consultation Started
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOrderLabTests(visit)}
                          className="flex items-center gap-1"
                          disabled={!visit.doctor_notes}
                        >
                          <TestTube className="h-3 w-3" />
                          Order Lab Test
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                    );
                  })
                }
                  {pendingVisits.filter(v => 
                    (!v.lab_completed_at || v.lab_results_reviewed) && 
                    v.doctor_status !== 'Completed' && 
                    v.current_stage === 'doctor' &&
                    v.overall_status === 'Active'
                  ).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p>No patients waiting for consultation</p>
                      </TableCell>
                    </TableRow>
                  )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show message when no patients are waiting */}
        {pendingVisits.length === 0 && !loading && (
          <Card className="shadow-lg">
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No patients waiting for consultation</p>
                <p className="text-sm">Patients will appear here when they complete lab work or are ready for doctor consultation</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appointments */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>Your scheduled patient appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="today" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
              </TabsList>
              
              <TabsContent value="today" className="space-y-4">
                {appointments.filter(appt => 
                  isToday(new Date(appt.appointment_date))
                ).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments
                        .filter(appt => isToday(new Date(appt.appointment_date)))
                        .sort((a, b) => {
                          const timeA = new Date(`${a.appointment_date}T${a.appointment_time}`).getTime();
                          const timeB = new Date(`${b.appointment_date}T${b.appointment_time}`).getTime();
                          return timeA - timeB;
                        })
                        .map((appointment) => (
                          <TableRow key={appointment.id} className={getAppointmentRowClass(appointment)}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${getAppointmentDotClass(appointment)}`}></div>
                                {appointment.patient?.full_name || 'Unknown'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>
                                  {appointment.appointment_time 
                                    ? (() => {
                                        try {
                                          return format(new Date(`${appointment.appointment_date}T${appointment.appointment_time}`), 'h:mm a');
                                        } catch {
                                          return appointment.appointment_time;
                                        }
                                      })()
                                    : 'N/A'
                                  }
                                </span>
                                {getAppointmentStatusBadge(appointment)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getAppointmentBadgeVariant(appointment.status)}>
                                {appointment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {handleAppointmentAction(appointment)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No appointments scheduled for today
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="week" className="space-y-4">
                {appointments.filter(appt => {
                  const { start, end } = getCurrentWeekRange();
                  const apptDate = new Date(appt.appointment_date);
                  return apptDate >= start && apptDate <= end;
                }).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments
                        .filter(appt => {
                          const { start, end } = getCurrentWeekRange();
                          const apptDate = new Date(appt.appointment_date);
                          return apptDate >= start && apptDate <= end;
                        })
                        .sort((a, b) => {
                          const timeA = new Date(`${a.appointment_date}T${a.appointment_time}`).getTime();
                          const timeB = new Date(`${b.appointment_date}T${b.appointment_time}`).getTime();
                          return timeA - timeB;
                        })
                        .map((appointment) => (
                          <TableRow key={appointment.id} className={getAppointmentRowClass(appointment)}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${getAppointmentDotClass(appointment)}`}></div>
                                {appointment.patient?.full_name || 'Unknown'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>
                                  {appointment.appointment_time 
                                    ? (() => {
                                        try {
                                          return format(new Date(`${appointment.appointment_date}T${appointment.appointment_time}`), 'MMM d, h:mm a');
                                        } catch {
                                          return `${appointment.appointment_date} ${appointment.appointment_time}`;
                                        }
                                      })()
                                    : 'N/A'
                                  }
                                </span>
                                {getAppointmentStatusBadge(appointment)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {appointment.department?.name || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant={getAppointmentBadgeVariant(appointment.status)}>
                                  {appointment.status}
                                </Badge>
                                {appointment.status === 'Confirmed' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-6 text-xs"
                                    onClick={() => updateAppointmentStatus(appointment.id, 'Completed')}
                                  >
                                    Done
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No appointments scheduled for this week
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Patients by Day */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Today's Patients</CardTitle>
                <CardDescription>Patients seen today</CardDescription>
              </div>
              {user?.user_metadata?.role === 'admin' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    // Use React Router navigation instead of window.location
                    // This prevents page reload
                    toast.info('Navigate to Patients page');
                  }}
                >
                  View All Patients
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="today" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
              </TabsList>
              
              <TabsContent value="today" className="space-y-4">
                {completedVisits.filter(visit => 
                  isToday(new Date(visit.created_at))
                ).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Visit Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Stage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedVisits
                        .filter(visit => 
                          isToday(new Date(visit.created_at))
                        )
                        .map((visit) => (
                          <TableRow key={visit.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${
                                  visit.doctor_status === 'Completed' ? 'bg-green-500' :
                                  visit.doctor_status === 'In Progress' ? 'bg-blue-500' :
                                  'bg-yellow-500'
                                }`}></div>
                                {visit.patient?.full_name || 'Unknown'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(visit.created_at), 'h:mm a')}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                visit.doctor_status === 'Completed' ? 'default' :
                                visit.doctor_status === 'In Progress' ? 'secondary' :
                                'outline'
                              }>
                                {visit.doctor_status || 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {visit.current_stage}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No patients visited today
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="yesterday" className="space-y-4">
                {completedVisits.filter(visit => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  return (
                    new Date(visit.created_at).toDateString() === yesterday.toDateString()
                  );
                }).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Visit Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Stage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedVisits
                        .filter(visit => {
                          const yesterday = new Date();
                          yesterday.setDate(yesterday.getDate() - 1);
                          return (
                            new Date(visit.created_at).toDateString() === yesterday.toDateString()
                          );
                        })
                        .map((visit) => (
                          <TableRow key={visit.id}>
                            <TableCell className="font-medium">
                              {visit.patient?.full_name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {format(new Date(visit.created_at), 'h:mm a')}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                visit.doctor_status === 'Completed' ? 'default' :
                                visit.doctor_status === 'In Progress' ? 'secondary' :
                                'outline'
                              }>
                                {visit.doctor_status || 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {visit.current_stage}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No patients visited yesterday
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="week" className="space-y-4">
                {completedVisits.filter(visit => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(visit.created_at) > weekAgo;
                }).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Visit Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Stage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedVisits
                        .filter(visit => {
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return new Date(visit.created_at) > weekAgo;
                        })
                        .sort((a, b) => 
                          new Date(b.created_at).getTime() - 
                          new Date(a.created_at).getTime()
                        )
                        .map((visit) => (
                          <TableRow key={visit.id}>
                            <TableCell className="font-medium">
                              {visit.patient?.full_name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {format(new Date(visit.created_at), 'MMM d, h:mm a')}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                visit.doctor_status === 'Completed' ? 'default' :
                                visit.doctor_status === 'In Progress' ? 'secondary' :
                                'outline'
                              }>
                                {visit.doctor_status || 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {visit.current_stage}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No patients visited this week
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    

      {/* Reschedule Appointment Dialog */}
      <Dialog open={showRescheduleForm} onOpenChange={setShowRescheduleForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new date and time for this appointment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !rescheduleDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {rescheduleDate ? (
                        format(rescheduleDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={rescheduleDate}
                      onSelect={(date) => date && setRescheduleDate(date)}
                      defaultMonth={rescheduleDate || new Date()}
                      disabled={(date) => 
                        date < new Date() || date > addDays(new Date(), 30)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Time</label>
                <Select 
                  value={rescheduleTime} 
                  onValueChange={setRescheduleTime}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateTimeSlots().map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Reason for Rescheduling (Optional)
                </label>
                <Textarea
                  placeholder="Enter the reason for rescheduling..."
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRescheduleForm(false);
                setSelectedAppointment(null);
              }}
              disabled={isRescheduling}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRescheduleAppointment}
              disabled={!rescheduleDate || !rescheduleTime || isRescheduling}
            >
              {isRescheduling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Reschedule Appointment'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Consultation Dialog */}
      <Dialog open={showConsultationDialog} onOpenChange={setShowConsultationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Consultation Notes</DialogTitle>
            <DialogDescription>
              Record consultation notes for {selectedVisit?.patient?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="diagnosis">Diagnosis *</Label>
              <Textarea
                id="diagnosis"
                placeholder="Enter diagnosis..."
                value={consultationForm.diagnosis}
                onChange={(e) => setConsultationForm({...consultationForm, diagnosis: e.target.value})}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="notes">Consultation Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter consultation notes..."
                value={consultationForm.notes}
                onChange={(e) => setConsultationForm({...consultationForm, notes: e.target.value})}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="treatment_plan">Treatment Plan</Label>
              <Textarea
                id="treatment_plan"
                placeholder="Enter treatment plan..."
                value={consultationForm.treatment_plan}
                onChange={(e) => setConsultationForm({...consultationForm, treatment_plan: e.target.value})}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConsultationDialog(false)}>
                Cancel
              </Button>
              <Button onClick={submitConsultation}>
                Save Consultation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lab Test Order Dialog */}
      <Dialog open={showLabTestDialog} onOpenChange={setShowLabTestDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Lab Tests</DialogTitle>
            <DialogDescription>
              Select lab tests to order for {selectedVisit?.patient?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Tests *</Label>
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
                {availableLabTests.length > 0 ? (
                  availableLabTests.map((test) => (
                    <div key={test.id} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id={`test-${test.id}`}
                        checked={labTestForm.selectedTests.includes(test.id)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setLabTestForm(prev => ({
                            ...prev,
                            selectedTests: isChecked
                              ? [...prev.selectedTests, test.id]
                              : prev.selectedTests.filter(id => id !== test.id)
                          }));
                        }}
                        className="mt-1"
                      />
                      <label htmlFor={`test-${test.id}`} className="flex-1 cursor-pointer">
                        <div className="font-medium">{test.test_name}</div>
                        <div className="text-sm text-muted-foreground">{test.test_type}</div>
                        {test.description && (
                          <div className="text-xs text-muted-foreground">{test.description}</div>
                        )}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No lab tests available</p>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {labTestForm.selectedTests.length} test(s)
              </p>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={labTestForm.priority} onValueChange={(value) => setLabTestForm(prev => ({...prev, priority: value}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="STAT">STAT (Immediate)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lab_notes">Notes</Label>
              <Textarea
                id="lab_notes"
                placeholder="Additional notes for lab..."
                value={labTestForm.notes}
                onChange={(e) => setLabTestForm(prev => ({...prev, notes: e.target.value}))}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLabTestDialog(false)}>
                Cancel
              </Button>
              <Button onClick={submitLabTestOrder} disabled={labTestForm.selectedTests.length === 0}>
                Order {labTestForm.selectedTests.length} Test(s)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prescription Dialog */}
      <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Write Prescription</DialogTitle>
            <DialogDescription>
              Write a prescription for {selectedVisit?.patient?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Medication Selection with Checkboxes */}
            <div className="space-y-2">
              <Label>Select Medications * (Check only what patient needs)</Label>
              <p className="text-xs text-muted-foreground">Select medications to prescribe, then fill in details for each one below</p>
              <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                {availableMedications.map((med) => (
                  <div key={med.id} className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id={`med-${med.id}`}
                      checked={selectedMedications.includes(med.id)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        if (isChecked) {
                          setSelectedMedications(prev => [...prev, med.id]);
                          setPrescriptionForms(prev => ({
                            ...prev,
                            [med.id]: {
                              dosage: '',
                              frequency: '',
                              duration: '',
                              quantity: '',
                              instructions: ''
                            }
                          }));
                        } else {
                          setSelectedMedications(prev => prev.filter(id => id !== med.id));
                          setPrescriptionForms(prev => {
                            const newForms = { ...prev };
                            delete newForms[med.id];
                            return newForms;
                          });
                        }
                      }}
                      className="mt-1"
                    />
                    <label htmlFor={`med-${med.id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{med.name}</span>
                        {med.stock_quantity === 0 && (
                          <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                        )}
                        {med.stock_quantity > 0 && med.stock_quantity < 10 && (
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300">Low Stock</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {med.strength && `${med.strength} `}
                        {med.dosage_form && `(${med.dosage_form})`}
                        {med.stock_quantity !== undefined && ` • Stock: ${med.stock_quantity}`}
                        {med.quantity_in_stock !== undefined && ` • Stock: ${med.quantity_in_stock}`}
                      </div>
                      {med.stock_quantity === 0 && (
                        <p className="text-xs text-red-600 mt-1">⚠ Pharmacy will need to substitute this medication</p>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Forms for each selected medication */}
            {selectedMedications.map((medId) => {
              const med = availableMedications.find(m => m.id === medId);
              const form = prescriptionForms[medId] || {};
              
              return (
                <Card key={medId} className="p-4 bg-blue-50/50">
                  <h4 className="font-semibold mb-3 text-blue-900">{med?.name}</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`dosage-${medId}`}>Dosage *</Label>
                        <Input
                          id={`dosage-${medId}`}
                          placeholder="e.g., 500mg"
                          value={form.dosage || ''}
                          onChange={(e) => setPrescriptionForms(prev => ({
                            ...prev,
                            [medId]: { ...form, dosage: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`frequency-${medId}`}>Frequency *</Label>
                        <Input
                          id={`frequency-${medId}`}
                          placeholder="e.g., Twice daily"
                          value={form.frequency || ''}
                          onChange={(e) => setPrescriptionForms(prev => ({
                            ...prev,
                            [medId]: { ...form, frequency: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`duration-${medId}`}>Duration *</Label>
                        <Input
                          id={`duration-${medId}`}
                          placeholder="e.g., 7 days"
                          value={form.duration || ''}
                          onChange={(e) => setPrescriptionForms(prev => ({
                            ...prev,
                            [medId]: { ...form, duration: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`quantity-${medId}`}>Quantity</Label>
                        <Input
                          id={`quantity-${medId}`}
                          placeholder="e.g., 14"
                          value={form.quantity || ''}
                          onChange={(e) => setPrescriptionForms(prev => ({
                            ...prev,
                            [medId]: { ...form, quantity: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`instructions-${medId}`}>Instructions</Label>
                      <Textarea
                        id={`instructions-${medId}`}
                        placeholder="e.g., Take with food"
                        value={form.instructions || ''}
                        onChange={(e) => setPrescriptionForms(prev => ({
                          ...prev,
                          [medId]: { ...form, instructions: e.target.value }
                        }))}
                        rows={2}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
            <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-white">
              <Button variant="outline" onClick={() => setShowPrescriptionDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={submitPrescription}
                disabled={selectedMedications.length === 0}
              >
                Write {selectedMedications.length} Prescription{selectedMedications.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Appointment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Patient</Label>
                <p className="font-medium">{selectedAppointment?.patient?.full_name || 'Unknown'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div><Badge variant={getAppointmentBadgeVariant(selectedAppointment?.status)}>{selectedAppointment?.status}</Badge></div>
              </div>
              <div>
                <Label className="text-muted-foreground">Date & Time</Label>
                <p className="font-medium">
                  {selectedAppointment?.appointment_date && format(new Date(selectedAppointment.appointment_date), 'PPP p')}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Doctor</Label>
                <p className="font-medium">{selectedAppointment?.doctor?.full_name || 'Not assigned'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Department</Label>
                <p className="font-medium">{selectedAppointment?.department?.name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <p className="font-medium">{selectedAppointment?.type || 'Consultation'}</p>
              </div>
            </div>
            
            {selectedAppointment?.reason && (
              <div>
                <Label className="text-muted-foreground">Reason for Visit</Label>
                <p className="mt-1">{selectedAppointment.reason}</p>
              </div>
            )}
            
            {selectedAppointment?.notes && (
              <div>
                <Label className="text-muted-foreground">Notes</Label>
                <p className="mt-1 p-3 bg-muted rounded-lg">{selectedAppointment.notes}</p>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Appointment Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Appointment</DialogTitle>
            <DialogDescription>
              Patient: {appointmentToComplete?.patient?.full_name || 'Unknown'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Please enter consultation notes before completing this appointment. 
                These notes are required for medical records.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="completion_notes">Consultation Notes *</Label>
              <Textarea
                id="completion_notes"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Enter diagnosis, treatment plan, prescriptions given, follow-up instructions, etc."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters required
              </p>
            </div>

            <div className="space-y-3">
              <Label>What happens next?</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="discharge"
                    name="nextAction"
                    value="discharge"
                    checked={nextAction === 'discharge'}
                    onChange={(e) => setNextAction(e.target.value as 'discharge' | 'lab' | 'pharmacy')}
                  />
                  <Label htmlFor="discharge" className="cursor-pointer">
                    <span className="font-medium text-green-700">Discharge Patient</span>
                    <span className="block text-xs text-muted-foreground">Patient can go home - no further treatment needed</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="lab"
                    name="nextAction"
                    value="lab"
                    checked={nextAction === 'lab'}
                    onChange={(e) => setNextAction(e.target.value as 'discharge' | 'lab' | 'pharmacy')}
                  />
                  <Label htmlFor="lab" className="cursor-pointer">
                    <span className="font-medium text-blue-700">Send to Lab</span>
                    <span className="block text-xs text-muted-foreground">Patient needs lab tests</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="pharmacy"
                    name="nextAction"
                    value="pharmacy"
                    checked={nextAction === 'pharmacy'}
                    onChange={(e) => setNextAction(e.target.value as 'discharge' | 'lab' | 'pharmacy')}
                  />
                  <Label htmlFor="pharmacy" className="cursor-pointer">
                    <span className="font-medium text-purple-700">Send to Pharmacy</span>
                    <span className="block text-xs text-muted-foreground">Patient needs medications</span>
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCompleteDialog(false);
                  setAppointmentToComplete(null);
                  setCompletionNotes('');
                  setNextAction('discharge');
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  if (nextAction === 'lab') {
                    // Save completion notes first, then open lab test order form
                    setIsCompletingWithAction(true);
                    setShowCompleteDialog(false);
                    
                    // Save notes to appointment
                    await api.put(`/appointments/${appointmentToComplete.id}`, {
                      notes: completionNotes
                    });
                    
                    // Create a visit-like object for lab tests
                    // Note: appointment might not have a visit, so we use appointment data
                    const visit = {
                      id: null, // No visit ID - this is direct from appointment
                      appointment_id: appointmentToComplete?.id,
                      patient_id: appointmentToComplete?.patient_id,
                      patient: appointmentToComplete?.patient,
                      doctor_notes: completionNotes
                    };
                    handleOrderLabTests(visit);
                  } else if (nextAction === 'pharmacy') {
                    // Save completion notes first, then open prescription form
                    setIsCompletingWithAction(true);
                    setShowCompleteDialog(false);
                    
                    // Save notes to appointment
                    await api.put(`/appointments/${appointmentToComplete.id}`, {
                      notes: completionNotes
                    });
                    
                    // Create a visit-like object for prescription
                    // Note: appointment might not have a visit, so we use appointment data
                    const visit = {
                      id: null, // No visit ID - this is direct from appointment
                      appointment_id: appointmentToComplete?.id,
                      patient_id: appointmentToComplete?.patient_id,
                      patient: appointmentToComplete?.patient,
                      doctor_notes: completionNotes
                    };
                    handleWritePrescription(visit);
                  } else {
                    // Discharge - complete immediately
                    confirmCompleteAppointment();
                  }
                }}
                disabled={loading || completionNotes.trim().length < 10}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : nextAction === 'lab' ? (
                  'Order Lab Tests'
                ) : nextAction === 'pharmacy' ? (
                  'Write Prescription'
                ) : (
                  'Complete & Discharge'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
