<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Invoice;
use App\Models\Payment;

class FixNegativeBalances extends Command
{
    protected $signature = 'billing:fix-negative-balances';
    protected $description = 'Fix invoices with negative balances by adjusting overpayments';

    public function handle()
    {
        $this->info('Checking for invoices with negative balances...');
        
        $negativeInvoices = Invoice::whereRaw('paid_amount > total_amount')->get();
        
        if ($negativeInvoices->count() === 0) {
            $this->info('No invoices with negative balances found.');
            return;
        }
        
        $this->info("Found {$negativeInvoices->count()} invoices with negative balances:");
        
        foreach ($negativeInvoices as $invoice) {
            $overpayment = $invoice->paid_amount - $invoice->total_amount;
            
            $this->line("Invoice {$invoice->invoice_number}:");
            $this->line("  Total: TSh{$invoice->total_amount}");
            $this->line("  Paid: TSh{$invoice->paid_amount}");
            $this->line("  Overpayment: TSh{$overpayment}");
            
            if ($this->confirm("Fix this invoice by adjusting paid amount to total amount?")) {
                // Get the most recent payment for this invoice
                $lastPayment = Payment::where('invoice_id', $invoice->id)
                    ->orderBy('created_at', 'desc')
                    ->first();
                
                if ($lastPayment && $lastPayment->amount >= $overpayment) {
                    // Reduce the last payment by the overpayment amount
                    $lastPayment->amount -= $overpayment;
                    $lastPayment->notes = ($lastPayment->notes ?: '') . " [Adjusted for overpayment correction]";
                    $lastPayment->save();
                    
                    // Update invoice
                    $invoice->paid_amount = $invoice->total_amount;
                    $invoice->balance = 0;
                    $invoice->status = 'Paid';
                    $invoice->save();
                    
                    $this->info("  ✅ Fixed by reducing last payment by TSh{$overpayment}");
                } else {
                    // Just adjust the invoice directly
                    $invoice->paid_amount = $invoice->total_amount;
                    $invoice->balance = 0;
                    $invoice->status = 'Paid';
                    $invoice->save();
                    
                    $this->info("  ✅ Fixed by adjusting invoice paid amount");
                }
            }
        }
        
        $this->info('Negative balance fix completed.');
    }
}