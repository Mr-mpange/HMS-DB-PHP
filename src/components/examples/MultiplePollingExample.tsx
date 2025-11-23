import React, { useState } from 'react';
import { useDataPolling } from '@/hooks/useDataPolling';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Activity, DollarSign, Clock } from 'lucide-react';

/**
 * Example showing multiple independent polling instances
 * Each polls different data at different intervals
 * NO page reloads, NO navigation triggers
 */
export function DashboardWithMultiplePolling() {
  const [activeTab, setActiveTab] = useState('overview');

  // Poll patients data every 30 seconds
  const { data: patients, lastUpdated: patientsUpdated } = useDataPolling({
    endpoint: '/patients?status=Active&limit=5',
    interval: 30000,
    enabled: true,
    transform: (response) => response.patients || []
  });

  // Poll appointments every 20 seconds (more frequent)
  const { data: appointments, lastUpdated: appointmentsUpdated } = useDataPolling({
    endpoint: '/appointments?status=Scheduled&limit=5',
    interval: 20000,
    enabled: true,
    transform: (response) => response.appointments || []
  });

  // Poll stats every 60 seconds (less frequent)
  const { data: stats, lastUpdated: statsUpdated } = useDataPolling({
    endpoint: '/dashboard/stats',
    interval: 60000,
    enabled: true,
    transform: (response) => ({
      totalPatients: response.total_patients || 0,
      todayAppointments: response.today_appointments || 0,
      revenue: response.revenue || 0
    })
  });

  // Poll activity logs every 15 seconds (most frequent)
  const { data: activities, lastUpdated: activitiesUpdated } = useDataPolling({
    endpoint: '/activity-logs?limit=10',
    interval: 15000,
    enabled: activeTab === 'activity', // Only poll when tab is active
    transform: (response) => response.logs || []
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards - Updates every 60 seconds */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPatients || 0}</div>
            {statsUpdated && (
              <p className="text-xs text-muted-foreground">
                Updated {new Date(statsUpdated).toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayAppointments || 0}</div>
            {statsUpdated && (
              <p className="text-xs text-muted-foreground">
                Updated {new Date(statsUpdated).toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              TSh {(stats?.revenue || 0).toLocaleString()}
            </div>
            {statsUpdated && (
              <p className="text-xs text-muted-foreground">
                Updated {new Date(statsUpdated).toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content - Different polling for each tab */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Recent Patients - Updates every 30 seconds */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Patients</CardTitle>
                {patientsUpdated && (
                  <Badge variant="outline" className="text-xs">
                    Updated {new Date(patientsUpdated).toLocaleTimeString()}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {patients?.map((patient: any) => (
                  <div key={patient.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{patient.full_name}</span>
                    <Badge variant="secondary">{patient.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Appointments - Updates every 20 seconds */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Appointments</CardTitle>
                {appointmentsUpdated && (
                  <Badge variant="outline" className="text-xs">
                    Updated {new Date(appointmentsUpdated).toLocaleTimeString()}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {appointments?.map((appointment: any) => (
                  <div key={appointment.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{appointment.patient?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{appointment.appointment_time}</p>
                    </div>
                    <Badge>{appointment.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          {/* Activity Logs - Updates every 15 seconds (only when tab is active) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                {activitiesUpdated && (
                  <Badge variant="outline" className="text-xs">
                    Updated {new Date(activitiesUpdated).toLocaleTimeString()}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activities?.map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 border rounded">
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.user_name} • {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
