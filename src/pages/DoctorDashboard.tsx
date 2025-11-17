import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
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
  const [stats, setStats] = useState({ totalAppointments: 0, todayAppointments: 0, totalPatients: 0, pendingConsultations: 0 });
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
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
      
      toast.success('Appointment started successfully');
    } catch (error) {
      console.error('Error starting appointment:', error);
      toast.error('Failed to start appointment');
    } finally {
      setLoading(false);
    }
  };

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState<any>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [nextAction, setNextAction] = useState<'discharge' | 'lab' | 'pharmacy'>('discharge');

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
      setLoading(true);
      
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

      // Update local state
      setAppointments(prev => 
        prev.map(a => 
          a.id === appointmentToComplete.id 
            ? { ...a, status: 'Completed', notes: completionNotes } 
            : a
        )
      );
      
      setShowCompleteDialog(false);
      setAppointmentToComplete(null);
      setCompletionNotes('');
      setNextAction('discharge');
      
      // Refresh data
      fetchData();
    } catch (error: any) {
      console.error('Error completing appointment:', error);
      toast.error(error.response?.data?.error || 'Failed to complete appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointment: any) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setLoading(true);
      // Update appointment status to 'cancelled' to match database enum
      const response = await api.put(`/appointments/${appointment.id}`, { 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      });

      if (response.status !== 200) throw new Error('Failed to update appointment');

      // Update local state with the correct status value
      setAppointments(prev => 
        prev.map(a => 
          a.id === appointment.id 
            ? { ...a, status: 'cancelled' } 
            : a
        )
      );
      
      toast.success('Appointment cancelled successfully');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    } finally {
      setLoading(false);
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

    // Check if appointment time has arrived (allow starting 5 minutes before scheduled time)
    // Use currentTime state to ensure re-render when time changes
    const canStartAppointment = () => {
      if (!appointment.appointment_date) {
        console.log('Missing appointment date');
        return false;
      }
      
      try {
        // The appointment_date from backend is already a full datetime
        // Check if it's already an ISO string with time, or if we need to append time
        let appointmentDateTime;
        
        if (appointment.appointment_date.includes('T') && appointment.appointment_date.length > 10) {
          // It's already a full datetime string (e.g., '2025-11-16T21:00:00.000Z')
          appointmentDateTime = new Date(appointment.appointment_date);
        } else if (appointment.appointment_time) {
          // It's just a date, append the time
          appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
        } else {
          console.log('Cannot determine appointment time');
          return false;
        }
        
        const now = currentTime;
        const fiveMinutesBefore = new Date(appointmentDateTime.getTime() - 5 * 60 * 1000);
        
        const canStart = now >= fiveMinutesBefore;
        
        // Debug logging (only when button is disabled)
        if (!canStart) {
          const minutesUntil = Math.ceil((fiveMinutesBefore.getTime() - now.getTime()) / (1000 * 60));
          console.log(`${appointment.patient?.full_name}: Cannot start yet. ${minutesUntil} minutes until start time.`);
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
    }, 30000); // Check every 30 seconds for better responsiveness
    
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

  // Fetch available lab tests
  const fetchAvailableLabTests = useCallback(async () => {
    try {
      const response = await api.get('/labs');
      if (response.data.error) throw new Error(response.data.error);
      setAvailableLabTests(response.data.labTests || []);
    } catch (error: any) {
      console.error('Error fetching lab tests:', error);
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
    } catch (error) {
      console.error('Error submitting consultation:', error);
      toast.error('Failed to submit consultation');
    } finally {
      setSelectedVisit(null);
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
        
        // Set up polling every 30 seconds
        pollTimer = setInterval(() => {
          if (isMounted) {
            fetchAppointments();
          }
        }, 30000);
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
    setSelectedLabTests(tests);
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
    setSelectedPrescriptions(prescriptions);
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
    
    // Fetch available lab tests from catalog, or use predefined list
    try {
      const response = await api.get('/labs');
      
      if (response.data.error) {
        console.warn('Lab test catalog not found, using predefined list');
        // Use predefined list if catalog doesn't exist
        const predefinedTests = [
          { id: 'cbc', test_name: 'Complete Blood Count (CBC)', test_type: 'Hematology', description: 'Measures blood components' },
          { id: 'glucose', test_name: 'Blood Glucose (Fasting)', test_type: 'Chemistry', description: 'Measures blood sugar' },
          { id: 'lipid', test_name: 'Lipid Panel', test_type: 'Chemistry', description: 'Cholesterol and triglycerides' },
          { id: 'lft', test_name: 'Liver Function Test', test_type: 'Chemistry', description: 'Evaluates liver health' },
          { id: 'kft', test_name: 'Kidney Function Test', test_type: 'Chemistry', description: 'Evaluates kidney health' },
          { id: 'urinalysis', test_name: 'Urinalysis', test_type: 'Urinalysis', description: 'Examines urine' },
          { id: 'thyroid', test_name: 'Thyroid Function Test', test_type: 'Endocrinology', description: 'Thyroid hormones' },
          { id: 'hba1c', test_name: 'Hemoglobin A1C', test_type: 'Chemistry', description: '3-month blood sugar average' },
          { id: 'electrolytes', test_name: 'Electrolytes Panel', test_type: 'Chemistry', description: 'Sodium, potassium, chloride' },
          { id: 'malaria', test_name: 'Malaria Test (RDT)', test_type: 'Microbiology', description: 'Rapid malaria test' },
          { id: 'xray', test_name: 'X-Ray Chest', test_type: 'Radiology', description: 'Chest X-ray' },
          { id: 'ultrasound', test_name: 'Ultrasound Abdomen', test_type: 'Radiology', description: 'Abdominal ultrasound' }
        ];
        setAvailableLabTests(predefinedTests);
      } else {
        setAvailableLabTests(response.data.labTests || []);
      }
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      toast.error('Failed to load lab tests');
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
            test_type: test.test_type,
            ordered_date: test.ordered_date,
            status: 'Ordered',
            priority: test.priority,
            instructions: test.notes
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

      // Update patient visit to lab stage
      const visitResponse = await api.put(`/visits/${selectedVisit.id}`, {
        current_stage: 'lab',
        lab_status: 'Pending',
        doctor_status: 'In Consultation',
        updated_at: new Date().toISOString()
      });

      if (visitResponse.status !== 200) {
        console.error('Visit update error:', visitResponse.statusText);
        throw new Error(`Failed to update patient visit: ${visitResponse.statusText}`);
      }

      toast.success(`${labTests.length} lab test(s) ordered successfully. Patient sent to lab.`);
      setShowLabTestDialog(false);
      
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
      // Create prescriptions for all selected medications
      const prescriptionsToInsert = selectedMedications.map(medId => {
        const form = prescriptionForms[medId];
        const med = availableMedications.find(m => m.id === medId);
        
        const quantity = parseInt(form.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(`Invalid quantity for ${med?.name || 'medication'}`);
        }
        
        return {
          patient_id: selectedVisit.patient_id,
          doctor_id: user?.id,
          medication_id: medId,
          medication_name: med?.name || '',
          dosage: form.dosage,
          frequency: form.frequency,
          duration: form.duration,
          quantity: quantity,
          instructions: form.instructions || null,
          status: 'Pending',
          prescribed_date: new Date().toISOString()
        };
      });

      const response = await api.post('/prescriptions', { prescriptions: prescriptionsToInsert });

      if (response.status !== 201) throw new Error('Failed to create prescriptions');

      // Log prescription creation
      // Note: We're removing the logActivity call as it's not part of the API
      console.log('Prescription creation logged', {
        doctor_id: user?.id,
        patient_id: selectedVisit.patient_id,
        visit_id: selectedVisit.id,
        prescription_count: selectedMedications.length,
        medications: prescriptionsToInsert.map(p => ({
          medication: p.medication_name,
          quantity: p.quantity,
          dosage: p.dosage
        }))
      });

      // After writing prescription, complete consultation and send to pharmacy
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

      // Note: We're removing the logActivity call as it's not part of the API
      console.log('Consultation completion logged', {
        doctor_id: user?.id,
        patient_id: selectedVisit.patient_id,
        visit_id: selectedVisit.id,
        next_stage: 'pharmacy'
      });

      toast.success(`${selectedMedications.length} prescription(s) written. Patient sent to pharmacy.`);
      setShowPrescriptionDialog(false);
      
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
    } catch (error) {
      console.error('Error writing prescription:', error);
      toast.error('Failed to write prescription');
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

  const fetchData = async () => {
    if (!user) {
      console.log('No user found, skipping data fetch');
      return;
    }

    console.log('Fetching doctor dashboard data for user:', user.id);
    setLoading(true);

    try {
      // Fetch visits waiting for doctor (including those from lab workflow)
      // Show ALL patients at doctor stage, not just assigned to this specific doctor
      // This includes:
      // 1. New patients from nurse (doctor_status = 'Pending' or 'In Consultation')
      // 2. Patients returning from lab ONLY if consultation is NOT complete
      // Note: We show all doctor-stage patients because doctor_id might not be set initially
      const visitsResponse = await api.get(`/visits?current_stage=doctor&overall_status=Active&doctor_status_neq=Completed`);
      
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



      // Fetch doctor's appointments
      const appointmentsResponse = await api.get(`/appointments?doctor_id=${user.id}`);
      
      if (appointmentsResponse.status !== 200) {
        console.error('Error fetching appointments:', appointmentsResponse.statusText);
        throw new Error(appointmentsResponse.statusText);
      }
      
      const appointmentsData = appointmentsResponse.data.appointments || [];
      console.log('Fetched appointments:', appointmentsData?.length || 0);

      // Fetch patients
      const patientsResponse = await api.get('/patients?limit=10&sort=created_at&order=desc');
      
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

            // Also get any completed lab tests regardless of completion date
            const completedTestsResponse = await api.get(`/labs?patient_id=${visit.patient?.id}&status=Completed`);
            
            if (!completedTestsResponse.data.error) {
              allCompletedTests = completedTestsResponse.data.labTests || [];
            }
            
            console.log('All completed lab tests for patient:', visit.patient?.id, allCompletedTests.length);

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
      // 2. doctor_status is NOT 'Completed' (this ensures patients from lab only show if consultation incomplete)
      // 3. overall_status is 'Active'
      // This filtering ensures that:
      // - New patients appear in the queue
      // - Patients returning from lab ONLY appear if their consultation is not yet complete
      const activeVisits = visitsWithLabTests.filter(visit => 
        visit.current_stage === 'doctor' && 
        visit.doctor_status !== 'Completed' &&
        visit.overall_status === 'Active'
      );

      console.log('Filtered visits:', {
        total: visitsWithLabTests.length,
        active: activeVisits.length,
        filtered_out: visitsWithLabTests.length - activeVisits.length
      });

      setPendingVisits(activeVisits);
      setAppointments(appointmentsData || []);
      setPatients(patientsData || []);
      // Calculate unique patients from visits and appointments
      const uniquePatientIds = new Set([
        ...activeVisits.map(v => v.patient_id),
        ...appointmentsData.map(a => a.patient_id)
      ]);
      
      setStats({
        totalAppointments: appointmentsData?.length || 0,
        todayAppointments,
        totalPatients: uniquePatientIds.size,
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
    }
  };

  // Fetch data when component mounts or user changes
  useEffect(() => {
    if (!user?.id) return;
    
    fetchData();

    // Set up polling for data updates
    const pollTimer = setInterval(() => {
      fetchData();
    }, 30000); // Poll every 30 seconds

    // Cleanup polling on unmount
    return () => {
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, [user?.id]);

  if (loading) {
    return (
      <DashboardLayout title="Doctor Dashboard">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Doctor Dashboard">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
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
                    <div key={test.id} className="p-4 border rounded-lg">
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
                      <div key={test.id} className="p-4 border rounded-lg">
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
                      <div key={test.id} className="p-4 border rounded-lg">
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
                    <div key={prescription.id} className="p-4 border rounded-lg">
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
                      <div key={prescription.id} className="p-4 border rounded-lg">
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
                      <div key={prescription.id} className="p-4 border rounded-lg">
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
                        const labTestCount = (visit.labTests?.length || 0) + (visit.allCompletedLabTests?.length || 0);
                        const hasAbnormal = [...(visit.labTests || []), ...(visit.allCompletedLabTests || [])]
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
                                    [...(visit.labTests || []), ...(visit.allCompletedLabTests || [])],
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
                    const hasLabResults = (visit.labTests && visit.labTests.length > 0) || (visit.allCompletedLabTests && visit.allCompletedLabTests.length > 0);
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
                      {visit.nurse_vitals ? (
                        <div className="text-xs">
                          <div>BP: {visit.nurse_vitals.blood_pressure}</div>
                          <div className="text-muted-foreground">
                            HR: {visit.nurse_vitals.heart_rate} | Temp: {visit.nurse_vitals.temperature}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No vitals</span>
                      )}
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
                  onClick={() => window.location.href = '/patients'}
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
                {pendingVisits.filter(visit => 
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
                      {pendingVisits
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
                {pendingVisits.filter(visit => {
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
                      {pendingVisits
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
                {pendingVisits.filter(visit => {
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
                      {pendingVisits
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
                          if (e.target.checked) {
                            setLabTestForm({
                              ...labTestForm,
                              selectedTests: [...labTestForm.selectedTests, test.id]
                            });
                          } else {
                            setLabTestForm({
                              ...labTestForm,
                              selectedTests: labTestForm.selectedTests.filter(id => id !== test.id)
                            });
                          }
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
              <Select value={labTestForm.priority} onValueChange={(value) => setLabTestForm({...labTestForm, priority: value})}>
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
                onChange={(e) => setLabTestForm({...labTestForm, notes: e.target.value})}
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
                        if (e.target.checked) {
                          setSelectedMedications([...selectedMedications, med.id]);
                          setPrescriptionForms({
                            ...prescriptionForms,
                            [med.id]: {
                              dosage: '',
                              frequency: '',
                              duration: '',
                              quantity: '',
                              instructions: ''
                            }
                          });
                        } else {
                          setSelectedMedications(selectedMedications.filter(id => id !== med.id));
                          const newForms = { ...prescriptionForms };
                          delete newForms[med.id];
                          setPrescriptionForms(newForms);
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
                          onChange={(e) => setPrescriptionForms({
                            ...prescriptionForms,
                            [medId]: { ...form, dosage: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`frequency-${medId}`}>Frequency *</Label>
                        <Input
                          id={`frequency-${medId}`}
                          placeholder="e.g., Twice daily"
                          value={form.frequency || ''}
                          onChange={(e) => setPrescriptionForms({
                            ...prescriptionForms,
                            [medId]: { ...form, frequency: e.target.value }
                          })}
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
                          onChange={(e) => setPrescriptionForms({
                            ...prescriptionForms,
                            [medId]: { ...form, duration: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`quantity-${medId}`}>Quantity</Label>
                        <Input
                          id={`quantity-${medId}`}
                          placeholder="e.g., 14"
                          value={form.quantity || ''}
                          onChange={(e) => setPrescriptionForms({
                            ...prescriptionForms,
                            [medId]: { ...form, quantity: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`instructions-${medId}`}>Instructions</Label>
                      <Textarea
                        id={`instructions-${medId}`}
                        placeholder="e.g., Take with food"
                        value={form.instructions || ''}
                        onChange={(e) => setPrescriptionForms({
                          ...prescriptionForms,
                          [medId]: { ...form, instructions: e.target.value }
                        })}
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
                <p><Badge variant={getAppointmentBadgeVariant(selectedAppointment?.status)}>{selectedAppointment?.status}</Badge></p>
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
                onClick={confirmCompleteAppointment}
                disabled={loading || completionNotes.trim().length < 10}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  'Complete Appointment'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
