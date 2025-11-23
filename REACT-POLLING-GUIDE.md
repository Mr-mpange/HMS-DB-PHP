# React Polling System - Complete Guide

## Overview

This guide shows how to implement proper React polling that:
- ✅ Updates data automatically without page reload
- ✅ Uses proper React patterns (useEffect, useState, useCallback)
- ✅ Prevents memory leaks with cleanup functions
- ✅ Handles errors gracefully
- ✅ Supports multiple independent polling instances
- ✅ Allows conditional polling (enable/disable)
- ✅ Provides manual refresh capability

## Architecture

### 1. Base Polling Hook (`usePolling.ts`)
Generic hook for executing any function at regular intervals with proper cleanup.

### 2. Data Polling Hook (`useDataPolling.ts`)
Specialized hook for polling API endpoints with state management.

### 3. Example Components
Real-world examples showing how to use the hooks.

---

## Installation

The hooks are already created in your project:
- `src/hooks/usePolling.ts`
- `src/hooks/useDataPolling.ts`
- `src/components/examples/PollingExample.tsx`
- `src/components/examples/MultiplePollingExample.tsx`

---

## Usage Examples

### Example 1: Simple Polling

```typescript
import { useDataPolling } from '@/hooks/useDataPolling';

function MyComponent() {
  const { data, loading, error, refresh } = useDataPolling({
    endpoint: '/appointments',
    interval: 30000, // 30 seconds
    enabled: true
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Refresh Now</button>
      {data?.appointments?.map(apt => (
        <div key={apt.id}>{apt.patient_name}</div>
      ))}
    </div>
  );
}
```

### Example 2: Conditional Polling

```typescript
function ConditionalPolling() {
  const [isActive, setIsActive] = useState(true);

  const { data } = useDataPolling({
    endpoint: '/queue',
    interval: 10000,
    enabled: isActive // Only poll when active
  });

  return (
    <div>
      <button onClick={() => setIsActive(!isActive)}>
        {isActive ? 'Pause' : 'Resume'} Polling
      </button>
      {/* Component content */}
    </div>
  );
}
```

### Example 3: Multiple Polling Instances

```typescript
function Dashboard() {
  // Each polls independently at different intervals
  const { data: patients } = useDataPolling({
    endpoint: '/patients',
    interval: 30000 // 30 seconds
  });

  const { data: appointments } = useDataPolling({
    endpoint: '/appointments',
    interval: 20000 // 20 seconds
  });

  const { data: stats } = useDataPolling({
    endpoint: '/stats',
    interval: 60000 // 60 seconds
  });

  return (
    <div>
      <StatsCard data={stats} />
      <PatientsList data={patients} />
      <AppointmentsList data={appointments} />
    </div>
  );
}
```

### Example 4: With Data Transformation

```typescript
const { data } = useDataPolling({
  endpoint: '/appointments',
  interval: 30000,
  transform: (response) => {
    // Transform API response before setting state
    return response.appointments.map(apt => ({
      ...apt,
      displayName: `${apt.patient.full_name} - ${apt.appointment_time}`
    }));
  }
});
```

### Example 5: With Error Handling

```typescript
const { data, error } = useDataPolling({
  endpoint: '/critical-data',
  interval: 15000,
  showErrorToast: true, // Show toast on error
  onError: (error) => {
    // Custom error handling
    console.error('Failed to fetch:', error);
    // Could trigger fallback behavior
  },
  onSuccess: (data) => {
    // Custom success handling
    console.log('Data updated:', data);
  }
});
```

---

## API Reference

### `usePolling` Hook

```typescript
usePolling(callback, options)
```

**Parameters:**
- `callback: () => Promise<void> | void` - Function to execute on each poll
- `options: UsePollingOptions`
  - `interval?: number` - Polling interval in ms (default: 30000)
  - `enabled?: boolean` - Enable/disable polling (default: true)
  - `onError?: (error: Error) => void` - Error callback

**Returns:**
- `{ triggerPoll: () => Promise<void> }` - Manual trigger function

### `useDataPolling` Hook

