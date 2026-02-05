<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PatientService;
use App\Models\MedicalService;

class CheckServicePricing extends Command
{
    protected $signature = 'billing:check-service-pricing';
    protected $description = 'Check for services with missing or zero pricing';

    public function handle()
    {
        $this->info('Checking for services with pricing issues...');
        
        // Check PatientServices with zero or null pricing
        $patientServicesWithoutPrice = PatientService::where(function($query) {
            $query->whereNull('unit_price')
                  ->orWhere('unit_price', 0)
                  ->orWhereNull('total_price')
                  ->orWhere('total_price', 0);
        })->with('service', 'patient')->get();
        
        if ($patientServicesWithoutPrice->count() > 0) {
            $this->warn("Found {$patientServicesWithoutPrice->count()} patient services with pricing issues:");
            
            foreach ($patientServicesWithoutPrice as $service) {
                $this->line("Patient Service ID: {$service->id}");
                $this->line("  Patient: " . ($service->patient->full_name ?? 'Unknown'));
                $this->line("  Service: {$service->service_name}");
                $this->line("  Unit Price: {$service->unit_price}");
                $this->line("  Total Price: {$service->total_price}");
                $this->line("  Service Base Price: " . ($service->service->base_price ?? 'N/A'));
                $this->line("");
            }
        } else {
            $this->info('✅ All patient services have proper pricing.');
        }
        
        // Check MedicalServices with zero or null base_price
        $medicalServicesWithoutPrice = MedicalService::where(function($query) {
            $query->whereNull('base_price')
                  ->orWhere('base_price', 0);
        })->get();
        
        if ($medicalServicesWithoutPrice->count() > 0) {
            $this->warn("Found {$medicalServicesWithoutPrice->count()} medical services with missing base prices:");
            
            foreach ($medicalServicesWithoutPrice as $service) {
                $this->line("Medical Service: {$service->service_name}");
                $this->line("  Code: {$service->service_code}");
                $this->line("  Type: {$service->service_type}");
                $this->line("  Base Price: {$service->base_price}");
                $this->line("");
            }
            
            if ($this->confirm('Would you like to set default prices for these services?')) {
                foreach ($medicalServicesWithoutPrice as $service) {
                    $serviceType = strtolower($service->service_type ?? '');
                    
                    // Set default prices based on service type
                    if (str_contains($serviceType, 'lab')) {
                        $defaultPrice = 5000;
                    } elseif (str_contains($serviceType, 'consultation')) {
                        $defaultPrice = 2000;
                    } elseif (str_contains($serviceType, 'medication')) {
                        $defaultPrice = 1000;
                    } else {
                        $defaultPrice = 3000;
                    }
                    
                    $service->base_price = $defaultPrice;
                    $service->save();
                    
                    $this->info("  ✅ Set {$service->service_name} price to TSh{$defaultPrice}");
                }
            }
        } else {
            $this->info('✅ All medical services have proper base pricing.');
        }
        
        $this->info('Service pricing check completed.');
    }
}