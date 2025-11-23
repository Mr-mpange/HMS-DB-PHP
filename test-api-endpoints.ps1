# API Endpoint Testing Script
$baseUrl = "http://127.0.0.1:8000/api"
$token = ""

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "API ENDPOINT TESTING" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "[1] Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Health Check: $($response.status)" -ForegroundColor Green
    Write-Host "   Database: $($response.database)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 2: Register Admin User
Write-Host "[2] Testing User Registration..." -ForegroundColor Yellow
try {
    $registerData = @{
        name = "Test Admin"
        email = "testadmin@test.com"
        password = "Admin@123"
        role = "admin"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerData -ContentType "application/json"
    Write-Host "✅ User Registration: Success" -ForegroundColor Green
    Write-Host "   User: $($response.user.name) ($($response.user.role))`n" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  User Registration: $($_.Exception.Message) (may already exist)`n" -ForegroundColor Yellow
}

# Test 3: Login
Write-Host "[3] Testing Login..." -ForegroundColor Yellow
try {
    $loginData = @{
        email = "testadmin@test.com"
        password = "Admin@123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    $token = $response.token
    Write-Host "✅ Login: Success" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 20))...`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Login Failed: $($_.Exception.Message)`n" -ForegroundColor Red
    exit
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 4: Get Current User
Write-Host "[4] Testing /auth/me..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $headers
    Write-Host "✅ Get Current User: Success" -ForegroundColor Green
    Write-Host "   User: $($response.user.name) - $($response.user.role)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Get Current User Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 5: Get Users
Write-Host "[5] Testing /users..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/users" -Method Get -Headers $headers
    Write-Host "✅ Get Users: Success" -ForegroundColor Green
    Write-Host "   Total Users: $($response.users.Count)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Get Users Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 6: Get User Profiles
Write-Host "[6] Testing /users/profiles..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/users/profiles?role=admin" -Method Get -Headers $headers
    Write-Host "✅ Get User Profiles: Success" -ForegroundColor Green
    Write-Host "   Admin Users: $($response.profiles.Count)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Get User Profiles Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 7: Get User Roles
Write-Host "[7] Testing /users/roles..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/users/roles?role=admin" -Method Get -Headers $headers
    Write-Host "✅ Get User Roles: Success" -ForegroundColor Green
    Write-Host "   Roles Found: $($response.roles.Count)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Get User Roles Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 8: Create Department
Write-Host "[8] Testing /departments (Create)..." -ForegroundColor Yellow
try {
    $deptData = @{
        name = "Test Department"
        description = "Test department for API testing"
        consultation_fee = 50.00
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/departments" -Method Post -Body $deptData -Headers $headers
    $deptId = $response.department.id
    Write-Host "✅ Create Department: Success" -ForegroundColor Green
    Write-Host "   Department: $($response.department.name) (ID: $deptId)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Create Department Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 9: Get Departments
Write-Host "[9] Testing /departments (List)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/departments" -Method Get -Headers $headers
    Write-Host "✅ Get Departments: Success" -ForegroundColor Green
    Write-Host "   Total Departments: $($response.departments.Count)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Get Departments Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 10: Settings - Get
Write-Host "[10] Testing /settings/{key} (Get)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/settings/consultation_fee" -Method Get -Headers $headers
    Write-Host "✅ Get Setting: Success" -ForegroundColor Green
    Write-Host "   consultation_fee: $($response.value)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Get Setting Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 11: Settings - Update
Write-Host "[11] Testing /settings/{key} (Update)..." -ForegroundColor Yellow
try {
    $settingData = @{
        value = "50000"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/settings/consultation_fee" -Method Put -Body $settingData -Headers $headers
    Write-Host "✅ Update Setting: Success" -ForegroundColor Green
    Write-Host "   New Value: $($response.setting.value)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Update Setting Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 12: Department Fees - Get
Write-Host "[12] Testing /departments/fees (Get)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/departments/fees" -Method Get -Headers $headers
    Write-Host "✅ Get Department Fees: Success" -ForegroundColor Green
    Write-Host "   Total Fees: $($response.fees.Count)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Get Department Fees Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 13: Create Patient
Write-Host "[13] Testing /patients (Create)..." -ForegroundColor Yellow
try {
    $patientData = @{
        full_name = "Test Patient"
        date_of_birth = "1990-01-01"
        gender = "Male"
        phone = "+255712345678"
        email = "testpatient@test.com"
        address = "Test Address"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/patients" -Method Post -Body $patientData -Headers $headers
    $patientId = $response.patient.id
    Write-Host "✅ Create Patient: Success" -ForegroundColor Green
    Write-Host "   Patient: $($response.patient.full_name) (ID: $patientId)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Create Patient Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 14: Get Patients
Write-Host "[14] Testing /patients (List)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/patients" -Method Get -Headers $headers
    Write-Host "✅ Get Patients: Success" -ForegroundColor Green
    Write-Host "   Total Patients: $($response.patients.Count)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Get Patients Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 15: Create Service
Write-Host "[15] Testing /services (Create)..." -ForegroundColor Yellow
try {
    $serviceData = @{
        service_name = "Test Service"
        service_type = "Consultation"
        price = 25000
        description = "Test medical service"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/services" -Method Post -Body $serviceData -Headers $headers
    Write-Host "✅ Create Service: Success" -ForegroundColor Green
    Write-Host "   Service: $($response.service.service_name)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Create Service Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 16: Bulk Import Services
Write-Host "[16] Testing /services/bulk..." -ForegroundColor Yellow
try {
    $bulkData = @{
        services = @(
            @{
                service_name = "X-Ray"
                service_type = "Imaging"
                price = 50000
                description = "X-Ray imaging service"
            },
            @{
                service_name = "Blood Test"
                service_type = "Laboratory"
                price = 15000
                description = "Complete blood count"
            }
        )
    } | ConvertTo-Json -Depth 3
    
    $response = Invoke-RestMethod -Uri "$baseUrl/services/bulk" -Method Post -Body $bulkData -Headers $headers
    Write-Host "✅ Bulk Import Services: Success" -ForegroundColor Green
    Write-Host "   Success: $($response.results.success), Failed: $($response.results.failed)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Bulk Import Services Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 17: Get Services
Write-Host "[17] Testing /services (List)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/services" -Method Get -Headers $headers
    Write-Host "✅ Get Services: Success" -ForegroundColor Green
    Write-Host "   Total Services: $($response.services.Count)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Get Services Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 18: Create Invoice
Write-Host "[18] Testing /billing/invoices (Create)..." -ForegroundColor Yellow
try {
    $invoiceData = @{
        invoice_number = "INV-TEST-001"
        patient_id = $patientId
        total_amount = 75000
        paid_amount = 0
        status = "Pending"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/billing/invoices" -Method Post -Body $invoiceData -Headers $headers
    $invoiceId = $response.invoice.id
    Write-Host "✅ Create Invoice: Success" -ForegroundColor Green
    Write-Host "   Invoice: $($response.invoice.invoice_number)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Create Invoice Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 19: Get Invoices
Write-Host "[19] Testing /billing/invoices (List)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/billing/invoices" -Method Get -Headers $headers
    Write-Host "✅ Get Invoices: Success" -ForegroundColor Green
    Write-Host "   Total Invoices: $($response.invoices.Count)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Get Invoices Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 20: Create Invoice Item
Write-Host "[20] Testing /billing/invoice-items (Create)..." -ForegroundColor Yellow
try {
    $itemData = @{
        invoice_id = $invoiceId
        description = "Consultation Fee"
        quantity = 1
        unit_price = 50000
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/billing/invoice-items" -Method Post -Body $itemData -Headers $headers
    Write-Host "✅ Create Invoice Item: Success" -ForegroundColor Green
    Write-Host "   Item: $($response.item.description)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Create Invoice Item Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 21: Create Lab Test
Write-Host "[21] Testing /lab-tests (Create)..." -ForegroundColor Yellow
try {
    $labTestData = @{
        patient_id = $patientId
        test_name = "Complete Blood Count"
        test_type = "Hematology"
        ordered_by = $response.user.id
        status = "Pending"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/lab-tests" -Method Post -Body $labTestData -Headers $headers
    Write-Host "✅ Create Lab Test: Success" -ForegroundColor Green
    Write-Host "   Test: $($response.labTest.test_name)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Create Lab Test Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 22: Get Lab Tests
Write-Host "[22] Testing /lab-tests (List)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/lab-tests" -Method Get -Headers $headers
    Write-Host "✅ Get Lab Tests: Success" -ForegroundColor Green
    Write-Host "   Total Lab Tests: $($response.labTests.Count)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Get Lab Tests Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 23: Get Insurance Companies
Write-Host "[23] Testing /insurance/companies..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/insurance/companies" -Method Get -Headers $headers
    Write-Host "✅ Get Insurance Companies: Success" -ForegroundColor Green
    Write-Host "   Total Companies: $($response.companies.Count)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Get Insurance Companies Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 24: Create Payment
Write-Host "[24] Testing /payments (Create)..." -ForegroundColor Yellow
try {
    $paymentData = @{
        patient_id = $patientId
        amount = 50000
        payment_method = "Cash"
        payment_type = "Consultation"
        status = "Completed"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/payments" -Method Post -Body $paymentData -Headers $headers
    Write-Host "✅ Create Payment: Success" -ForegroundColor Green
    Write-Host "   Payment: $($response.payment.amount) TZS`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Create Payment Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 25: Get Payments
Write-Host "[25] Testing /payments (List)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/payments" -Method Get -Headers $headers
    Write-Host "✅ Get Payments: Success" -ForegroundColor Green
    Write-Host "   Total Payments: $($response.payments.Count)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Get Payments Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 26: Logout
Write-Host "[26] Testing /auth/logout..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/logout" -Method Post -Headers $headers
    Write-Host "✅ Logout: Success" -ForegroundColor Green
    Write-Host "   Message: $($response.message)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Logout Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TESTING COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
