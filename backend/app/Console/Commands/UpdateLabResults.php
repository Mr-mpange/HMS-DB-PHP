<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\LabTest;

class UpdateLabResults extends Command
{
    protected $signature = 'lab:update-results {test-id : Test ID to update}';
    protected $description = 'Update a lab test with sample results';

    public function handle()
    {
        $testId = $this->argument('test-id');
        
        $test = LabTest::find($testId);
        
        if (!$test) {
            $this->error("Test not found: {$testId}");
            return 1;
        }

        $this->info("Updating test: {$test->test_name} (ID: {$test->id})");
        
        // Create sample results based on test type
        $results = $this->generateSampleResults($test->test_name);
        
        $test->update([
            'results' => json_encode($results),
            'status' => 'Completed',
            'notes' => 'Sample results added via artisan command',
            'updated_at' => now()
        ]);

        $this->info('✅ Test updated successfully!');
        $this->newLine();
        $this->line('Results added:');
        $this->line(json_encode($results, JSON_PRETTY_PRINT));
        
        return 0;
    }

    private function generateSampleResults($testName)
    {
        $testName = strtolower($testName);
        
        if (str_contains($testName, 'hiv')) {
            return [
                'test_date' => now()->format('Y-m-d H:i:s'),
                'performed_by' => 'Lab Technician',
                'results' => [
                    'HIV Antibody Test' => [
                        'value' => 'Negative',
                        'unit' => '',
                        'normal_range' => 'Negative',
                        'status' => 'Normal'
                    ],
                    'HIV-1' => [
                        'value' => 'Not Detected',
                        'unit' => '',
                        'normal_range' => 'Not Detected',
                        'status' => 'Normal'
                    ],
                    'HIV-2' => [
                        'value' => 'Not Detected',
                        'unit' => '',
                        'normal_range' => 'Not Detected',
                        'status' => 'Normal'
                    ]
                ],
                'interpretation' => 'HIV test negative. No HIV antibodies detected.',
                'recommendations' => 'Patient is HIV negative. Recommend routine screening as per guidelines.'
            ];
        } elseif (str_contains($testName, 'cbc') || str_contains($testName, 'blood count')) {
            return [
                'test_date' => now()->format('Y-m-d H:i:s'),
                'performed_by' => 'Lab Technician',
                'results' => [
                    'WBC' => [
                        'value' => '7.5',
                        'unit' => 'x10^9/L',
                        'normal_range' => '4.5-11.0',
                        'status' => 'Normal'
                    ],
                    'RBC' => [
                        'value' => '4.8',
                        'unit' => 'x10^12/L',
                        'normal_range' => '4.5-5.5',
                        'status' => 'Normal'
                    ],
                    'Hemoglobin' => [
                        'value' => '14.2',
                        'unit' => 'g/dL',
                        'normal_range' => '13.5-17.5',
                        'status' => 'Normal'
                    ],
                    'Platelets' => [
                        'value' => '280',
                        'unit' => 'x10^9/L',
                        'normal_range' => '150-400',
                        'status' => 'Normal'
                    ]
                ],
                'interpretation' => 'All blood count parameters within normal limits.',
                'recommendations' => 'No immediate action required. Continue routine monitoring.'
            ];
        } elseif (str_contains($testName, 'malaria')) {
            return [
                'test_date' => now()->format('Y-m-d H:i:s'),
                'performed_by' => 'Lab Technician',
                'results' => [
                    'Result' => [
                        'value' => 'Negative',
                        'unit' => '',
                        'normal_range' => 'Negative',
                        'status' => 'Normal'
                    ],
                    'Parasites' => [
                        'value' => 'None detected',
                        'unit' => '',
                        'normal_range' => 'None',
                        'status' => 'Normal'
                    ]
                ],
                'interpretation' => 'No malaria parasites detected.',
                'recommendations' => 'Malaria ruled out. Consider other causes of symptoms.'
            ];
        } else {
            // Generic results
            return [
                'test_date' => now()->format('Y-m-d H:i:s'),
                'performed_by' => 'Lab Technician',
                'results' => [
                    'Result' => [
                        'value' => 'Normal',
                        'unit' => '',
                        'normal_range' => 'Normal',
                        'status' => 'Normal'
                    ]
                ],
                'interpretation' => 'Test results within normal limits.',
                'recommendations' => 'No immediate action required.'
            ];
        }
    }
}
