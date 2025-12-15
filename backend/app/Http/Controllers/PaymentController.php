<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with(['patient', 'invoice']);

        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->has('invoice_id')) {
            $query->where('invoice_id', $request->invoice_id);
        }

        if ($request->has('date')) {
            $query->whereDate('payment_date', $request->date);
        }

        // Support date range filtering
        if ($request->has('from')) {
            $fromDate = date('Y-m-d', strtotime($request->from));
            $query->whereRaw('DATE(payment_date) >= ?', [$fromDate]);
            \Log::info('Payment filter FROM:', ['from' => $request->from, 'parsed' => $fromDate]);
        }

        if ($request->has('to')) {
            $toDate = date('Y-m-d', strtotime($request->to));
            $query->whereRaw('DATE(payment_date) <= ?', [$toDate]);
            \Log::info('Payment filter TO:', ['to' => $request->to, 'parsed' => $toDate]);
        }

        $payments = $query->orderBy('payment_date', 'desc')
                         ->paginate($request->get('limit', 50));

        \Log::info('Payments query result:', ['count' => $payments->count(), 'total' => $payments->total()]);

        return response()->json(['payments' => $payments->items(), 'total' => $payments->total()]);
    }

    public function show($id)
    {
        $payment = Payment::with(['patient', 'invoice'])->findOrFail($id);
        return response()->json(['payment' => $payment]);
    }

    public function store(Request $request)
    {
        // Log the incoming request for debugging
        \Log::info('Payment creation request:', $request->all());
        
        $validated = $request->validate([
            'patient_id' => 'nullable|uuid|exists:patients,id',
            'invoice_id' => 'nullable|uuid|exists:invoices,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string|max:50',
            'payment_type' => 'nullable|string|max:100',
            'payment_date' => 'required|date',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ], [
            'patient_id.uuid' => 'The patient ID must be a valid UUID format.',
            'patient_id.exists' => 'The selected patient does not exist in our records.',
            'invoice_id.uuid' => 'The invoice ID must be a valid UUID format.',
            'invoice_id.exists' => 'The selected invoice does not exist in our records.',
        ]);

        $validated['id'] = (string) Str::uuid();
        $validated['status'] = $request->status ?? 'Completed';
        
        $payment = Payment::create($validated);

        // Update invoice if linked
        if (isset($validated['invoice_id']) && $validated['invoice_id']) {
            $invoice = Invoice::find($validated['invoice_id']);
            if ($invoice) {
                $invoice->paid_amount += $validated['amount'];
                $invoice->balance = $invoice->total_amount - $invoice->paid_amount;
                
                if ($invoice->balance <= 0) {
                    $invoice->status = 'Paid';
                } elseif ($invoice->paid_amount > 0) {
                    $invoice->status = 'Partial';
                }
                
                $invoice->save();
            }
        }

        return response()->json(['payment' => $payment->load(['patient', 'invoice'])], 201);
    }

    public function destroy($id)
    {
        $payment = Payment::findOrFail($id);
        
        // Revert invoice if linked
        if ($payment->invoice_id) {
            $invoice = Invoice::find($payment->invoice_id);
            if ($invoice) {
                $invoice->paid_amount -= $payment->amount;
                $invoice->balance = $invoice->total_amount - $invoice->paid_amount;
                
                if ($invoice->balance >= $invoice->total_amount) {
                    $invoice->status = 'Pending';
                } elseif ($invoice->paid_amount > 0) {
                    $invoice->status = 'Partial';
                }
                
                $invoice->save();
            }
        }
        
        $payment->delete();

        return response()->json(['message' => 'Payment deleted successfully']);
    }
}
