# Fix LCP Performance - From 9.03s to <2.5s

## Current Issue

**LCP: 9.03s** ❌ (Poor - should be <2.5s)
**LCP Element:** `h3.text-2xl.font-semibold` (heading text)

This means the main heading takes 9 seconds to render, blocking the entire page.

## Root Causes

1. ❌ **Blocking JavaScript** - Large JS bundles block rendering
2. ❌ **Slow API calls** - Data fetching delays content
3. ❌ **No SSR/SSG** - Client-side rendering is slow
4. ❌ **Large bundle size** - 914KB JS file is huge
5. ❌ **No code splitting** - Everything loads at once
6. ❌ **Render-blocking CSS** - CSS blocks first paint

## Solutions (Implement in Order)

### 1. Immediate Fixes (Get to <4s)

#### A. Add Loading Skeleton for LCP Element

The heading should appear immediately with a skeleton:

```typescript
// src/pages/DoctorDashboard.tsx
export default function DoctorDashboard() {
  const [loading, setLoading] = useState(true);

  // Show skeleton immediately
  if (loading) {
    return (
      <DashboardLayout title="Doctor Dashboard">
        <div className="space-y-6">
          {/* LCP element - show immediately */}
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-3 gap-4">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
          <AppointmentListSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Doctor Dashboard">
      <h3 className="text-2xl font-semibold">Patients Waiting</h3>
      {/* Rest of content */}
    </DashboardLayout>
  );
}
```

#### B. Preload Critical Resources

Add to `index.html`:

```html
<head>
  <!-- Preload critical fonts -->
  <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
  
  <!-- Preconnect to API -->
  <link rel="preconnect" href="http://localhost:8000">
  <link rel="dns-prefetch" href="http://localhost:8000">
  
  <!-- Preload critical CSS -->
  <link rel="preload" href="/src/index.css" as="style">
</head>
```

#### C. Defer Non-Critical JavaScript

Update `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'sonner'],
          'date-vendor': ['date-fns', 'date-fns-tz'],
        }
      }
    }
  }
});
```

### 2. Code Splitting (Get to <3s)

#### A. Lazy Load Routes

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';

// Lazy load heavy components
const DoctorDashboard = lazy(() => import('@/pages/DoctorDashboard'));
const ReceptionistDashboard = lazy(() => import('@/pages/ReceptionistDashboard'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));

function App() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Routes>
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/receptionist" element={<ReceptionistDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Suspense>
  );
}
```

#### B. Lazy Load Heavy Components

```typescript
// Lazy load charts, dialogs, etc.
const PatientDetailsDialog = lazy(() => import('@/components/PatientDetailsDialog'));
const LabResultsChart = lazy(() => import('@/components/LabResultsChart'));

// Use with Suspense
<Suspense fallback={<Skeleton className="h-96" />}>
  <LabResultsChart data={data} />
</Suspense>
```

### 3. Optimize Bundle Size (Get to <2.5s)

#### A. Remove Unused Dependencies

```bash
# Analyze bundle
npm run build
npx vite-bundle-visualizer

# Remove unused packages
npm uninstall unused-package
```

#### B. Use Lighter Alternatives

```typescript
// Instead of: import { format } from 'date-fns'
// Use: import format from 'date-fns/format'

// Instead of: import * as Icons from 'lucide-react'
// Use: import { Calendar, Clock } from 'lucide-react'
```

#### C. Tree Shaking

Update `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

### 4. Optimize Data Fetching (Get to <2s)

#### A. Parallel Data Fetching

```typescript
// BAD - Sequential (slow)
const appointments = await api.get('/appointments');
const visits = await api.get('/visits');
const stats = await api.get('/stats');

// GOOD - Parallel (fast)
const [appointments, visits, stats] = await Promise.all([
  api.get('/appointments'),
  api.get('/visits'),
  api.get('/stats')
]);
```

#### B. Fetch Only Critical Data First

```typescript
useEffect(() => {
  // 1. Fetch critical data first (for LCP)
  const fetchCritical = async () => {
    const stats = await api.get('/stats'); // Small, fast
    setStats(stats.data);
    setLoading(false); // Show content immediately
  };

  // 2. Fetch non-critical data after
  const fetchNonCritical = async () => {
    const [appointments, visits] = await Promise.all([
      api.get('/appointments'),
      api.get('/visits')
    ]);
    setAppointments(appointments.data);
    setVisits(visits.data);
  };

  fetchCritical();
  fetchNonCritical();
}, []);
```

