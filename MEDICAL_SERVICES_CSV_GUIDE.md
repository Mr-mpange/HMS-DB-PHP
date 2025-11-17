# Medical Services CSV Import Guide

## How to Categorize Services

### Service Types (service_type column):

1. **Laboratory** - All lab tests
   - Blood tests (Malaria, HIV, Hepatitis, etc.)
   - Urine tests (Urinalysis, Pregnancy test, etc.)
   - Stool analysis
   - Blood grouping
   - Any diagnostic lab test

2. **Radiology** - Imaging services
   - X-Rays (Chest, Abdomen, etc.)
   - Ultrasound
   - CT Scan
   - MRI
   - Any imaging service

3. **Consultation** - Doctor visits
   - General consultation
   - Specialist consultation
   - Follow-up visits

4. **Procedure** - Medical procedures
   - Wound dressing
   - Injections
   - IV cannulation
   - Catheterization
   - Minor procedures

5. **Surgery** - Surgical operations
   - Minor surgery
   - Major surgery
   - Specific operations

6. **Emergency** - Emergency services
   - Emergency room care
   - Trauma care
   - Urgent care

7. **Ward Stay** - Hospitalization
   - General ward per day
   - Private ward per day
   - ICU per day

8. **Pharmacy** - Medications (usually managed separately)

9. **Other** - Miscellaneous services

## CSV Format:

```csv
service_code,service_name,service_type,description,base_price,currency
LAB001,MALARIA (MRDT),Laboratory,Malaria Rapid Diagnostic Test,5000,TSH
RAD001,X-RAY CHEST,Radiology,Chest X-Ray,25000,TSH
CONS001,GENERAL CONSULTATION,Consultation,General Medical Consultation,20000,TSH
```

## Service Code Naming Convention:

- **LAB###** - Laboratory tests (LAB001, LAB002, etc.)
- **RAD###** - Radiology services (RAD001, RAD002, etc.)
- **CONS###** - Consultations (CONS001, CONS002, etc.)
- **PROC###** - Procedures (PROC001, PROC002, etc.)
- **SURG###** - Surgeries (SURG001, SURG002, etc.)
- **EMRG###** - Emergency (EMRG001, EMRG002, etc.)
- **WARD###** - Ward stays (WARD001, WARD002, etc.)

## How the System Uses service_type:

### For Lab Tests:
When a doctor orders a lab test, the system:
1. Filters medical_services WHERE service_type LIKE '%lab%'
2. Shows only laboratory services
3. Links the lab test order to the service
4. Uses the service price for billing

### For Billing:
- All services are billed using base_price from medical_services
- Consistent pricing across the system
- Easy to update prices in one place

## Example: Your Lab Services

Based on your image, here's how to format them:

```csv
service_code,service_name,service_type,description,base_price,currency
LAB001,MALARIA (MRDT),Laboratory,Malaria Rapid Diagnostic Test - 20 min turnaround,5000,TSH
LAB002,MALARIA (BS),Laboratory,Malaria Blood Smear - 1 hour turnaround,8000,TSH
LAB003,HEPATITIS B,Laboratory,Hepatitis B Test - 20 min turnaround,15000,TSH
LAB004,H. PYLORI,Laboratory,H. Pylori Test - 20 min turnaround,12000,TSH
LAB005,HIV,Laboratory,HIV Test - 20 min turnaround,10000,TSH
LAB006,VDRL,Laboratory,VDRL Test - 15 min turnaround,8000,TSH
LAB007,BLOOD GLUCOSE TEST,Laboratory,Blood Glucose Test - 5 min turnaround,3000,TSH
LAB008,HAEMOGLOBIN TEST,Laboratory,Haemoglobin Test - 5 min turnaround,3000,TSH
LAB009,ABO BLOOD GROUPING,Laboratory,ABO Blood Grouping - 10 min turnaround,5000,TSH
LAB010,URINALYSIS,Laboratory,Urinalysis - 20 min turnaround,5000,TSH
LAB011,URINE SEDIMENT,Laboratory,Urine Sediment - 20 min turnaround,6000,TSH
LAB012,URINE PREGNANCY TEST,Laboratory,Urine Pregnancy Test - 5 min turnaround,3000,TSH
LAB013,STOOL ANALYSIS,Laboratory,Stool Analysis - 20 min turnaround,5000,TSH
```

## How to Import:

1. Create/edit your CSV file with proper service_type
2. Save as UTF-8 encoding
3. Use the import feature in the system
4. Services will be automatically categorized

## Key Points:

✅ **service_type** determines where the service appears
✅ Use **"Laboratory"** for all lab tests
✅ Use **"Radiology"** for X-rays, scans, etc.
✅ Use **"Consultation"** for doctor visits
✅ System automatically filters by service_type when needed

