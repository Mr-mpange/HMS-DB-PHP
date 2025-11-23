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
  
  // Filter for today's and upcoming appointments that need action (Scheduled or Confirmed status)
  const relevantAppointments = appointments.filter(
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
      
      const needsAction = a.status === 'Scheduled' || a.status === 'Confirmed';
      
      // Show today's and future appointments (not past ones)
      return appointmentDate >= today && needsAction;
    }
  );
  
  // Separate today's appointments from upcoming ones
  const todayAppointments = relevantAppointments.filter(a => {
    const appointmentDate = a.appointment_date_only || a.appointment_date?.split('T')[0] || '';
    return appointmentDate === today;
  });
  
  const upcomingAppointments = relevantAppointments.filter(a => {
    const appointmentDate = a.appointment_date_only || a.appointment_date?.split('T')[0] || '';
    return appointmentDate > today;
  });

  // Sort by date and time
  const sortedAppointments = relevantAppointments.sort((a, b) => {
    const dateA = a.appointment_date_only || a.appointment_date?.split('T')[0] || '';
    const dateB = b.appointment_date_only || b.appointment_date?.split('T')[0] || '';
    
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    
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
              Appointments ({todayAppointments.length} today, {upcomingAppointments.length} upcoming)
            </CardTitle>
            <CardDescription>Manage patient appointments</CardDescription>
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
            <p className="text-muted-foreground font-medium">No upcoming appointments</p>
            <p className="text-sm text-muted-foreground mt-1">All appointments have been completed or there are no scheduled visits</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAppointments.slice(0, 5).map((appointment) => {
              const appointmentDate = appointment.appointment_date_only || appointment.appointment_date?.split('T')[0] || '';
              const isToday = appointmentDate === today;
              
              return (
              <div key={appointment.id} className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${!isToday ? 'bg-gray-50/50' : ''}`}>
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-full ${isToday ? 'bg-blue-50' : 'bg-gray-100'}`}>
                    <User className={`h-4 w-4 ${isToday ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-base">
                        {appointment.patient?.full_name || 'Unknown Patient'}
                      </p>
                      {!isToday && (
                        <Badge variant="outline" className="text-xs">
                          {appointmentDate}
                        </Badge>
                      )}
                    </div>
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
                  {appointment.status === 'Scheduled' && isToday && (
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
                  {appointment.status === 'Scheduled' && !isToday && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCancel(appointment.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Cancel
                    </Button>
                  )}
                  {appointment.status === 'Confirmed' && (
                    <Badge variant="default" className="bg-blue-600">
                      In Progress
                    </Badge>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
