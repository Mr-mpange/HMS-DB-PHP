# Patient Reports Feature

## Overview
The Patient Reports feature allows administrators to search for patients, view their complete medical history, and print comprehensive patient reports.

## Location
**Admin Dashboard → Patient Reports Section**

## Features

### 1. Patient Search
- Search by patient name or phone number
- Real-time filtering as you type
- Shows patient demographics (name, phone, gender, age)

### 2. Date Range Filtering (Optional)
- Filter patient history by date range
- Select "From" and "To" dates
- Leave blank to show all history

### 3. Patient History Summary
Displays quick statistics:
- **Total Appointments**: Number of patient appointments
- **Prescriptions**: Total prescriptions issued
- **Lab Tests**: Number of lab tests performed
- **Total Spent**: Sum of all paid invoices

### 4. Print Patient Report
Professional print layout includes:

#### Patient Demographics
- Full name and Patient ID
- Date of birth and age
- Gender, phone, email
- Blood group (if available)

#### Summary Statistics
- Visual cards showing appointments, prescriptions, lab tests, and total spent

#### Appointment History Table
- Date of appointment
- Time
- Doctor name
- Reason for visit
- Status (Scheduled, Completed, Cancelled)

#### Prescriptions Table
- Date prescribed
- Medication name
- Dosage instructions
- Duration

#### Lab Tests & Results Table
- Test date
- Test name
- Results
- Status

#### Billing Summary Table
- Invoice number
- Invoice date
- Amount
- Payment status
- **Total Spent** (sum of all paid invoices)

## How to Use

1. **Navigate to Admin Dashboard**
   - Go to Admin Dashboard
   - Scroll to "Patient Reports" section

2. **Search for Patient**
   - Type patient name or phone in search box
   - Click on patient from dropdown list

3. **Optional: Filter by Date**
   - Select "From Date" to filter history from a specific date
   - Select "To Date" to filter history up to a specific date
   - Leave blank to show complete history

4. **Review Patient History**
   - View summary statistics on screen
   - Check appointments, prescriptions, lab tests, and billing

5. **Print Report**
   - Click "Print Report" button
   - Browser print dialog will open
   - Select printer or "Save as PDF"
   - Report includes HASET Medical Center branding

## Print Layout
The printed report is professionally formatted with:
- HASET Medical Center header
- Generation date and time
- Clean table layouts
- Page break handling for long reports
- Footer with generation timestamp

## Use Cases

### Medical Records
- Patient requests copy of medical history
- Transfer to another facility
- Insurance claims documentation

### Audits
- Internal quality audits
- Compliance reviews
- Medical record verification

### Legal/Administrative
- Court-ordered medical records
- Disability claims
- Workers' compensation cases

## Technical Details

### API Endpoints Used
- `GET /patients` - Fetch all patients
- `GET /appointments?patient_id=:id` - Patient appointments
- `GET /prescriptions?patient_id=:id` - Patient prescriptions
- `GET /lab-tests?patient_id=:id` - Patient lab tests
- `GET /billing/invoices?patient_id=:id` - Patient invoices

### Date Filtering
All endpoints support optional date range parameters:
- `from`: ISO date string (start date)
- `to`: ISO date string (end date)

### Print Styling
- Uses CSS `@media print` queries
- Hides navigation and UI elements
- Shows only report content
- Optimized for A4 paper size

## Future Enhancements
- Export to PDF directly (without print dialog)
- Email report to patient
- Add medical history notes section
- Include allergies and current medications
- Add doctor signatures
- Multi-language support
