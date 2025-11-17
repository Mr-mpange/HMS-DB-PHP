'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { StatCard } from '@/components/StatCard';
import { AppointmentsCard } from '@/components/AppointmentsCard';
import { PatientsCard } from '@/components/PatientsCard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { logActivity } from '@/lib/utils';
import api from '@/lib/api';
import {
  Loader2,
  Building,
  Calendar,
  Clock,
  CheckCircle,
  Users,
  UserPlus,
  Phone,
  Clipboard,
  HeartHandshake,
  Plus,
  Stethoscope,
} from 'lucide-react';

export default function ReceptionistDashboard() {
  const { user } = useAuth();

  // State management
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<{
    todayAppointments: number;
    pendingAppointments: number;
    completedCheckins: number;
    totalPatients: number;
    nurseQueuePatients: number;
    receptionQueuePatients: number;
  }>({
    todayAppointments: 0,
    pendingAppointments: 0,
    completedCheckins: 0,
    totalPatients: 0,
    nurseQueuePatients: 0,
    receptionQueuePatients: 0,
  });
  
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showBookAppointmentDialog, setShowBookAppointmentDialog] = useState(false);

  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showReturningPatientDialog, setShowReturningPatientDialog] = useState(false);
  const [returningPatientSearch, setReturningPatientSearch] = useState('');
  const [returningPatientResults, setReturningPatientResults] = useState<any[]>([]);
  const [roleUpdateIndicator, setRoleUpdateIndicator] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showRegistrationPaymentDialog, setShowRegistrationPaymentDialog] = useState(false);
  const [selectedAppointmentForPayment, setSelectedAppointmentForPayment] = useState<any>(null);
  const [consultationFee, setConsultationFee] = useState(2000);
  const [departmentFees, setDepartmentFees] = useState<Record<string, number>>({});
  const [paymentForm, setPaymentForm] = useState({
    amount_paid: '',
    payment_method: 'Cash'
  });

  const [registerForm, setRegisterForm] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    blood_group: '',
    address: '',
  });
  
  const [registerWithAppointment, setRegisterWithAppointment] = useState(false);
  const [appointmentDepartmentId, setAppointmentDepartmentId] = useState<string>('');
  const [appointmentDoctorId, setAppointmentDoctorId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [appointmentTime, setAppointmentTime] = useState<string>('');
  const [appointmentReason, setAppointmentReason] = useState<string>('');
  const [departmentDoctors, setDepartmentDoctors] = useState<any[]>([]);

  const [appointmentForm, setAppointmentForm] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    appointment_type: 'Consultation',
    reason: '',
    department_id: '',
  });
  
  // Debug state changes
  // useEffect(() => {
  //   console.log('Appointments state updated. Count:', appointments.length, 'Appointments:', appointments);
  // }, [appointments]);
  
  // useEffect(() => {
  //   console.log('Departments state updated. Count:', departments.length, 'Departments:', departments);
  // }, [departments]);
  
  // useEffect(() => {
  //   console.log('Doctors state updated. Count:', doctors.length, 'Doctors:', doctors);
  // }, [doctors]);
  
  // useEffect(() => {
  //   console.log('Patients state updated. Count:', patients.length, 'Patients:', patients);
  // }, [patients]);

  // Load data when component mounts or user changes
  useEffect(() => {
    if (!user) return;
    
    fetchData();
    fetchConsultationFee();

    // Set up polling instead of real-time subscriptions (every 30 seconds)
    const intervalId = setInterval(() => {
      fetchData(false); // Background refresh without loading indicator
    }, 30000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [user]);

  const fetchData = async (showLoadingIndicator = true) => {
    if (!user) return;

    if (showLoadingIndicator) {
      setLoading(true);
    }
    try {
      const today = new Date().toISOString().split('T')[0];

      // First, get appointments with basic info (get all appointments for better data handling)
      const appointmentsRes = await api.get('/appointments?order=appointment_time.asc');
      const appointmentsBasic = appointmentsRes.data.appointments || [];

      // Fetch departments first
      const departmentsRes = await api.get('/departments?order=name');
      const departmentsData = departmentsRes.data.departments || [];

      // Then get doctor profiles for the appointments
      const doctorIds = [...new Set(appointmentsBasic?.map(apt => apt.doctor_id).filter(Boolean) || [])];

      let appointmentsData = appointmentsBasic || [];
      if (doctorIds.length > 0) {
        try {
          const doctorsRes = await api.get(`/users/profiles?ids=${doctorIds.join(',')}`);
          const doctorsData = doctorsRes.data.profiles || [];

          // Merge doctor and department information into appointments
          appointmentsData = (appointmentsBasic || []).map(apt => ({
            ...apt,
            doctor: doctorsData.find(doc => doc.id === apt.doctor_id) || null,
            department: departmentsData.find(dept => dept.id === apt.department_id) || null
          }));
        } catch (error) {
          console.warn('Could not fetch doctor profiles for appointments:', error);
          appointmentsData = appointmentsBasic || [];
        }
      }

      const patientsRes = await api.get('/patients?order=created_at.desc&limit=10');
      const patientsData = patientsRes.data.patients || [];

      // Fetch doctors - get profiles that have doctor role
      let doctorsData = [];
      try {
        // Fetch doctors using the public profiles endpoint
        const doctorsRes = await api.get('/users/profiles?role=doctor');
        doctorsData = doctorsRes.data.profiles || [];
        console.log('Found doctors:', doctorsData.length);
      } catch (error) {
        console.warn('Could not fetch doctors:', error);
        doctorsData = [];
      }

      // If still no doctors, try to create some sample doctor users
      if (!doctorsData || doctorsData.length === 0) {
        console.log('No doctors found, attempting to create sample doctors...');
        try {
          // Check if we have any profiles at all
          const profilesRes = await api.get('/users/profiles?limit=5');
          const allProfiles = profilesRes.data.profiles || [];

          if (allProfiles && allProfiles.length > 0) {
            // Assign doctor role to first few profiles for demo
            for (let i = 0; i < Math.min(3, allProfiles.length); i++) {
              const profile = allProfiles[i];
              await api.post('/users/roles', {
                user_id: profile.id,
                role: 'doctor'
              });
            }

            // Now fetch doctors again
            const rolesRes = await api.get('/users/roles?role=doctor');
            const newDoctors = rolesRes.data.roles || [];

            if (newDoctors && newDoctors.length > 0) {
              const doctorIds = newDoctors.map(dr => dr.user_id);
              const doctorsRes = await api.get(`/users/profiles?ids=${doctorIds.join(',')}`);
              const doctorProfiles = doctorsRes.data.profiles || [];
              doctorsData = doctorProfiles || [];
              console.log('Created and found sample doctors:', doctorsData.length);
            }
          }
        } catch (createError) {
          console.error('Failed to create sample doctors:', createError);
        }
      }

      // Fetch patient visits to get accurate workflow stats
      let patientVisits = [];
      try {
        const visitsRes = await api.get('/visits?overall_status=Active');
        patientVisits = visitsRes.data.visits || [];
      } catch (visitsError) {
        console.error('Error fetching patient visits:', visitsError);
      }

      // Ensure appointmentsData is an array before filtering
      const appointmentsArray = Array.isArray(appointmentsData) ? appointmentsData : [];
      
      const todayAppointments = appointmentsArray.filter(a => a.appointment_date === today).length;
      const pendingAppointments = appointmentsArray.filter(a => a.status === 'Scheduled').length;
      const confirmedAppointments = appointmentsArray.filter(a => a.status === 'Confirmed').length;

      // Calculate nurse queue patients (from new registrations)
      const nurseQueuePatients = patientVisits?.filter(v =>
        v.current_stage === 'nurse' && v.nurse_status === 'Pending'
      ).length || 0;

      // Calculate reception queue patients (from appointments waiting for check-in)
      const receptionQueuePatients = patientVisits?.filter(v =>
        v.current_stage === 'reception' && v.reception_status === 'Pending'
      ).length || 0;

      setAppointments(appointmentsArray);
      setPatients(patientsData || []);
      setDepartments(departmentsData || []);
      setDoctors(doctorsData || []);

      // Debug logging
      console.log('Dashboard data loaded:', {
        appointments: appointmentsData?.length || 0,
        patients: patientsData?.length || 0,
        departments: departmentsData?.length || 0,
        doctors: doctorsData?.length || 0,
        todayAppointments,
        pendingAppointments,
        confirmedAppointments,
        patientVisits: patientVisits?.length || 0,
        nurseQueuePatients,
        receptionQueuePatients
      });

      setStats({
        todayAppointments,
        pendingAppointments,
        completedCheckins: confirmedAppointments, // Confirmed appointments that were checked in
        totalPatients: patientsData?.length || 0,
        nurseQueuePatients,
        receptionQueuePatients,
      });
    } catch (error) {
      console.error('Error fetching receptionist data:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      // Set empty data to prevent crashes
      setAppointments([]);
      setPatients([]);
      setDepartments([]);
      setDoctors([]);
      setStats({
        todayAppointments: 0,
        pendingAppointments: 0,
        completedCheckins: 0,
        totalPatients: 0,
        nurseQueuePatients: 0,
        receptionQueuePatients: 0,
      });

      toast.error(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to create sample data for testing
  const createSampleData = async () => {
    if (!user) return;

    try {
      // Create sample departments if none exist
      const deptsRes = await api.get('/departments?limit=1');
      const existingDepts = deptsRes.data.departments || [];
      if (!existingDepts || existingDepts.length === 0) {
        await api.post('/departments', [
          { name: 'General Medicine', description: 'General medical care' },
          { name: 'Cardiology', description: 'Heart and cardiovascular system' },
          { name: 'Pediatrics', description: 'Children and infants' }
        ]);
      }

      // Create sample patients if none exist
      const patientsRes = await api.get('/patients?limit=1');
      const existingPatients = patientsRes.data.patients || [];
      if (!existingPatients || existingPatients.length === 0) {
        const newPatientsRes = await api.post('/patients', [
          {
            full_name: 'John Doe',
            date_of_birth: '1990-01-01',
            gender: 'Male',
            phone: '+255700000001',
            email: 'john@example.com',
            blood_group: 'O+',
            status: 'Active'
          },
          {
            full_name: 'Jane Smith',
            date_of_birth: '1985-05-15',
            gender: 'Female',
            phone: '+255700000002',
            email: 'jane@example.com',
            blood_group: 'A+',
            status: 'Active'
          }
        ]);
        const newPatients = newPatientsRes.data.patients || [];

        if (newPatients && newPatients.length > 0) {
          // Create sample appointments
          await api.post('/appointments', [
            {
              patient_id: newPatients[0].id,
              doctor_id: user.id,
              appointment_date: new Date().toISOString().split('T')[0],
              appointment_time: '10:00',
              reason: 'Regular checkup',
              status: 'Scheduled'
            }
          ]);
        }
      }

      toast.success('Sample data created');
      fetchData(false);
    } catch (error) {
      console.error('Error creating sample data:', error);
    }
  };

  // Helper function to automatically assign doctor
  const getAutoAssignedDoctor = (doctorsList: any[], departmentId?: string) => {
    if (doctorsList.length === 0) return null;

    // Filter doctors by department if specified
    let availableDoctors = doctorsList;
    if (departmentId) {
      // For now, we'll use a simple approach - in a real system you'd have doctor specializations
      // For demo purposes, we'll assume all doctors can handle all departments
      availableDoctors = doctorsList;
    }

    if (availableDoctors.length === 0) return null;

    // Simple load balancing: assign to doctor with fewest current appointments
    // In a real system, you'd check actual appointment counts per doctor
    const today = new Date().toISOString().split('T')[0];
    const doctorAppointmentCounts = new Map();

    // Count current appointments for each doctor
    appointments.forEach(apt => {
      if (apt.appointment_date === today && apt.doctor?.id) {
        doctorAppointmentCounts.set(
          apt.doctor.id,
          (doctorAppointmentCounts.get(apt.doctor.id) || 0) + 1
        );
      }
    });

    // Find doctor with fewest appointments
    let selectedDoctor = availableDoctors[0];
    let minAppointments = doctorAppointmentCounts.get(selectedDoctor.id) || 0;

    availableDoctors.forEach(doctor => {
      const count = doctorAppointmentCounts.get(doctor.id) || 0;
      if (count < minAppointments) {
        selectedDoctor = doctor;
        minAppointments = count;
      }
    });

    return selectedDoctor;
  };

  // Auto-assign doctor when department changes or form opens
  useEffect(() => {
    if (appointmentForm.department_id && doctors.length > 0 && !appointmentForm.doctor_id) {
      const autoDoctor = getAutoAssignedDoctor(doctors, appointmentForm.department_id);
      if (autoDoctor) {
        setAppointmentForm(prev => ({
          ...prev,
          doctor_id: autoDoctor?.id || ''
        }));
      }
    }
  }, [appointmentForm.department_id, doctors]);

  // Fetch doctors for selected department in registration
  useEffect(() => {
    const fetchDepartmentDoctors = async () => {
      if (!appointmentDepartmentId) {
        setDepartmentDoctors([]);
        setAppointmentDoctorId('');
        return;
      }

      try {
        const response = await api.get(`/departments/${appointmentDepartmentId}/doctors`);
        const assignedDoctors = response.data.doctors || [];
        
        // Filter only doctors that are assigned to this department
        const activeDoctors = assignedDoctors.filter((doc: any) => doc.assignment_id);
        
        setDepartmentDoctors(activeDoctors);
        
        // Auto-select if only one doctor
        if (activeDoctors.length === 1) {
          setAppointmentDoctorId(activeDoctors[0].id);
        } else {
          setAppointmentDoctorId('');
        }
      } catch (error) {
        console.error('Error fetching department doctors:', error);
        setDepartmentDoctors([]);
      }
    };

    fetchDepartmentDoctors();
  }, [appointmentDepartmentId]);

  // ---------------- FETCH DATA ----------------
  const fetchConsultationFee = async () => {
    try {
      // Fetch default consultation fee
      const settingsRes = await api.get('/settings/consultation_fee');
      
      if (settingsRes.data && settingsRes.data.value) {
        setConsultationFee(Number(settingsRes.data.value));
      }

      // Fetch department-specific fees
      const deptFeesRes = await api.get('/departments/fees');
      const deptFeesData = deptFeesRes.data.fees || [];

      if (deptFeesData && deptFeesData.length > 0) {
        const feesMap: Record<string, number> = {};
        deptFeesData.forEach(fee => {
          feesMap[fee.department_id] = fee.fee_amount;
        });
        setDepartmentFees(feesMap);
      }
    } catch (error) {
      console.log('Using default consultation fee');
    }
  };

  // Get consultation fee for a specific department
  const getDepartmentFee = (departmentId: string | null) => {
    if (!departmentId) return consultationFee;
    return departmentFees[departmentId] || consultationFee;
  };

  const handleInitiateCheckIn = async (appointment: any) => {
    // Check if patient already paid today
    try {
      const today = new Date().toISOString().split('T')[0];
      const paymentsRes = await api.get(`/payments?patient_id=${appointment.patient_id}&date=${today}`);
      const todayPayments = paymentsRes.data.payments || [];
      
      if (todayPayments.length > 0) {
        // Patient already paid today - skip payment
        const confirmSkip = window.confirm(
          `This patient already paid TSh ${todayPayments[0].amount} today. Skip payment and check in directly?`
        );
        
        if (confirmSkip) {
          await handleCheckIn(appointment.id);
          toast.success('Patient checked in (payment already received today)');
          return;
        }
      }
    } catch (error) {
      console.log('Could not check existing payments, proceeding with payment collection');
    }
    
    setSelectedAppointmentForPayment(appointment);
    const fee = getDepartmentFee(appointment.department_id);
    setPaymentForm({
      amount_paid: fee.toString(),
      payment_method: 'Cash'
    });
    setShowPaymentDialog(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedAppointmentForPayment) return;

    const amountPaid = Number(paymentForm.amount_paid);
    const requiredFee = getDepartmentFee(selectedAppointmentForPayment.department_id);
    if (isNaN(amountPaid) || amountPaid < requiredFee) {
      toast.error(`Payment must be at least TSh ${requiredFee.toLocaleString()}`);
      return;
    }

    try {
      // Create payment record
      const paymentData = {
        patient_id: selectedAppointmentForPayment.patient_id,
        amount: amountPaid,
        payment_method: paymentForm.payment_method,
        payment_type: 'Consultation Fee',
        status: 'Completed',
        payment_date: new Date().toISOString()
      };
      
      const paymentRes = await api.post('/payments', paymentData);
      if (paymentRes.status !== 200 || paymentRes.data.error) throw new Error(paymentRes.data.error || 'Failed to create payment');

      // Now proceed with check-in
      await handleCheckIn(selectedAppointmentForPayment.id);
      
      setShowPaymentDialog(false);
      setSelectedAppointmentForPayment(null);
      toast.success(`Payment of TSh ${amountPaid} received. Patient checked in.`);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    }
  };

  const handleCheckIn = async (appointmentId: string) => {
    try {
      // First, get appointment details
      const appointmentRes = await api.get(`/appointments/${appointmentId}`);
      const appointment = appointmentRes.data.appointment;
      if (appointmentRes.status !== 200 || appointmentRes.data.error) throw new Error(appointmentRes.data.error || 'Failed to fetch appointment');

      // Update appointment status
      const updateRes = await api.put(`/appointments/${appointmentId}`, { 
        status: 'Confirmed', 
        updated_at: new Date().toISOString() 
      });
      if (updateRes.status !== 200 || updateRes.data.error) throw new Error(updateRes.data.error || 'Failed to update appointment');

      // Use upsert to update existing visit or create new one (prevents duplicates)
      // First, try to find existing visit
      const visitsRes = await api.get(`/visits?appointment_id=${appointmentId}`);
      const visitsData = visitsRes.data.visits || [];
      const existingVisit = visitsData.length > 0 ? visitsData[0] : null;

      if (existingVisit) {
        // Update existing visit
        const visitRes = await api.put(`/visits/${existingVisit.id}`, {
          reception_status: 'Checked In',
          reception_completed_at: new Date().toISOString(),
          current_stage: 'nurse',
          nurse_status: 'Pending',
          updated_at: new Date().toISOString()
        });
        if (visitRes.status !== 200 || visitRes.data.error) throw new Error(visitRes.data.error || 'Failed to update visit');
      } else {
        // Create new visit only if it doesn't exist
        const visitData = {
          patient_id: appointment.patient_id,
          appointment_id: appointmentId,
          doctor_id: appointment.doctor_id, // Link to specific doctor
          visit_date: new Date().toISOString().split('T')[0],
          reception_status: 'Checked In',
          reception_completed_at: new Date().toISOString(),
          current_stage: 'nurse',
          nurse_status: 'Pending',
          overall_status: 'Active'
        };
        
        const visitRes = await api.post('/visits', visitData);
        if (visitRes.status !== 200 || visitRes.data.error) {
          // If error is duplicate, just update the existing one
          // In this case, we'll assume the visit was created and try to update it
          const updateRes = await api.put(`/visits?appointment_id=${appointmentId}`, {
            reception_status: 'Checked In',
            reception_completed_at: new Date().toISOString(),
            current_stage: 'nurse',
            nurse_status: 'Pending',
            updated_at: new Date().toISOString()
          });
          
          if (updateRes.status !== 200 || updateRes.data.error) throw new Error(updateRes.data.error || 'Failed to update visit');
        }
      }

      // Remove from local state immediately
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));

      toast.success('Patient checked in and sent to nurse queue');
      logActivity('appointment.check_in', { appointment_id: appointmentId });
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(`Failed to check in: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      // Update appointment status
      const updateRes = await api.put(`/appointments/${appointmentId}`, { status: 'Cancelled' });
      if (updateRes.status !== 200 || updateRes.data.error) throw new Error(updateRes.data.error || 'Failed to update appointment');

      // Update patient visit workflow
      const visitRes = await api.put(`/visits?appointment_id=${appointmentId}`, {
        overall_status: 'Cancelled',
        reception_status: 'Cancelled'
      });
      if (visitRes.status !== 200 || visitRes.data.error) throw new Error(visitRes.data.error || 'Failed to update visit');

      toast.success('Appointment cancelled');
      logActivity('appointment.cancel', { appointment_id: appointmentId });
      
      // Remove from local state
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  const handleRegisterPatient = () => {
    setRegisterForm({
      full_name: '',
      date_of_birth: '',
      gender: '',
      phone: '',
      email: '',
      blood_group: '',
      address: '',
    });
    setRegisterWithAppointment(false);
    setAppointmentDepartmentId('');
    setAppointmentDoctorId('');
    setAppointmentDate('');
    setAppointmentTime('');
    setAppointmentReason('');
    setShowRegisterDialog(true);
  };

  const handleBookAppointment = () => {
    setAppointmentForm({
      patient_id: '',
      doctor_id: '',
      appointment_date: '',
      appointment_time: '',
      appointment_type: 'Consultation',
      reason: '',
      department_id: '',
    });
    setShowBookAppointmentDialog(true);
  };

  const handlePatientSearch = () => {
    setShowPatientSearch(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleViewSchedule = () => {
    setShowScheduleDialog(true);
  };

  // Real-time search for returning patients
  useEffect(() => {
    if (!showReturningPatientDialog) {
      setReturningPatientResults([]);
      return;
    }

    if (!returningPatientSearch.trim() || returningPatientSearch.trim().length < 2) {
      setReturningPatientResults([]);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      try {
        const searchRes = await api.get(`/patients?search=${encodeURIComponent(returningPatientSearch)}&limit=10`);
        
        if (searchRes.data.error) {
          throw new Error(searchRes.data.error);
        }
        
        setReturningPatientResults(searchRes.data.patients || []);
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [returningPatientSearch, showReturningPatientDialog]);

  const [selectedReturningPatient, setSelectedReturningPatient] = useState<any>(null);
  const [showReturningPatientPaymentDialog, setShowReturningPatientPaymentDialog] = useState(false);

  const initiateReturningPatientVisit = async (patient: any) => {
    try {
      // Check if patient already has an active visit TODAY
      const today = new Date().toISOString().split('T')[0];
      const visitsRes = await api.get(`/visits?patient_id=${patient.id}&status=Active&from=${today}&to=${today}&limit=1`);
      if (visitsRes.status !== 200 || visitsRes.data.error) {
        throw new Error(visitsRes.data.error || 'Failed to check existing visits');
      }

      const existingVisits = visitsRes.data.visits || [];
      if (existingVisits && existingVisits.length > 0) {
        toast.error('This patient already has an active visit today. Please complete the current visit first.');
        return;
      }

      // Check if patient already paid today
      const paymentsRes = await api.get(`/payments?patient_id=${patient.id}&date=${today}`);
      const todayPayments = paymentsRes.data.payments || [];
      
      if (todayPayments.length > 0) {
        // Patient already paid today - skip payment
        const confirmSkip = window.confirm(
          `${patient.full_name} already paid TSh ${todayPayments[0].amount} today. Skip payment and create visit directly?`
        );
        
        if (confirmSkip) {
          await createVisitForReturningPatient(patient);
          return;
        }
      }

      // Show payment dialog
      setSelectedReturningPatient(patient);
      setPaymentForm({
        amount_paid: consultationFee.toString(),
        payment_method: 'Cash'
      });
      setShowReturningPatientDialog(false);
      setShowReturningPatientPaymentDialog(true);
    } catch (error: any) {
      console.error('Error initiating returning patient visit:', error);
      toast.error(error.message || 'Failed to initiate visit');
    }
  };

  const completeReturningPatientVisit = async () => {
    if (!selectedReturningPatient) return;

    const amountPaid = Number(paymentForm.amount_paid);
    if (isNaN(amountPaid) || amountPaid < consultationFee) {
      toast.error(`Payment must be at least TSh ${consultationFee.toLocaleString()}`);
      return;
    }

    try {
      setLoading(true);

      // Create payment record
      const paymentData = {
        patient_id: selectedReturningPatient.id,
        amount: amountPaid,
        payment_method: paymentForm.payment_method,
        payment_type: 'Consultation Fee',
        status: 'Completed',
        payment_date: new Date().toISOString()
      };
      
      await api.post('/payments', paymentData);

      // Create visit
      await createVisitForReturningPatient(selectedReturningPatient);

      toast.success(`Payment received. ${selectedReturningPatient.full_name} sent to Nurse.`);
      setShowReturningPatientPaymentDialog(false);
      setSelectedReturningPatient(null);
      setReturningPatientSearch('');
      setReturningPatientResults([]);
    } catch (error: any) {
      console.error('Error completing returning patient visit:', error);
      toast.error(error.message || 'Failed to complete visit');
    } finally {
      setLoading(false);
    }
  };

  const createVisitForReturningPatient = async (patient: any) => {
    // Create new visit with all required fields
    const visitData = {
      patient_id: patient.id,
      visit_date: new Date().toISOString().split('T')[0],
      reception_status: 'Checked In',
      reception_completed_at: new Date().toISOString(),
      current_stage: 'nurse',
      nurse_status: 'Pending',
      overall_status: 'Active'
    };

    const visitRes = await api.post('/visits', visitData);
    if (visitRes.status !== 200 || visitRes.data.error) {
      throw new Error(visitRes.data.error || 'Failed to create visit');
    }

    // Refresh data
    fetchData(false);
  };

  const searchPatients = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const searchRes = await api.get(`/patients?search=${encodeURIComponent(query)}&limit=20`);
      
      if (searchRes.data.error) {
        throw new Error(searchRes.data.error);
      }
      
      setSearchResults(searchRes.data.patients || []);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.response?.data?.error || 'Failed to search patients');
    } finally {
      setLoading(false);
    }
  };

  // Real-time search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchPatients(searchQuery);
      } else if (searchQuery.trim().length === 0) {
        setSearchResults([]);
      }
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const submitPatientRegistration = async () => {
    // Validate required fields
    if (!registerForm.full_name || !registerForm.date_of_birth ||
        !registerForm.gender || !registerForm.phone || !registerForm.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate gender value
    if (!['Male', 'Female', 'Other'].includes(registerForm.gender)) {
      toast.error('Gender must be Male, Female, or Other');
      return;
    }

    // Determine the fee based on whether booking with appointment
    const feeToCharge = registerWithAppointment && appointmentDepartmentId
      ? getDepartmentFee(appointmentDepartmentId)
      : consultationFee;

    // Close registration dialog and show payment dialog
    setShowRegisterDialog(false);
    setPaymentForm({
      amount_paid: feeToCharge.toString(),
      payment_method: 'Cash'
    });
    setShowRegistrationPaymentDialog(true);
  };

  const completePatientRegistration = async () => {
    const amountPaid = Number(paymentForm.amount_paid);
    if (isNaN(amountPaid) || amountPaid < consultationFee) {
      toast.error(`Payment must be at least TSh ${consultationFee.toLocaleString()}`);
      return;
    }

    try {
      // Insert patient
      const patientData = {
        full_name: registerForm.full_name,
        date_of_birth: registerForm.date_of_birth,
        gender: registerForm.gender,
        phone: registerForm.phone,
        email: registerForm.email || null,
        blood_group: registerForm.blood_group || null,
        address: registerForm.address || null,
        status: 'Active',
      };
      
      const patientRes = await api.post('/patients', patientData);
      
      // Check for errors (201 is success for creation)
      if (patientRes.data.error) {
        const patientError = new Error(patientRes.data.error || 'Failed to register patient');
        console.error('Patient registration error:', patientError);
        toast.error(`Registration failed: ${patientError.message}`);
        return;
      }

      // Get the patient ID from response
      const patientId = patientRes.data.patientId;
      if (!patientId) {
        toast.error('Patient registered but ID not returned');
        return;
      }

      // Create payment record
      const paymentData = {
        patient_id: patientId,
        amount: amountPaid,
        payment_method: paymentForm.payment_method,
        payment_type: 'Consultation Fee',
        status: 'Completed',
        payment_date: new Date().toISOString()
      };
      
      await api.post('/payments', paymentData);

      // Success - patient created
      toast.success('Patient registered and payment received!');

      // If registering with appointment, create appointment instead of immediate visit
      if (registerWithAppointment && appointmentDepartmentId && appointmentDoctorId && appointmentDate && appointmentTime) {
        // Create appointment
        const appointmentData = {
          patient_id: patientId,
          doctor_id: appointmentDoctorId,
          department_id: appointmentDepartmentId,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          appointment_type: 'Consultation',
          reason: appointmentReason || 'Initial consultation',
          status: 'Scheduled'
        };
        
        const appointmentRes = await api.post('/appointments', appointmentData);
        if (!appointmentRes.data.error) {
          toast.success(`Appointment scheduled for ${appointmentDate} at ${appointmentTime}`);
        }
      } else {
        // Create immediate visit workflow (walk-in patient)
        const visitData = {
          patient_id: patientId,
          visit_date: new Date().toISOString().split('T')[0],
          reception_status: 'Checked In',
          current_stage: 'nurse',
          overall_status: 'Active'
        };
        
        // Create visit
        const visitRes = await api.post('/visits', visitData);
        if (!visitRes.data.error && visitRes.data.visitId) {
          await api.put(`/visits/${visitRes.data.visitId}`, {
            nurse_status: 'Pending',
            reception_completed_at: new Date().toISOString()
          });
          toast.success('Patient added to nurse queue!');
        }
      }

      // Close payment dialog
      setShowRegistrationPaymentDialog(false);
      
      // Reset form
      setRegisterForm({
        full_name: '',
        date_of_birth: '',
        gender: '',
        phone: '',
        email: '',
        blood_group: '',
        address: ''
      });
      
      // Refresh the dashboard data to show the new patient
      fetchData(false);

      logActivity('patient.register', { patient_id: patientId, full_name: registerForm.full_name, amount_paid: amountPaid });
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Unknown error';
      toast.error(`Failed to register patient: ${errorMessage}`);
    }
  };

  const submitBookAppointment = async () => {
    // Validate required fields
    if (!appointmentForm.patient_id || !appointmentForm.doctor_id ||
        !appointmentForm.appointment_date || !appointmentForm.appointment_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const appointmentData = {
        patient_id: appointmentForm.patient_id,
        doctor_id: appointmentForm.doctor_id,
        appointment_date: appointmentForm.appointment_date,
        appointment_time: appointmentForm.appointment_time,
        appointment_type: appointmentForm.appointment_type || 'Consultation',
        reason: appointmentForm.reason || null,
        notes: null
      };
      
      console.log('Creating appointment with data:', appointmentData);
      
      const appointmentRes = await api.post('/appointments', appointmentData);
      
      if (appointmentRes.data.error) {
        throw new Error(appointmentRes.data.error);
      }
      
      // Get the appointment ID from response
      const appointmentId = appointmentRes.data.appointmentId;
      if (!appointmentId) {
        throw new Error('Appointment created but ID not returned');
      }
      
      // console.log('New appointment created:', newAppointment);
      // console.log('Appointment date type:', typeof newAppointment.appointment_date, 'value:', newAppointment.appointment_date);

      // Create patient visit workflow for appointment (starts at reception for check-in)
      try {
        const visitData = {
          patient_id: appointmentForm.patient_id,
          appointment_id: appointmentId,
          visit_date: appointmentForm.appointment_date,
          reception_status: 'Pending',
          current_stage: 'reception',
          overall_status: 'Active'
        };
        
        await api.post('/visits', visitData);
      } catch (visitError: any) {
        console.error('Error creating patient visit:', visitError);
        // Don't fail the appointment creation if visit creation fails
      }

      toast.success('Appointment booked successfully!');
      setShowBookAppointmentDialog(false);
      
      // Reset form
      setAppointmentForm({
        patient_id: '',
        doctor_id: '',
        appointment_date: '',
        appointment_time: '',
        appointment_type: 'Consultation',
        reason: '',
        department_id: ''
      });
      
      // Refresh data in background
      fetchData(false);
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(`Failed to book appointment: ${error.message || 'Unknown error'}`);
    }
  };



  // ---------------- LOADING SCREEN ----------------
  if (loading) {
    return (
      <DashboardLayout title="Receptionist Dashboard">
        <div className="space-y-8">
          {/* Skeleton stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
          {/* Skeleton cards */}
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="h-96 bg-gray-200 animate-pulse rounded-lg"></div>
            <div className="h-96 bg-gray-200 animate-pulse rounded-lg"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ---------------- MAIN RENDER ----------------
  return (
    <>
      <DashboardLayout title="Receptionist Dashboard">
        <div className="space-y-8">

          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Building className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Welcome back, Receptionist!
                  </h2>
                  <p className="text-gray-600">
                    Here's your front desk overview for today
                  </p>
                </div>
              </div>
              {/* Sample data action removed */}
            </div>
          </div>

          {/* Workflow Queue Status */}
          <Card className="shadow-lg border-green-200 bg-green-50/30">
            <CardHeader className="bg-green-100/50">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Users className="h-5 w-5" />
                Current Patient Workflow Status
              </CardTitle>
              <CardDescription className="text-green-700">
                Real-time view of where patients are in the hospital workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-green-800">Nurse Queue</h4>
                    <Badge variant="default" className="bg-green-600">
                      {stats.nurseQueuePatients} patient{stats.nurseQueuePatients !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Patients waiting for vital signs (from new registrations)
                  </p>
                  <div className="text-xs text-green-600">
                    ✓ Auto-assigned from patient registration
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-800">Reception Queue</h4>
                    <Badge variant="default" className="bg-blue-600">
                      {stats.receptionQueuePatients} patient{stats.receptionQueuePatients !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Patients waiting for check-in (from appointments)
                  </p>
                  <div className="text-xs text-blue-600">
                    ✓ Requires check-in before nurse visit
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Doctor/Department Queue for Today */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Today's Doctor Appointments by Department
              </CardTitle>
              <CardDescription>View which doctors have appointments scheduled today</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const today = new Date().toISOString().split('T')[0];
                const todayAppointments = appointments.filter(apt => {
                  // Extract date from appointment_date (might be datetime or date string)
                  const aptDate = apt.appointment_date ? apt.appointment_date.split('T')[0] : '';
                  return aptDate === today && apt.status === 'Scheduled';
                });
                
                // Group by doctor
                type DoctorGroup = {
                  doctor: any;
                  department: any;
                  appointments: any[];
                };
                
                const byDoctor = todayAppointments.reduce((acc, apt) => {
                  const doctorId = apt.doctor_id;
                  if (!acc[doctorId]) {
                    acc[doctorId] = {
                      doctor: apt.doctor,
                      department: apt.department,
                      appointments: []
                    };
                  }
                  acc[doctorId].appointments.push(apt);
                  return acc;
                }, {} as Record<string, DoctorGroup>);
                
                const doctorList: DoctorGroup[] = Object.values(byDoctor);
                
                return doctorList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Stethoscope className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>No appointments scheduled for today</p>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {doctorList.map((item, idx) => (
                      <div key={idx} className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-blue-900">
                              Dr. {item.doctor?.full_name || 'Unknown'}
                            </p>
                            {item.department?.name && (
                              <p className="text-xs text-blue-600">{item.department.name}</p>
                            )}
                          </div>
                          <Badge className="bg-blue-600">
                            {item.appointments.length}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.appointments.length} appointment{item.appointments.length !== 1 ? 's' : ''} today
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Today's Appointments & Recent Patients */}
          <div className="grid gap-8 lg:grid-cols-2">
            <AppointmentsCard appointments={appointments} onCheckIn={handleInitiateCheckIn} onCancel={handleCancelAppointment} />
            <PatientsCard patients={patients} />
          </div>

          {/* Quick Actions */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common receptionist tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleRegisterPatient}>
                  <UserPlus className="h-6 w-6" />
                  <span>Register New Patient</span>
                  <span className="text-xs text-muted-foreground">→ Goes to Nurse</span>
                </Button>
                <Button variant="default" className="h-20 flex-col gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setShowReturningPatientDialog(true)}>
                  <Users className="h-6 w-6" />
                  <span>Returning Patient</span>
                  <span className="text-xs">→ Create New Visit</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleBookAppointment}>
                  <Calendar className="h-6 w-6" />
                  <span>Book Follow-up Appointment</span>
                  <span className="text-xs text-muted-foreground">→ Scheduled Visit</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={handlePatientSearch}>
                  <Phone className="h-6 w-6" />
                  <span>Patient Search</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleViewSchedule}>
                  <Clipboard className="h-6 w-6" />
                  <span>View Schedule</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Departments */}
          <Card className="shadow-lg">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Departments & Doctor Queue
                </CardTitle>
                <CardDescription>Available departments and current doctor workload</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {departments.map((dept) => {
                  const deptAppointments = appointments.filter(a => a.department?.id === dept.id);
                  const today = new Date().toISOString().split('T')[0];
                  const todayDeptAppts = deptAppointments.filter(a => a.appointment_date === today);

                  return (
                    <div key={dept.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <h4 className="font-medium">{dept.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{dept.description}</p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {todayDeptAppts.length} appointments today
                      </div>
                    </div>
                  );
                })}

                {/* Doctor Queue Status */}
                <div className="md:col-span-2 lg:col-span-3">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-medium">Doctor Queue Status (Today)</h4>
                    {roleUpdateIndicator && (
                      <div className="flex items-center gap-1 text-sm text-blue-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Updating...</span>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {doctors.slice(0, 6).map((doctor) => {
                      const today = new Date().toISOString().split('T')[0];
                      const doctorAppts = appointments.filter(a =>
                        a.appointment_date === today && a.doctor?.id === doctor.id
                      );
                      const isAvailable = doctorAppts.length < 8; // Assume 8 is max per day

                      return (
                        <div key={doctor.id} className={`p-3 border rounded-lg ${
                          isAvailable ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm">{doctor.full_name}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              isAvailable ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {doctorAppts.length}/8 slots
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {isAvailable ? 'Available' : 'Busy'} • {doctorAppts.length} appointments today
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      {/* Register Patient Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Patient</DialogTitle>
            <DialogDescription>Enter patient information to register them</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input id="full_name" required value={registerForm.full_name} onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input 
                  type="date" 
                  id="date_of_birth" 
                  required 
                  max={new Date().toISOString().split('T')[0]}
                  value={registerForm.date_of_birth} 
                  onChange={(e) => setRegisterForm({ ...registerForm, date_of_birth: e.target.value })} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <select
                  id="gender"
                  className="w-full p-2 border rounded-md"
                  value={registerForm.gender}
                  onChange={(e) => setRegisterForm({ ...registerForm, gender: e.target.value })}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" required value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} placeholder="+255 700 000 000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input type="email" id="email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blood_group">Blood Group</Label>
                <Input id="blood_group" value={registerForm.blood_group} onChange={(e) => setRegisterForm({ ...registerForm, blood_group: e.target.value })} placeholder="A+" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input id="address" required value={registerForm.address} onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })} placeholder="Street, City" />
            </div>
            
            {/* Option to book with appointment */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox 
                  id="book_with_appointment" 
                  checked={registerWithAppointment}
                  onCheckedChange={(checked) => setRegisterWithAppointment(checked as boolean)}
                />
                <Label htmlFor="book_with_appointment" className="font-medium cursor-pointer">
                  Book appointment with specialized doctor (pay department fee instead of consultation fee)
                </Label>
              </div>
              
              {registerWithAppointment && (
                <div className="space-y-3 ml-6 p-4 border rounded-lg bg-blue-50/50">
                  <div className="space-y-2">
                    <Label htmlFor="reg_department">Select Department *</Label>
                    <select
                      id="reg_department"
                      className="w-full p-2 border rounded-md"
                      value={appointmentDepartmentId}
                      onChange={(e) => setAppointmentDepartmentId(e.target.value)}
                      required={registerWithAppointment}
                      disabled={departments.length === 0}
                    >
                      <option value="">
                        {departments.length === 0 ? 'Loading departments...' : 'Select Department'}
                      </option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} - TSh {getDepartmentFee(dept.id).toLocaleString()}
                        </option>
                      ))}
                    </select>
                    {departments.length === 0 && (
                      <p className="text-xs text-amber-600">No departments available. Please create departments first.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg_doctor">Select Doctor *</Label>
                    <select
                      id="reg_doctor"
                      className="w-full p-2 border rounded-md"
                      value={appointmentDoctorId}
                      onChange={(e) => setAppointmentDoctorId(e.target.value)}
                      required={registerWithAppointment}
                      disabled={!appointmentDepartmentId || departmentDoctors.length === 0}
                    >
                      <option value="">
                        {!appointmentDepartmentId 
                          ? 'Select department first' 
                          : departmentDoctors.length === 0 
                          ? 'No doctors assigned to this department' 
                          : 'Select Doctor'}
                      </option>
                      {departmentDoctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          Dr. {doc.full_name}
                        </option>
                      ))}
                    </select>
                    {departmentDoctors.length === 1 && appointmentDoctorId && (
                      <p className="text-xs text-green-600">✓ Auto-selected (only doctor in this department)</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="reg_appt_date">Appointment Date *</Label>
                      <Input
                        type="date"
                        id="reg_appt_date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required={registerWithAppointment}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg_appt_time">Time *</Label>
                      <Input
                        type="time"
                        id="reg_appt_time"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        required={registerWithAppointment}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg_appt_reason">Reason for Visit</Label>
                    <Input
                      id="reg_appt_reason"
                      value={appointmentReason}
                      onChange={(e) => setAppointmentReason(e.target.value)}
                      placeholder="e.g., Heart checkup, Follow-up"
                    />
                  </div>

                  <p className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                    <strong>Note:</strong> Patient will be charged TSh {getDepartmentFee(appointmentDepartmentId).toLocaleString()} (department fee) and appointment will be scheduled for {appointmentDate || '[date]'} at {appointmentTime || '[time]'}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRegisterDialog(false)}>Cancel</Button>
            <Button 
              onClick={submitPatientRegistration}
              disabled={registerWithAppointment && (!appointmentDepartmentId || !appointmentDoctorId || !appointmentDate || !appointmentTime)}
            >
              {registerWithAppointment ? 'Register & Schedule Appointment' : 'Register Patient'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Book Appointment Dialog */}
      <Dialog open={showBookAppointmentDialog} onOpenChange={setShowBookAppointmentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Calendar className="h-5 w-5 text-blue-600" />
              {appointmentForm.patient_id ? 'Book Follow-up Appointment' : 'Book New Appointment'}
            </DialogTitle>
            <DialogDescription>
              {appointmentForm.patient_id
                ? 'Schedule a follow-up appointment for an existing patient'
                : 'Schedule a new appointment for a patient (Note: New patients should be registered first)'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label htmlFor="appt_patient">Patient *</Label>
              <select
                id="appt_patient"
                className="w-full p-2 border rounded-md"
                value={appointmentForm.patient_id}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, patient_id: e.target.value })}
                required
              >
                <option value="">Select Patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} - {p.phone}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appt_doctor">Doctor *</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <select
                    id="appt_doctor"
                    className="w-full p-2 border rounded-md"
                    value={appointmentForm.doctor_id}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, doctor_id: e.target.value })}
                    required
                    disabled={roleUpdateIndicator !== null}
                  >
                    <option value="">
                      {roleUpdateIndicator ? 'Updating doctors...' : 'Select Doctor'}
                    </option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.full_name}</option>
                    ))}
                  </select>
                  {roleUpdateIndicator && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
                {appointmentForm.department_id && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const autoDoctor = getAutoAssignedDoctor(doctors, appointmentForm.department_id);
                      if (autoDoctor) {
                        setAppointmentForm(prev => ({ ...prev, doctor_id: autoDoctor.id }));
                      }
                    }}
                    className="px-3"
                  >
                    Auto
                  </Button>
                )}
              </div>
              {appointmentForm.department_id && appointmentForm.doctor_id && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-600">✓</span>
                  <span className="text-muted-foreground">
                    Doctor auto-assigned based on availability
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAppointmentForm(prev => ({ ...prev, doctor_id: '' }))}
                    className="text-xs h-auto p-1"
                  >
                    Change
                  </Button>
                </div>
              )}
              {appointmentForm.department_id && !appointmentForm.doctor_id && (
                <p className="text-sm text-muted-foreground">
                  💡 Select a department above to auto-assign a doctor
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appt_date">Date *</Label>
                <Input
                  type="date"
                  id="appt_date"
                  value={appointmentForm.appointment_date}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appt_time">Time *</Label>
                <Input
                  type="time"
                  id="appt_time"
                  value={appointmentForm.appointment_time}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appt_department">Department</Label>
              <select
                id="appt_department"
                className="w-full p-2 border rounded-md"
                value={appointmentForm.department_id}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, department_id: e.target.value })}
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appt_reason">Reason for Visit</Label>
              <Input
                id="appt_reason"
                value={appointmentForm.reason}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
                placeholder="e.g., Regular checkup, Follow-up"
              />
            </div>

            {/* Consultation Fee Display */}
            {appointmentForm.department_id && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-900">Consultation Fee</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {departments.find(d => d.id === appointmentForm.department_id)?.name || 'Selected Department'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-700">
                      TSh {getDepartmentFee(appointmentForm.department_id).toLocaleString()}
                    </div>
                    <div className="text-xs text-blue-600">
                      {departmentFees[appointmentForm.department_id] ? 'Department rate' : 'Default rate'}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-blue-700 bg-blue-100/50 p-2 rounded">
                  💡 This fee will be collected at reception during check-in
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowBookAppointmentDialog(false)}>Cancel</Button>
            <Button onClick={submitBookAppointment} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Calendar className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Patient Search Dialog */}
      <Dialog open={showPatientSearch} onOpenChange={setShowPatientSearch}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Patient Search</DialogTitle>
            <DialogDescription>Search for patients by name or phone number</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Search by name or phone (min 2 characters)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
                className="pr-10"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            {searchResults.length > 0 && (
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="text-sm text-muted-foreground mb-2">
                  Found {searchResults.length} patient{searchResults.length !== 1 ? 's' : ''}
                </p>
                {searchResults.map((patient) => (
                  <div key={patient.id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                    <div className="font-medium">{patient.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {patient.phone} • DOB: {format(new Date(patient.date_of_birth), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Gender: {patient.gender} • Blood Group: {patient.blood_group || 'N/A'}
                    </div>
                    {patient.address && (
                      <div className="text-sm text-muted-foreground">
                        Address: {patient.address}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {searchResults.length === 0 && searchQuery.trim().length >= 2 && !loading && (
              <p className="text-center text-muted-foreground py-8">No patients found matching "{searchQuery}"</p>
            )}
            {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
              <p className="text-center text-muted-foreground py-8">Type at least 2 characters to search</p>
            )}
          </div>
        </DialogContent>
      </Dialog>



      {/* View Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Today's Schedule</DialogTitle>
            <DialogDescription>All appointments for today</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {appointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No appointments for today</p>
            ) : (
              <div className="space-y-2">
                {appointments.map((apt) => (
                  <div key={apt.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{apt.patient?.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {apt.appointment_time} • Dr. {apt.doctor?.full_name}
                        </div>
                        <div className="text-sm text-muted-foreground">{apt.reason || 'No reason specified'}</div>
                      </div>
                      <Badge variant={apt.status === 'Confirmed' ? 'default' : 'secondary'}>
                        {apt.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Collect Consultation Fee</DialogTitle>
            <DialogDescription>
              Patient: {selectedAppointmentForPayment?.patient?.full_name || 'Unknown'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="font-medium">Consultation Fee:</span>
                <span className="text-2xl font-bold text-blue-600">TSh {consultationFee.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <select
                id="payment_method"
                className="w-full p-2 border rounded-md"
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
              >
                <option value="Cash">Cash</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Card">Card</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount_paid">Amount Paid</Label>
              <Input
                id="amount_paid"
                type="number"
                value={paymentForm.amount_paid}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                placeholder="Enter amount"
              />
            </div>

            {Number(paymentForm.amount_paid) > consultationFee && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-800">Change to Return:</span>
                  <span className="text-xl font-bold text-green-600">
                    TSh {(Number(paymentForm.amount_paid) - consultationFee).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {Number(paymentForm.amount_paid) < consultationFee && paymentForm.amount_paid !== '' && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <span className="text-sm text-red-600">Insufficient payment amount</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handlePaymentSubmit}
                disabled={Number(paymentForm.amount_paid) < consultationFee}
              >
                Confirm Payment & Check In
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Registration Payment Dialog */}
      <Dialog open={showRegistrationPaymentDialog} onOpenChange={setShowRegistrationPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Collect {registerWithAppointment && appointmentDepartmentId ? 'Department' : 'Consultation'} Fee</DialogTitle>
            <DialogDescription>
              New Patient: {registerForm.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {registerWithAppointment && appointmentDepartmentId && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-800">
                  <strong>Booking with Appointment:</strong> Department-specific fee applies
                </p>
              </div>
            )}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {registerWithAppointment && appointmentDepartmentId ? 'Department Fee:' : 'Consultation Fee:'}
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  TSh {(registerWithAppointment && appointmentDepartmentId 
                    ? getDepartmentFee(appointmentDepartmentId) 
                    : consultationFee).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg_payment_method">Payment Method</Label>
              <select
                id="reg_payment_method"
                className="w-full p-2 border rounded-md"
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
              >
                <option value="Cash">Cash</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Card">Card</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg_amount_paid">Amount Paid</Label>
              <Input
                id="reg_amount_paid"
                type="number"
                value={paymentForm.amount_paid}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                placeholder="Enter amount"
              />
            </div>

            {(() => {
              const requiredFee = registerWithAppointment && appointmentDepartmentId 
                ? getDepartmentFee(appointmentDepartmentId) 
                : consultationFee;
              
              return (
                <>
                  {Number(paymentForm.amount_paid) > requiredFee && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-green-800">Change to Return:</span>
                        <span className="text-xl font-bold text-green-600">
                          TSh {(Number(paymentForm.amount_paid) - requiredFee).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {Number(paymentForm.amount_paid) < requiredFee && paymentForm.amount_paid !== '' && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <span className="text-sm text-red-600">Insufficient payment amount</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => {
                      setShowRegistrationPaymentDialog(false);
                      setShowRegisterDialog(true);
                    }}>
                      Back
                    </Button>
                    <Button 
                      onClick={completePatientRegistration}
                      disabled={Number(paymentForm.amount_paid) < requiredFee}
                    >
                      Confirm Payment & Register
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Returning Patient Payment Dialog */}
      <Dialog open={showReturningPatientPaymentDialog} onOpenChange={setShowReturningPatientPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Collect Consultation Fee</DialogTitle>
            <DialogDescription>
              Returning Patient: {selectedReturningPatient?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="font-medium">Consultation Fee:</span>
                <span className="text-2xl font-bold text-blue-600">TSh {consultationFee.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ret_payment_method">Payment Method</Label>
              <select
                id="ret_payment_method"
                className="w-full p-2 border rounded-md"
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
              >
                <option value="Cash">Cash</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Card">Card</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ret_amount_paid">Amount Paid</Label>
              <Input
                id="ret_amount_paid"
                type="number"
                value={paymentForm.amount_paid}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                placeholder="Enter amount"
              />
            </div>

            {Number(paymentForm.amount_paid) > consultationFee && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-800">Change to Return:</span>
                  <span className="text-xl font-bold text-green-600">
                    TSh {(Number(paymentForm.amount_paid) - consultationFee).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {Number(paymentForm.amount_paid) < consultationFee && paymentForm.amount_paid !== '' && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <span className="text-sm text-red-600">Insufficient payment amount</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowReturningPatientPaymentDialog(false);
                setShowReturningPatientDialog(true);
              }}>
                Back
              </Button>
              <Button 
                onClick={completeReturningPatientVisit}
                disabled={Number(paymentForm.amount_paid) < consultationFee}
              >
                Confirm Payment & Create Visit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Returning Patient Dialog */}
      <Dialog open={showReturningPatientDialog} onOpenChange={setShowReturningPatientDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Returning Patient - Create New Visit</DialogTitle>
            <DialogDescription>
              Search for an existing patient and create a new visit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Search Patient</Label>
              <Input
                placeholder="Search by name or phone (min 2 characters)..."
                value={returningPatientSearch}
                onChange={(e) => setReturningPatientSearch(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Start typing to search in real-time
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              {returningPatientResults.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {returningPatientSearch.trim().length >= 2 
                    ? `No patients found matching "${returningPatientSearch}"` 
                    : returningPatientSearch.trim().length > 0
                    ? 'Type at least 2 characters to search'
                    : 'Start typing to search for patients'}
                </div>
              ) : (
                <div className="divide-y">
                  {returningPatientResults.map((patient) => (
                    <div key={patient.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-lg">{patient.full_name}</div>
                          <div className="text-sm text-muted-foreground mt-1 space-y-1">
                            <div>📞 {patient.phone}</div>
                            <div>🎂 DOB: {format(new Date(patient.date_of_birth), 'MMM dd, yyyy')} ({new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years)</div>
                            <div>⚧ {patient.gender}</div>
                            {patient.blood_group && <div>🩸 {patient.blood_group}</div>}
                            {patient.allergies && (
                              <div className="text-red-600 font-medium">⚠️ Allergies: {patient.allergies}</div>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => initiateReturningPatientVisit(patient)}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Create Visit
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
