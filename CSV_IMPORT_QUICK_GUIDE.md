# CSV Import Quick Guide

## How to Categorize Services in CSV

### The Key Column: `service_type`

This column tells the system what type of service it is:

| service_type | Used For | Example |
|--------------|----------|---------|
| **Laboratory** | Lab tests | MALARIA, HIV, BLOOD GLUCOSE |
| **Radiology** | X-rays, scans | X-RAY CHEST, ULTRASOUND |
| **Consultation** | Doctor visits | GENERAL CONSULTATION |
| **Procedure** | Medical procedures | WOUND DRESSING, INJECTION |
| **Surgery** | Operations | MINOR SURGERY |
| **Emergency** | Emergency care | EMERGENCY CARE |
| **Ward Stay** | Hospitalization | GENERAL WARD |

## CSV Format:

```csv
service_code,service_name,service_type,description,base_price,currency
LAB001,MALARIA (MRDT),Laboratory,Malaria test,5000,TSH
RAD001,X-RAY CHEST,Radiology,Chest X-ray,25000,TSH
```

## How to Download Template:

1. Go to **Medical Services Dashboard**
2. Click **"Download Template"** button
3. Template includes all 13 lab tests from your image
4. Edit prices/names as needed
5. Import back into system

## Important:

✅ Use **"Laboratory"** (capital L) for all lab tests  
✅ System filters by service_type to show only lab tests when ordering  
✅ All lab tests will link to medical_services for consistent pricing  

That's it! The `service_type` column is how the system recognizes what's a lab test! 🎯
