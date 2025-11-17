import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, XCircle, Clock, User } from 'lucide-react';

interface AppointmentsCardProps {
  appointments: any[];
  onCheckIn: (appointment: any) => void;
  onCancel: (appointmentId: string) => void;
}

export function AppointmentsCard({ appointments, onCheckIn, onCancel }: AppointmentsCardProps) {
  // Get today's date in local timezone (not UTC)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;
  
  console.log('Today (local):', today, 'UTC:', new Date().toISOString().split('T')[0]);
  
  // Debug: Log all appointment dates
  console.log('All appointments dates:', appointments.map(a => {
    const dateStr = typeof a.appointment_date === 'string' ? a.appointment_date : '';
    // Simply extract date part from string like "2025-11-17T20:06:00"
    const parts = dateStr.split('T');
    const extracted = parts[0];
    console.log('DEBUG Split:', { dateStr, parts, extracted });
    return {
      patient: a.patient?.full_name,
      date: a.appointment_date,
      extracted,
      status: a.status
    };
  }));
  
  // Filter for today's appointments that need action (Scheduled or Confirmed status)
  const todayAppointments = appointments.filter(
    a => {
      // Use appointment_date_only if available (from backend), otherwise extract from datetime
      let appointmentDate = '';
      
      if (a.appointment_date_only) {
        // Backend provides date-only field
        appointmentDate = typeof a.appointment_date_only === 'string' 
          ? a.appointment_date_only.split('T')[0]
          : new Date(a.appointment_date_only).toISOString().split('T')[0];
      } else if (a.appointment_date) {
        // Parse the datetime string
        const dateStr = typeof a.appointment_date === 'string' 
          ? a.appointment_date 
          : '';
        
        // Simply extract the date part (YYYY-MM-DD) from strings like "2025-11-17T20:06:00"
        // Backend now sends dates without timezone, so they're already in local time
        appointmentDate = dateStr.split('T')[0];
      }
      
      const isToday = appointmentDate === today;
      const needsAction = a.status === 'Scheduled' || a.status === 'Confirmed';
      
      // Debug logging
      console.log('Checking appointment:', {
        patient: a.patient?.full_name,
        rawDate: a.appointment_date,
        hasDateOnly: !!a.appointment_date_only,
        dateOnlyValue: a.appointment_date_only,
        extractedDate: appointmentDate,
        today: today,
        isToday,
        status: a.status,
        needsAction
      });
      
      return isToday && needsAction;
    }
  );
  
  console.log('AppointmentsCard:', {
    today,
    totalAppointments: appointments.length,
    todayAppointments: todayAppointments.length,
    sampleAppointment: appointments[0] ? {
      date: appointments[0].appointment_date,
      dateType: typeof appointments[0].appointment_date,
      status: appointments[0].status,
      patient: appointments[0].patient?.full_name
    } : null
  });

  // Sort by appointment time
  const sortedAppointments = todayAppointments.sort((a, b) => {
    const timeA = a.appointment_time || '00:00';
    const timeB = b.appointment_time || '00:00';
    return timeA.localeCompare(timeB);
  });

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Appointments ({sortedAppointments.length})
            </CardTitle>
            <CardDescription>Manage today's patient schedule</CardDescription>
          </div>
          {sortedAppointments.length > 5 && (
            <Badge variant="secondary" className="ml-2">
              {sortedAppointments.length - 5}+ more
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sortedAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No appointments for today</p>
            <p className="text-sm text-muted-foreground mt-1">All appointments have been completed or there are no scheduled visits</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAppointments.slice(0, 5).map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-blue-50 rounded-full">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <p className="font-medium text-base">
                      {appointment.patient?.full_name || 'Unknown Patient'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{appointment.appointment_time}</span>
                      {appointment.doctor?.full_name && (
                        <>
                          <span>•</span>
                          <span>Dr. {appointment.doctor.full_name}</span>
                        </>
                      )}
                    </div>
                    {appointment.reason && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium">Reason:</span> {appointment.reason}
                      </p>
                    )}
                    {appointment.department?.name && (
                      <p className="text-xs text-blue-600 mt-0.5">
                        {appointment.department.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    appointment.status === 'Confirmed' ? 'default' :
                    appointment.status === 'Scheduled' ? 'secondary' : 'outline'
                  }>
                    {appointment.status}
                  </Badge>
                  {appointment.status === 'Scheduled' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => onCheckIn(appointment)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Check In
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCancel(appointment.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {appointment.status === 'Confirmed' && (
                    <Badge variant="default" className="bg-blue-600">
                      In Progress
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