```typescript
useDataPolling<T>(options)
```

**Parameters:**
- `options: UseDataPollingOptions<T>`
  - `endpoint: string` - API endpoint to poll (required)
  - `interval?: number` - Polling interval in ms (default: 30000)
  - `enabled?: boolean` - Enable/disable polling (default: true)
  - `onSuccess?: (data: T) => void` - Success callback
  - `onError?: (error: Error) => void` - Error callback
  - `showErrorToast?: boolean` - Show error toast (default: false)
  - `transform?: (data: any) => T` - Transform response data

**Returns:**
- `data: T | null` - Fetched data
- `loading: boolean` - Loading state
- `error: Error | null` - Error state
- `lastUpdated: Date | null` - Last update timestamp
- `refresh: () => Promise<void>` - Manual refresh function

---

## Best Practices

### 1. ✅ Always Clean Up Intervals

```typescript
useEffect(() => {
  const intervalId = setInterval(() => {
    fetchData();
  }, 30000);

  // CRITICAL: Clean up on unmount
  return () => clearInterval(intervalId);
}, []);
```

### 2. ✅ Use useCallback for Stable References

```typescript
const fetchData = useCallback(async () => {
  const response = await api.get('/data');
  setData(response.data);
}, [/* dependencies */]);

usePolling(fetchData, { interval: 30000 });
```

### 3. ✅ Conditional Polling

```typescript
// Only poll when component is visible
const { data } = useDataPolling({
  endpoint: '/data',
  enabled: isVisible && isAuthenticated
});
```

### 4. ✅ Different Intervals for Different Data

```typescript
// Frequent: Real-time queue (10s)
const { data: queue } = useDataPolling({
  endpoint: '/queue',
  interval: 10000
});

// Normal: Appointments (30s)
const { data: appointments } = useDataPolling({
  endpoint: '/appointments',
  interval: 30000
});

// Infrequent: Stats (60s)
const { data: stats } = useDataPolling({
  endpoint: '/stats',
  interval: 60000
});
```

### 5. ✅ Show Last Updated Time

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
    {/* Data display */}
  </div>
);
```

---

## Common Mistakes to Avoid

### ❌ DON'T: Use window.location.reload()

```typescript
// BAD - Reloads entire page
useEffect(() => {
  setInterval(() => {
    window.location.reload(); // ❌ WRONG
  }, 30000);
}, []);
```

```typescript
// GOOD - Updates only component state
const { data } = useDataPolling({
  endpoint: '/data',
  interval: 30000
}); // ✅ CORRECT
```

### ❌ DON'T: Forget Cleanup

```typescript
// BAD - Memory leak
useEffect(() => {
  setInterval(() => {
    fetchData();
  }, 30000);
  // ❌ No cleanup - interval keeps running after unmount
}, []);
```

```typescript
// GOOD - Proper cleanup
useEffect(() => {
  const intervalId = setInterval(() => {
    fetchData();
  }, 30000);
  
  return () => clearInterval(intervalId); // ✅ Cleanup
}, []);
```

### ❌ DON'T: Create New Functions in Dependencies

```typescript
// BAD - Creates new function on every render
useEffect(() => {
  const intervalId = setInterval(() => {
    api.get('/data').then(setData); // ❌ New function each time
  }, 30000);
  
  return () => clearInterval(intervalId);
}, [api.get]); // ❌ Unstable dependency
```

```typescript
// GOOD - Stable function reference
const fetchData = useCallback(async () => {
  const response = await api.get('/data');
  setData(response.data);
}, []); // ✅ Stable reference

usePolling(fetchData, { interval: 30000 });
```

### ❌ DON'T: Poll When Not Needed

```typescript
// BAD - Polls even when tab is hidden
const { data } = useDataPolling({
  endpoint: '/data',
  interval: 5000,
  enabled: true // ❌ Always polling
});
```

```typescript
// GOOD - Only poll when tab is active
const [isTabActive, setIsTabActive] = useState(true);

