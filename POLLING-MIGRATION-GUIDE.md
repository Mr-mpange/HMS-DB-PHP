# Polling Migration Guide

## Quick Start: Replace Old Polling with New System

### Step 1: Import the Hook

```typescript
import { useDataPolling } from '@/hooks/useDataPolling';
```

### Step 2: Replace Old Code

#### BEFORE (Old Pattern):
```typescript
const [appointments, setAppointments] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments');
      setAppointments(response.data.appointments);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
  
  const intervalId = setInterval(fetchData, 30000);
  
  return () => clearInterval(intervalId);
}, []);
```

#### AFTER (New Pattern):
```typescript
const { data: appointments, loading } = useDataPolling({
  endpoint: '/appointments',
  interval: 30000,
  transform: (response) => response.appointments || []
});
```

**That's it! 15 lines → 4 lines with better functionality!**

---

## Real Examples from Your Codebase

### Example 1: ReceptionistDashboard

#### BEFORE:
```typescript
const fetchData = async (showLoadingIndicator = true) => {
  if (!user) return;
  if (showLoadingIndicator) setLoading(true);
  
  try {
    const appointmentsRes = await api.get('/appointments');
    setAppointments(appointmentsRes.data.appointments || []);
    
    const patientsRes = await api.get('/patients');
    setPatients(patientsRes.data.patients || []);
  } catch (error) {
    console.error('Error:', error);
    toast.error('Failed to load data');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (!user) return;
  fetchData();
  
  const intervalId = setInterval(() => {
    fetchData(false);
  }, 30000);
  
  return () => clearInterval(intervalId);
}, [user]);
```

#### AFTER:
```typescript
const { data: appointments, loading: appointmentsLoading } = useDataPolling({
  endpoint: '/appointments',
  interval: 30000,
  enabled: !!user,
  transform: (response) => response.appointments || []
});

const { data: patients, loading: patientsLoading } = useDataPolling({
  endpoint: '/patients',
  interval: 30000,
  enabled: !!user,
  transform: (response) => response.patients || []
});

const loading = appointmentsLoading || patientsLoading;
```

### Example 2: DoctorDashboard

#### BEFORE:
```typescript
const fetchAppointments = useCallback(async () => {
  if (!user?.id) return;
  
  try {
    setLoading(true);
    const response = await api.get(`/appointments?doctor_id=${user.id}`);
    setAppointments(response.data.appointments);
  } catch (error) {
    console.error('Error:', error);
    toast.error('Failed to load appointments');
  } finally {
    setLoading(false);
  }
}, [user?.id]);

useEffect(() => {
  fetchAppointments();
  const intervalId = setInterval(fetchAppointments, 30000);
  return () => clearInterval(intervalId);
}, [fetchAppointments]);
```

#### AFTER:
```typescript
const { data: appointments, loading } = useDataPolling({
  endpoint: `/appointments?doctor_id=${user?.id}`,
  interval: 30000,
  enabled: !!user?.id,
  transform: (response) => response.appointments || [],
  showErrorToast: true
});
```

### Example 3: NurseDashboard with Multiple Endpoints

#### BEFORE:
```typescript
const [visits, setVisits] = useState([]);
const [patients, setPatients] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const [visitsRes, patientsRes] = await Promise.all([
        api.get('/visits?stage=nurse'),
        api.get('/patients?limit=10')
      ]);
      
      setVisits(visitsRes.data.visits);
      setPatients(patientsRes.data.patients);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
  const intervalId = setInterval(fetchData, 20000);
  return () => clearInterval(intervalId);
}, []);
```

#### AFTER:
```typescript
const { data: visits, loading: visitsLoading } = useDataPolling({
  endpoint: '/visits?stage=nurse',
  interval: 20000,
  transform: (response) => response.visits || []
});

const { data: patients, loading: patientsLoading } = useDataPolling({
  endpoint: '/patients?limit=10',
  interval: 30000,
  transform: (response) => response.patients || []
});

const loading = visitsLoading || patientsLoading;
```

---

## Migration Checklist

For each component with polling:

- [ ] Import `useDataPolling` hook
- [ ] Replace `useState` for data with hook
- [ ] Replace `useEffect` with polling logic
- [ ] Remove manual `setInterval` and cleanup
- [ ] Add `transform` function if needed
- [ ] Add `enabled` condition if needed
- [ ] Test that data updates automatically
- [ ] Verify cleanup on unmount
- [ ] Check for memory leaks

---

## Common Patterns

### Pattern 1: Conditional Polling Based on User

```typescript
// Old
useEffect(() => {
  if (!user) return;
  // ... polling logic
}, [user]);

// New
const { data } = useDataPolling({
  endpoint: '/data',
  enabled: !!user
});
```

### Pattern 2: Different Intervals

```typescript
// Frequent updates (10s)
const { data: queue } = useDataPolling({
  endpoint: '/queue',
  interval: 10000
});

// Normal updates (30s)
const { data: appointments } = useDataPolling({
  endpoint: '/appointments',
  interval: 30000
});

// Infrequent updates (60s)
const { data: stats } = useDataPolling({
  endpoint: '/stats',
  interval: 60000
});
```

### Pattern 3: Manual Refresh Button

```typescript
const { data, refresh } = useDataPolling({
  endpoint: '/data',
  interval: 30000
});

return (
  <div>
    <Button onClick={refresh}>Refresh Now</Button>
    {/* Display data */}
  </div>
);
```

### Pattern 4: Show Last Updated

```typescript
const { data, lastUpdated } = useDataPolling({
  endpoint: '/data',
  interval: 30000
});

return (
  <div>
    {lastUpdated && (
      <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
    )}
    {/* Display data */}
  </div>
);
```

### Pattern 5: Error Handling

```typescript
const { data, error } = useDataPolling({
  endpoint: '/data',
  interval: 30000,
  showErrorToast: true,
  onError: (error) => {
    console.error('Custom error handling:', error);
  }
});

if (error) {
  return <ErrorDisplay error={error} />;
}
```

---

## Testing Your Migration

### 1. Visual Test
- Open component
- Wait 30 seconds
- Verify data updates without page reload
- Check browser console for errors

### 2. Memory Leak Test
- Open component
- Navigate away
- Check browser console - should see cleanup
- No errors about "Can't perform state update on unmounted component"

### 3. Performance Test
- Open browser DevTools → Network tab
- Watch API calls
- Verify calls happen at correct intervals
- No duplicate calls

### 4. Error Handling Test
- Disconnect from backend
- Verify error handling works
- Reconnect
- Verify polling resumes

---

## Rollback Plan

If you need to rollback:

1. Keep old code commented out initially
2. Test new polling thoroughly
3. Remove old code after 1 week of stable operation

```typescript
// Old code (keep for 1 week)
// const [data, setData] = useState([]);
// useEffect(() => { ... }, []);

// New code
const { data } = useDataPolling({ ... });
```

---

## Benefits of Migration

✅ **Less Code** - 70% reduction in polling code  
✅ **No Memory Leaks** - Automatic cleanup  
✅ **Better Performance** - Optimized re-renders  
✅ **Error Handling** - Built-in error management  
✅ **Easier Testing** - Simpler to test  
✅ **Maintainable** - Centralized polling logic  
✅ **Type Safe** - Full TypeScript support  

---

## Need Help?

See `REACT-POLLING-GUIDE.md` for:
- Complete API reference
- Advanced examples
- Troubleshooting guide
- Best practices

---

**Start migrating one component at a time. Test thoroughly. Enjoy cleaner code!** 🚀
