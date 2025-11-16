import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@/types/auth';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';

type AppRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'lab_tech' | 'pharmacist' | 'billing' | 'patient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  loading: boolean;
  rolesLoaded: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [primaryRole, setPrimaryRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const navigate = useNavigate();

  const fetchUserRoles = async (userId: string) => {
    try {
      console.log('Fetching user roles for user:', userId);
      const { data } = await api.get('/auth/me');
      console.log('User roles data received:', data);
      if (data && data.user && data.user.roles) {
        setRoles(data.user.roles as AppRole[]);
        setPrimaryRole(data.user.primaryRole as AppRole || data.user.roles[0]);
      }
      setRolesLoaded(true);
    } catch (error) {
      console.error('Failed to fetch user roles:', error);
      setRolesLoaded(true); // Ensure rolesLoaded is set even on error
    }
  };

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      console.log('Checking for existing session...');
      const token = localStorage.getItem('auth_token');
      console.log('Auth token found:', !!token);
      
      if (token) {
        try {
          console.log('Verifying token and fetching user profile...');
          // Verify token and get user profile
          const { data } = await api.get('/auth/me');
          console.log('User profile data received:', data);
          
          if (data && data.user) {
            const user: User = {
              id: data.user.id,
              email: data.user.email,
              user_metadata: {
                full_name: data.user.full_name,
                role: data.user.role,
              },
            };
            
            const session: Session = {
              access_token: token,
              user: user,
            };
            
            setUser(user);
            setSession(session);
            
            // Fetch roles
            console.log('Fetching user roles...');
            await fetchUserRoles(data.user.id);
          } else {
            // Invalid token
            console.log('Invalid token, removing from localStorage');
            localStorage.removeItem('auth_token');
            setRolesLoaded(true);
          }
        } catch (error) {
          console.error('Session check failed:', error);
          localStorage.removeItem('auth_token');
          setRolesLoaded(true);
        }
      } else {
        console.log('No auth token found, setting rolesLoaded to true');
        setRolesLoaded(true);
      }
      
      console.log('Setting loading to false');
      setLoading(false);
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', {
        email,
        password,
      });
      
      if (data && data.token) {
        // Store token
        localStorage.setItem('auth_token', data.token);
        
        // Set user and session
        const user: User = {
          id: data.user.id,
          email: data.user.email,
          user_metadata: {
            full_name: data.user.full_name,
            role: data.user.primaryRole || data.user.roles[0],
          },
        };
        
        const session: Session = {
          access_token: data.token,
          user: user,
        };
        
        setUser(user);
        setSession(session);
        
        // Set roles from login response
        setRoles(data.user.roles as AppRole[]);
        setPrimaryRole(data.user.primaryRole as AppRole || data.user.roles[0]);
        setRolesLoaded(true);
        
        return { error: null };
      }
      
      return { error: { message: 'Login failed' } };
    } catch (error: any) {
      console.error('Sign in error:', error);
      setRolesLoaded(true); // Ensure rolesLoaded is set even on error
      return { 
        error: { 
          message: error.response?.data?.error || 'Invalid email or password' 
        } 
      };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      const { data } = await api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
        phone: phone,
      });
      
      if (data && data.success) {
        return { error: null };
      }
      
      return { error: { message: 'Registration failed' } };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { 
        error: { 
          message: error.response?.data?.message || 'Registration failed' 
        } 
      };
    }
  };

  const signOut = async () => {
    // Clear local storage
    localStorage.removeItem('auth_token');
    
    // Clear state
    setUser(null);
    setSession(null);
    setRoles([]);
    setPrimaryRole(null);
    
    // Navigate to auth page
    navigate('/auth');
  };

  const refreshRoles = async () => {
    if (user) {
      await fetchUserRoles(user.id);
    }
  };

  const hasRole = (role: AppRole) => {
    return roles.includes(role);
  };

  return (
    <AuthContext.Provider value={{ user, session, roles, primaryRole, loading, rolesLoaded, signIn, signUp, signOut, hasRole, refreshRoles }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return {
      user: null,
      session: null,
      roles: [],
      primaryRole: null,
      loading: true,
      rolesLoaded: false,
      signIn: async () => ({ error: null }),
      signUp: async () => ({ error: null }),
      signOut: async () => {},
      hasRole: () => false,
      refreshRoles: async () => {},
    };
  }
  return context;
};