const { data } = useDataPolling({
  endpoint: '/data',
  interval: 5000,
  enabled: isTabActive // ✅ Conditional polling
});
```

---

## Performance Optimization

### 1. Debounce State Updates

```typescript
import { debounce } from 'lodash';

const debouncedSetData = useMemo(
  () => debounce(setData, 300),
  []
);

const { data } = useDataPolling({
  endpoint: '/data',
  interval: 5000,
  onSuccess: debouncedSetData
});
```

### 2. Memoize Expensive Computations

```typescript
const { data } = useDataPolling({
  endpoint: '/appointments',
  interval: 30000
});

const sortedAppointments = useMemo(() => {
  return data?.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}, [data]);
```

### 3. Use React.memo for Child Components

```typescript
const AppointmentCard = React.memo(({ appointment }) => {
  return <div>{appointment.patient_name}</div>;
});

function AppointmentsList() {
  const { data } = useDataPolling({
    endpoint: '/appointments',
    interval: 30000
  });

  return (
    <div>
      {data?.map(apt => (
        <AppointmentCard key={apt.id} appointment={apt} />
      ))}
    </div>
  );
}
```

---

## Integration with Existing Components

### Update ReceptionistDashboard

```typescript
// Before: Manual refresh
const fetchData = async () => {
  const response = await api.get('/appointments');
  setAppointments(response.data.appointments);
};

useEffect(() => {
  fetchData();
}, []);

// After: Automatic polling
const { data: appointments, refresh } = useDataPolling({
  endpoint: '/appointments',
  interval: 30000,
  transform: (response) => response.appointments || []
});
```

### Update DoctorDashboard

```typescript
// Replace manual polling with hook
const { data: appointments } = useDataPolling({
  endpoint: `/appointments?doctor_id=${user.id}`,
  interval: 30000,
  enabled: !!user?.id
});

const { data: visits } = useDataPolling({
  endpoint: '/visits?status=Active',
  interval: 20000,
  enabled: !!user?.id
});
```

---

## Testing

### Test Polling Hook

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { usePolling } from '@/hooks/usePolling';

test('calls callback at specified interval', async () => {
  const callback = jest.fn();
  
  renderHook(() => usePolling(callback, { interval: 1000 }));
  
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 3000));
  });
  
  expect(callback).toHaveBeenCalledTimes(3);
});
```

---

## Troubleshooting

### Issue: Polling continues after component unmounts
**Solution:** Ensure cleanup function is called

```typescript
useEffect(() => {
  const intervalId = setInterval(fetchData, 30000);
  return () => clearInterval(intervalId); // Must have this
}, []);
```

### Issue: Too many API calls
**Solution:** Increase interval or use conditional polling

```typescript
const { data } = useDataPolling({
  endpoint: '/data',
  interval: 60000, // Increase from 30s to 60s
  enabled: isVisible // Only poll when visible
});
```

### Issue: State updates after unmount
**Solution:** Use cleanup flag

```typescript
useEffect(() => {
  let isMounted = true;
  
  const fetchData = async () => {
    const response = await api.get('/data');
    if (isMounted) {
      setData(response.data);
    }
  };
  
  const intervalId = setInterval(fetchData, 30000);
  
  return () => {
    isMounted = false;
    clearInterval(intervalId);
  };
}, []);
```

---

## Summary

✅ **Use the provided hooks** - They handle all edge cases  
✅ **Always clean up intervals** - Prevent memory leaks  
✅ **Use conditional polling** - Save resources  
✅ **Different intervals for different data** - Optimize performance  
✅ **Show last updated time** - Better UX  
✅ **Handle errors gracefully** - Better reliability  

❌ **Never use window.location.reload()** - Breaks UX  
❌ **Never forget cleanup** - Causes memory leaks  
❌ **Never poll unnecessarily** - Wastes resources  

---

## Next Steps

1. Replace manual polling in existing dashboards with `useDataPolling`
2. Add last updated timestamps to all polling components
3. Implement conditional polling based on tab visibility
4. Add error boundaries for better error handling
5. Monitor polling performance in production

---

**Your polling system is now production-ready with proper React patterns!** 🚀
