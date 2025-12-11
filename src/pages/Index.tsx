import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, primaryRole, roles, loading, rolesLoaded } = useAuth();
  const navigate = useNavigate();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    console.log('Index useEffect - State:', { 
      loading, 
      rolesLoaded, 
      user: !!user, 
      primaryRole, 
      roles, 
      retryCount 
    });

    // Don't redirect if still loading
    if (loading) {
      console.log('Still loading, waiting...');
      return;
    }

    // Don't redirect if already attempted or max retries reached
    if (retryCount > 3) {
      console.log('Max retries reached, forcing redirect');
      // If we've tried multiple times and still no roles, redirect to auth
      if (!user) {
        console.log('No user after max retries, redirecting to auth');
        navigate('/auth');
      } else {
        // Default redirect for authenticated users with no roles
        console.log('User exists but no roles after max retries, redirecting to patient');
        navigate('/patient');
      }
      return;
    }

    if (!user) {
      console.log('No user, redirecting to auth');
      navigate('/auth');
      return;
    }

    // Wait for roles to be loaded, but with a retry limit
    if (!rolesLoaded) {
      console.log('Roles not loaded yet, setting retry timer');
      const timer = setTimeout(() => {
        console.log(`Roles still loading, retry attempt ${retryCount + 1}...`);
        setRetryCount(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }

    // Use primary role if available, otherwise use priority order
    if (primaryRole) {
      const roleRoutes: Record<string, string> = {
        admin: '/admin',
        doctor: '/doctor',
        nurse: '/nurse',
        receptionist: '/receptionist',
        lab_tech: '/lab',
        pharmacist: '/pharmacy',
        billing: '/billing',
        patient: '/patient'
      };
      const targetRoute = roleRoutes[primaryRole] || '/patient';
      console.log(`Redirecting to ${targetRoute} based on primary role: ${primaryRole}`);
      navigate(targetRoute);
    } else if (roles && roles.length > 0) {
      // Fallback to priority order if no primary role set
      console.log('No primary role, using role priority order:', roles);
      if (roles.includes('admin')) {
        console.log('Redirecting to /admin');
        navigate('/admin');
      } else if (roles.includes('doctor')) {
        console.log('Redirecting to /doctor');
        navigate('/doctor');
      } else if (roles.includes('nurse')) {
        console.log('Redirecting to /nurse');
        navigate('/nurse');
      } else if (roles.includes('receptionist')) {
        console.log('Redirecting to /receptionist');
        navigate('/receptionist');
      } else if (roles.includes('lab_tech')) {
        console.log('Redirecting to /lab');
        navigate('/lab');
      } else if (roles.includes('pharmacist')) {
        console.log('Redirecting to /pharmacy');
        navigate('/pharmacy');
      } else if (roles.includes('billing')) {
        console.log('Redirecting to /billing');
        navigate('/billing');
      } else {
        console.log('No matching role, redirecting to /patient');
        navigate('/patient');
      }
    } else {
      // No roles found, redirect to patient dashboard as default
      console.log('No roles found, redirecting to /patient as default');
      navigate('/patient');
    }
  }, [user, primaryRole, roles, loading, rolesLoaded, navigate, retryCount]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default Index;