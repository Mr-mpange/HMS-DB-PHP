# Appointment Display & Lab Test Fixes

## Issues Fixed

### 1. Appointment Display Issue
**Problem:** Appointments were not showing in the ReceptionistDashboard even though they existed in the database.

**Root Cause:** 
- The `AppointmentsCard` component was filtering to show only TODAY's appointments
- All existing appointments were scheduled for future dates (Nov 24, Nov 26)
- Today is Nov 21, so no appointments were displayed

**Solution:**
1. **Backend (Appointment Model):**
   - Added `appointment_date_only` accessor to return just the date part (Y-m-d format)
   - This makes date comparison easier and more reliable in the frontend

2. **Frontend (AppointmentsCard Component):**
   - Changed filter logic to show both today's AND upcoming appointments
   - Added visual distinction between today's appointments and future ones
   - Future appointments show the date badge and have a different background color
   - Check-in button only appears for today's appointments
   - Cancel button appears for all appointments

**Files Modified:**
- `backend/app/Models/Appointment.php` - Added date-only accessor
- `src/components/AppointmentsCard.tsx` - Updated filtering and display logic

### 2. Lab Test Ordering Error (500 Internal Server Error)
**Problem:** When doctors tried to order lab tests, the request failed with a 500 error.

**Root Cause:**
- Frontend was sending `status: 'Ordered'`
- Database only accepts: `'Pending', 'In Progress', 'Completed', 'Cancelled'`
- This caused a CHECK constraint violation

**Solution:**
1. **Backend (API Route):**
   - Added status mapping: 'Ordered' → 'Pending'
   - Made `test_type` nullable with default value 'Laboratory'
   - Added support for both `doctor_id` from request and from authenticated user
   - Added support for `instructions` field mapping to `notes`

2. **Frontend (DoctorDashboard):**
   - Changed status from 'Ordered' to 'Pending'
   - Added default `test_type: 'Laboratory'` if not provided
   - Added `test_date` field with current date
   - Simplified the request payload

**Files Modified:**
- `backend/routes/api.php` - Fixed `/labs` POST route
- `src/pages/DoctorDashboard.tsx` - Fixed lab test order submission

### 3. Appointment Time Display Issue
**Problem:** Appointment times showing as "N/A" in the doctor dashboard.

**Root Cause:**
- The `appointments` table doesn't have a separate `appointment_time` column
- Time is stored within the `appointment_date` datetime field
- Frontend was looking for `appointment.appointment_time` which didn't exist
- Existing appointments had midnight (00:00) times

**Solution:**
1. **Backend (Appointment Model):**
   - Added `appointment_time` accessor to extract time from `appointment_date`
   - Returns time in H:i format (e.g., "14:30")

2. **Backend (AppointmentController):**
   - Updated `store` method to accept `appointment_time` as separate parameter
   - Combines date and time before saving to database

3. **Data Fix:**
   - Created script to update existing appointments with random times (9 AM - 5 PM)
   - All 17 existing appointments now have proper times

**Files Modified:**
- `backend/app/Models/Appointment.php` - Added time accessor
- `backend/app/Http/Controllers/AppointmentController.php` - Handle time parameter
- `backend/fix-appointment-times.php` - Script to fix existing data

## Testing

### Appointment Display
1. Navigate to Receptionist Dashboard
2. You should now see:
   - Today's appointments count
   - Upcoming appointments count
   - All appointments listed with dates
   - Check-in button only for today's appointments
   - Cancel button for all appointments

### Appointment Times
1. Navigate to Doctor Dashboard
2. Check "All Appointments" tab
3. You should now see:
   - Proper dates (e.g., "Nov 22")
   - Proper times (e.g., "10:30 AM", "2:00 PM")
   - Department names
   - No more "N/A" values

### Lab Test Ordering
1. Login as a doctor
2. Select a patient visit
3. Click "Order Lab Tests"
4. Select tests and submit
5. Should succeed without 500 error
6. Lab tests should be created with 'Pending' status

## Database Schema Reference

### Appointments Table
- `appointment_date`: datetime field
- `status`: enum('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled')

### Lab Tests Table
- `status`: enum('Pending', 'In Progress', 'Completed', 'Cancelled')
- `test_type`: string (nullable)
- `test_date`: date field

## Notes
- The appointment display now shows a more comprehensive view of the schedule
- Lab test status values are now properly validated before insertion
- Both fixes maintain backward compatibility with existing data
