# Comprehensive Route Testing Script
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Hospital Management System - Route Testing" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$API_URL = "http://localhost:3000/api"
$ADMIN_EMAIL = "admin@hospital.com"
$ADMIN_PASSWORD = "admin123"

if (-not (Test-Path "test-results")) {
    New-Item -ItemType Directory -Path "test-results" | Out-Null
}

Write-Host "[1/10] Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/health" -Method Get
    $response | ConvertTo-Json | Out-File "test-results/health.json"
    Write-Host "Success: Health endpoint working" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "Failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "[2/10] Testing Authentication..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $ADMIN_EMAIL
        password = $ADMIN_PASSWORD
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $response | ConvertTo-Json | Out-File "test-results/login.json"
    $TOKEN = $response.token
    Write-Host "Success: Login successful" -ForegroundColor Green
    Write-Host "Token: $TOKEN" -ForegroundColor Gray
} catch {
    Write-Host "Failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

Write-Host "[3/10] Testing Patients..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/patients" -Method Get -Headers $headers
    $response | ConvertTo-Json | Out-File "test-results/patients-list.json"
    Write-Host "Success: Found patients" -ForegroundColor Green
} catch {
    Write-Host "Failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "[4/10] Testing Appointments..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/appointments" -Method Get -Headers $headers
    $response | ConvertTo-Json | Out-File "test-results/appointments-list.json"
    Write-Host "Success: Found appointments" -ForegroundColor Green
} catch {
    Write-Host "Failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "[5/10] Testing Prescriptions..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/prescriptions" -Method Get -Headers $headers
    $response | ConvertTo-Json | Out-File "test-results/prescriptions-list.json"
    Write-Host "Success: Found prescriptions" -ForegroundColor Green
} catch {
    Write-Host "Failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "[6/10] Testing Lab Tests..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/labs" -Method Get -Headers $headers
    $response | ConvertTo-Json | Out-File "test-results/lab-tests-list.json"
    Write-Host "Success: Found lab tests" -ForegroundColor Green
} catch {
    Write-Host "Failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "[7/10] Testing Pharmacy..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/pharmacy/medications" -Method Get -Headers $headers
    $response | ConvertTo-Json | Out-File "test-results/medications-list.json"
    Write-Host "Success: Found medications" -ForegroundColor Green
} catch {
    Write-Host "Failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "[8/10] Testing Billing..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/billing/invoices" -Method Get -Headers $headers
    $response | ConvertTo-Json | Out-File "test-results/invoices-list.json"
    Write-Host "Success: Found invoices" -ForegroundColor Green
} catch {
    Write-Host "Failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "[9/10] Testing Visits..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/visits" -Method Get -Headers $headers
    $response | ConvertTo-Json | Out-File "test-results/visits-list.json"
    Write-Host "Success: Found visits" -ForegroundColor Green
} catch {
    Write-Host "Failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "[10/10] Testing Users..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/users" -Method Get -Headers $headers
    $response | ConvertTo-Json | Out-File "test-results/users-list.json"
    Write-Host "Success: Found users" -ForegroundColor Green
} catch {
    Write-Host "Failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Green
Write-Host "Results saved in test-results directory" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
