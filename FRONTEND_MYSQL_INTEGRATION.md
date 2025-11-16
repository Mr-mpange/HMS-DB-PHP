# Frontend Integration with MySQL Backend

## 🔄 Complete Migration Guide

This guide shows you how to update your React frontend to work with the new MySQL backend.

## 📦 Step 1: Update Environment Variables

Update your frontend `.env`:

```env
# Remove Supabase variables
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# Add API URL
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000

# Keep ZenoPay
VITE_ZENOPAY_API_KEY=your_key
VITE_ZENOPAY_MERCHANT_ID=your_id
VITE_ZENOPAY_ENV=sandbox
```

## 🔌 Step 2: Create API Client

Replace `src/integrations/supabase/client.ts` with `src/lib/api.ts`:

```typescript
// src/lib/api.ts
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Socket.io client
let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
      auth: {
        token: localStorage.getItem('auth_token')
      }
    });
  }
  return socket;
};

export default api;
```

## 🔐 Step 3: Update Auth Context

Replace `src/contexts/AuthContext.tsx`:

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  primaryRole: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  roles: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch (error) {
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('auth_token', data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
      window.location.href = '/auth';
    }
  };

  const roles = user?.roles || [];

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, roles }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## 📝 Step 4: Update Data Fetching

### Before (Supabase):
```typescript
const { data, error } = await supabase
  .from('patients')
  .select('*')
  .eq('id', patientId);
```

### After (MySQL API):
```typescript
const { data } = await api.get(`/patients/${patientId}`);
const patient = data.patient;
```

## 🔄 Step 5: Real-time Updates

### Before (Supabase):
```typescript
const channel = supabase
  .channel('appointments')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, 
    () => fetchData()
  )
  .subscribe();
```

### After (Socket.io):
```typescript
import { getSocket } from '@/lib/api';

const socket = getSocket();

// Subscribe to updates
socket.emit('subscribe', 'appointments');

// Listen for updates
socket.on('appointment:created', (data) => {
  console.log('New appointment:', data);
  fetchData();
});

socket.on('appointment:updated', (data) => {
  console.log('Appointment updated:', data);
  fetchData();
});

// Cleanup
return () => {
  socket.emit('unsubscribe', 'appointments');
  socket.off('appointment:created');
  socket.off('appointment:updated');
};
```

## 📊 Step 6: Update All API Calls

### Patients

```typescript
// Get all patients
const { data } = await api.get('/patients');
const patients = data.patients;

// Get single patient
const { data } = await api.get(`/patients/${id}`);
const patient = data.patient;

// Create patient
const { data } = await api.post('/patients', patientData);

// Update patient
const { data } = await api.put(`/patients/${id}`, patientData);
```

### Appointments

```typescript
// Get appointments
const { data } = await api.get('/appointments');

// Create appointment
const { data } = await api.post('/appointments', appointmentData);

// Update appointment
const { data } = await api.put(`/appointments/${id}`, appointmentData);
```

### Prescriptions

```typescript
// Get prescriptions
const { data } = await api.get('/prescriptions');

// Create prescription
const { data } = await api.post('/prescriptions', prescriptionData);
```

### Lab Tests

```typescript
// Get lab tests
const { data } = await api.get('/labs');

// Create lab test
const { data } = await api.post('/labs', labTestData);

// Add results
const { data } = await api.post(`/labs/${id}/results`, resultsData);
```

### Billing

```typescript
// Get invoices
const { data } = await api.get('/billing/invoices');

// Create invoice
const { data } = await api.post('/billing/invoices', invoiceData);

// Record payment
const { data } = await api.post('/billing/payments', paymentData);
```

## 🔧 Step 7: Update Utility Functions

### logActivity function

```typescript
// src/lib/utils.ts
import api from './api';

export async function logActivity(action: string, details?: Record<string, any>) {
  try {
    await api.post('/activity/log', {
      action,
      details
    });
  } catch (error) {
    console.warn('Failed to log activity', action, error);
  }
}
```

## 🎨 Step 8: Update Components

### Example: PatientList Component

```typescript
import { useState, useEffect } from 'react';
import api, { getSocket } from '@/lib/api';

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
    
    // Real-time updates
    const socket = getSocket();
    socket.emit('subscribe', 'patients');
    
    socket.on('patient:created', () => fetchPatients());
    socket.on('patient:updated', () => fetchPatients());
    
    return () => {
      socket.emit('unsubscribe', 'patients');
      socket.off('patient:created');
      socket.off('patient:updated');
    };
  }, []);

  const fetchPatients = async () => {
    try {
      const { data } = await api.get('/patients');
      setPatients(data.patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

## 🧪 Step 9: Testing

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   npm run dev
   ```

3. **Test Login**:
   - Email: admin@hospital.com
   - Password: admin123

4. **Test Features**:
   - Create patient
   - Book appointment
   - Check real-time updates

## 📋 Migration Checklist

- [ ] Backend running on port 3000
- [ ] MySQL database created and schema imported
- [ ] Frontend environment variables updated
- [ ] API client created (`src/lib/api.ts`)
- [ ] Auth context updated
- [ ] All Supabase imports removed
- [ ] API calls updated in all components
- [ ] Real-time subscriptions updated
- [ ] Activity logging updated
- [ ] Test all features
- [ ] Test real-time updates
- [ ] Test authentication flow

## 🔍 Find and Replace

Use these patterns to update your code:

### Find:
```typescript
import { supabase } from '@/integrations/supabase/client';
```

### Replace:
```typescript
import api from '@/lib/api';
```

### Find:
```typescript
const { data, error } = await supabase.from('table_name')
```

### Replace:
```typescript
const { data } = await api.get('/endpoint')
```

## 🚀 Production Deployment

1. Update `VITE_API_URL` to production backend URL
2. Update `VITE_SOCKET_URL` to production backend URL
3. Ensure CORS is configured correctly
4. Test all features in production

## 💡 Tips

1. **Error Handling**: API client automatically handles 401 errors
2. **Loading States**: Use try/catch/finally for loading states
3. **Real-time**: Socket.io reconnects automatically
4. **Tokens**: Stored in localStorage, auto-added to requests
5. **Logging**: All activity logged server-side

## 📞 Need Help?

If you encounter issues:
1. Check backend logs
2. Check browser console
3. Verify API endpoints are correct
4. Test with Postman/curl first
5. Check network tab in DevTools

---

**Status**: Ready for Integration  
**Time Required**: 2-4 hours  
**Last Updated**: November 15, 2025
