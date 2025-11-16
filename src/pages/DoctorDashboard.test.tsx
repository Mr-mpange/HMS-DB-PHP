import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAppointments: 0, todayAppointments: 0, totalPatients: 0, pendingConsultations: 0 });

  const fetchData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set some dummy data
      setStats({
        totalAppointments: 10,
        todayAppointments: 3,
        totalPatients: 45,
        pendingConsultations: 2
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up polling
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
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
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.todayAppointments}</div>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.totalAppointments}</div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Consultations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.pendingConsultations}</div>
              <p className="text-xs text-muted-foreground">Waiting for doctor</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground mt-1">Total registered patients</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}