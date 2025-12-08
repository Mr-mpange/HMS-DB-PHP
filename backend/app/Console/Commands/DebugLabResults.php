<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\LabTest;

class DebugLabResults extends Command
{
    protected $signature = 'lab:debug {--test-id= : Specific test ID to debug}';
    protected $description = 'Debug lab test results and show what data is stored';

    public function handle()
    {
        $this->info('=== LAB RESULTS DEBUG ===');
        $this->newLine();

        $testId = $this->option('test-id');

        if ($testId) {
            // Debug specific test
            $test = LabTest::with(['patient', 'doctor'])->find($testId);
            
            if (!$test) {
                $this->error("Test not found: {$testId}");
                return 1;
            }

            $this->debugTest($test);
        } else {
            // Show all completed tests
            $tests = LabTest::with(['patient', 'doctor'])
                ->where('status', 'Completed')
                ->orderBy('updated_at', 'desc')
                ->limit(10)
                ->get();

            if ($tests->isEmpty()) {
                $this->warn('No completed tests found');
                return 0;
            }

            $this->info("Found {$tests->count()} completed test(s):");
            $this->newLine();

            foreach ($tests as $test) {
                $this->debugTest($test);
                $this->newLine();
                $this->line(str_repeat('-', 80));
                $this->newLine();
            }
        }

        return 0;
    }

    private function debugTest($test)
    {
        $this->info("Test ID: {$test->id}");
        $this->line("Test Name: {$test->test_name}");
        $this->line("Test Type: {$test->test_type}");
        $this->line("Status: {$test->status}");
        $this->line("Patient: " . ($test->patient ? $test->patient->full_name : 'N/A'));
        $this->line("Doctor: " . ($test->doctor ? $test->doctor->name : 'N/A'));
        $this->line("Test Date: {$test->test_date}");
        $this->line("Updated: {$test->updated_at}");
        $this->newLine();

        // Check results field
        $this->info("Results Field:");
        if ($test->results) {
            $this->line("Type: " . gettype($test->results));
            $this->line("Raw value:");
            $this->line($test->results);
            $this->newLine();

            // Try to parse as JSON
            try {
                $parsed = is_string($test->results) ? json_decode($test->results, true) : $test->results;
                if ($parsed) {
                    $this->info("Parsed JSON:");
                    $this->line(json_encode($parsed, JSON_PRETTY_PRINT));
                } else {
                    $this->warn("Could not parse as JSON");
                }
            } catch (\Exception $e) {
                $this->error("Error parsing: " . $e->getMessage());
            }
        } else {
            $this->warn("Results field is NULL");
        }

        $this->newLine();
        $this->line("Notes: " . ($test->notes ?: 'None'));
    }
}