#### C. Use SWR or React Query

```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['appointments'],
  queryFn: () => api.get('/appointments'),
  staleTime: 30000, // Cache for 30s
  cacheTime: 60000
});
```

### 5. Critical CSS Inline (Get to <1.5s)

#### A. Extract Critical CSS

```bash
npm install --save-dev critical
```

```javascript
// build-critical.js
const critical = require('critical');

critical.generate({
  inline: true,
  base: 'dist/',
  src: 'index.html',
  target: 'index.html',
  width: 1300,
  height: 900
});
```

#### B. Defer Non-Critical CSS

```html
<link rel="preload" href="/styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/styles.css"></noscript>
```

### 6. Image Optimization

```typescript
// Use modern formats
<img 
  src="/image.webp" 
  alt="Patient" 
  loading="lazy"
  decoding="async"
  width="100"
  height="100"
/>

// Or use next-gen formats
<picture>
  <source srcset="/image.avif" type="image/avif">
  <source srcset="/image.webp" type="image/webp">
  <img src="/image.jpg" alt="Patient">
</picture>
```

---

## Quick Wins (Implement Now)

### 1. Show Skeleton Immediately

```typescript
// src/pages/DoctorDashboard.tsx
const [isInitialLoad, setIsInitialLoad] = useState(true);

useEffect(() => {
  // Set to false after 100ms to show skeleton
  setTimeout(() => setIsInitialLoad(false), 100);
}, []);

if (isInitialLoad || loading) {
  return <DashboardSkeleton />;
}
```

### 2. Reduce Initial Bundle

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
});
```

### 3. Add Resource Hints

```html
<!-- index.html -->
<head>
  <link rel="preconnect" href="http://localhost:8000">
  <link rel="dns-prefetch" href="http://localhost:8000">
</head>
```

---

## Implementation Priority

### Phase 1: Immediate (Today) - Get to <4s
1. ✅ Add skeleton loaders
2. ✅ Preconnect to API
3. ✅ Show content progressively

### Phase 2: Short-term (This Week) - Get to <2.5s
1. ✅ Code splitting
2. ✅ Lazy load routes
3. ✅ Optimize bundle size
4. ✅ Parallel data fetching

### Phase 3: Long-term (Next Week) - Get to <1.5s
1. ✅ Critical CSS inline
2. ✅ SSR/SSG (if needed)
3. ✅ CDN for static assets
4. ✅ Service worker caching

---

## Measurement

### Before Optimization:
```
LCP: 9.03s ❌
FCP: ~8s
TTI: ~10s
Bundle: 914KB
```

### After Phase 1:
```
LCP: ~3.5s ⚠️
FCP: ~1s
TTI: ~4s
Bundle: 914KB
```

### After Phase 2:
```
LCP: ~2s ✅
FCP: ~0.5s
TTI: ~2.5s
Bundle: ~400KB
```

### After Phase 3:
```
LCP: ~1.2s ✅✅
FCP: ~0.3s
TTI: ~1.5s
Bundle: ~300KB
```

---

## Testing

```bash
# Build and test
npm run build
npm run preview

# Measure with Lighthouse
npx lighthouse http://localhost:4173 --view

# Or use Chrome DevTools
# 1. Open DevTools
# 2. Go to Lighthouse tab
# 3. Run audit
```

---

## Quick Fix Code

Create `src/components/skeletons/DashboardSkeleton.tsx`:

```typescript
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* LCP element - shows immediately */}
      <Skeleton className="h-8 w-64" />
      
      <div className="grid grid-cols-3 gap-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      
      <AppointmentListSkeleton count={5} />
    </div>
  );
}
```

Update `src/pages/DoctorDashboard.tsx`:

```typescript
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';

export default function DoctorDashboard() {
  const [loading, setLoading] = useState(true);

  // Show skeleton immediately
  if (loading) {
    return <DashboardSkeleton />;
  }

  // Actual content
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold">Patients Waiting</h3>
      {/* Rest of content */}
    </div>
  );
}
```

---

## Summary

**Current:** LCP 9.03s ❌
**Target:** LCP <2.5s ✅
**Best:** LCP <1.5s ✅✅

**Key Actions:**
1. Show skeleton immediately
2. Code splitting
3. Parallel data fetching
4. Optimize bundle size
5. Critical CSS inline

**Expected Result:** 5-7x faster LCP

---

*Implement Phase 1 now for immediate 50% improvement!*
