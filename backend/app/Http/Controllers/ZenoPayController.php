<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ZenoPayController extends Controller
{
    private $apiKey;
    private $merchantId;
    private $apiUrl;
    private $callbackUrl;
    private $returnUrl;

    public function __construct()
    {
        $this->apiKey = env('ZENOPAY_API_KEY');
        $this->merchantId = env('ZENOPAY_MERCHANT_ID');
        $this->apiUrl = env('ZENOPAY_API_URL', 'https://api.zenopay.com');
        $this->callbackUrl = env('ZENOPAY_CALLBACK_URL');
        $this->returnUrl = env('ZENOPAY_RETURN_URL');
    }

    /**
     * Initiate ZenoPay payment
     */
    public function initiatePayment(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => 'required|uuid|exists:invoices,id',
            'amount' => 'required|numeric|min:1000',
            'customer_name' => 'required|string',
            'customer_email' => 'required|email',
            'customer_phone' => 'required|string',
        ]);

        try {
            $invoice = Invoice::with('patient')->findOrFail($validated['invoice_id']);
            
            // Create payment reference
            $reference = 'INV-' . $invoice->invoice_number . '-' . time();

            // Prepare ZenoPay request
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl . '/v1/payments/initiate', [
                'merchant_id' => $this->merchantId,
                'amount' => $validated['amount'],
                'currency' => 'TZS',
                'reference' => $reference,
                'customer' => [
                    'name' => $validated['customer_name'],
                    'email' => $validated['customer_email'],
                    'phone' => $validated['customer_phone'],
                ],
                'callback_url' => $this->callbackUrl,
                'return_url' => $this->returnUrl,
                'metadata' => [
                    'invoice_id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'patient_id' => $invoice->patient_id,
                ],
            ]);

            if ($response->successful()) {
                $data = $response->json();

                // Create pending payment record
                Payment::create([
                    'id' => Str::uuid(),
                    'patient_id' => $invoice->patient_id,
                    'invoice_id' => $invoice->id,
                    'amount' => $validated['amount'],
                    'payment_method' => 'ZenoPay',
                    'payment_type' => 'Invoice Payment',
                    'status' => 'Pending',
                    'payment_date' => now(),
                    'reference_number' => $reference,
                    'notes' => 'ZenoPay payment initiated',
                ]);

                return response()->json([
                    'success' => true,
                    'payment_url' => $data['payment_url'] ?? null,
                    'reference' => $reference,
                    'message' => 'Payment initiated successfully',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to initiate payment',
                'error' => $response->json(),
            ], 400);

        } catch (\Exception $e) {
            Log::error('ZenoPay initiation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Payment initiation failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Handle ZenoPay callback/webhook
     */
    public function handleCallback(Request $request)
    {
        try {
            // Verify webhook signature
            $signature = $request->header('X-ZenoPay-Signature');
            $webhookSecret = env('ZENOPAY_WEBHOOK_SECRET');
            
            if ($webhookSecret && $signature) {
                $expectedSignature = hash_hmac('sha256', $request->getContent(), $webhookSecret);
                if (!hash_equals($expectedSignature, $signature)) {
                    Log::warning('Invalid ZenoPay webhook signature');
                    return response()->json(['error' => 'Invalid signature'], 401);
                }
            }

            $data = $request->all();
            $reference = $data['reference'] ?? null;
            $status = $data['status'] ?? null;

            if (!$reference) {
                return response()->json(['error' => 'Missing reference'], 400);
            }

            // Find payment by reference
            $payment = Payment::where('reference_number', $reference)->first();

            if (!$payment) {
                Log::warning('Payment not found for reference: ' . $reference);
                return response()->json(['error' => 'Payment not found'], 404);
            }

            // Update payment status
            if ($status === 'success' || $status === 'completed') {
                $payment->status = 'Completed';
                $payment->notes = 'Payment completed via ZenoPay';
                $payment->save();

                // Update invoice
                if ($payment->invoice_id) {
                    $invoice = Invoice::find($payment->invoice_id);
                    if ($invoice) {
                        $invoice->paid_amount += $payment->amount;
                        $invoice->balance = $invoice->total_amount - $invoice->paid_amount;
                        
                        if ($invoice->balance <= 0) {
                            $invoice->status = 'Paid';
                        } elseif ($invoice->paid_amount > 0) {
                            $invoice->status = 'Partial';
                        }
                        
                        $invoice->save();
                    }
                }

                Log::info('ZenoPay payment completed: ' . $reference);
            } elseif ($status === 'failed' || $status === 'cancelled') {
                $payment->status = 'Failed';
                $payment->notes = 'Payment ' . $status . ' via ZenoPay';
                $payment->save();

                Log::info('ZenoPay payment ' . $status . ': ' . $reference);
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error('ZenoPay callback error: ' . $e->getMessage());
            return response()->json(['error' => 'Callback processing failed'], 500);
        }
    }

    /**
     * Verify payment status
     */
    public function verifyPayment(Request $request)
    {
        $validated = $request->validate([
            'reference' => 'required|string',
        ]);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->get($this->apiUrl . '/v1/payments/verify/' . $validated['reference']);

            if ($response->successful()) {
                $data = $response->json();

                // Update local payment record
                $payment = Payment::where('reference_number', $validated['reference'])->first();
                
                if ($payment && isset($data['status'])) {
                    if ($data['status'] === 'success' || $data['status'] === 'completed') {
                        $payment->status = 'Completed';
                    } elseif ($data['status'] === 'failed' || $data['status'] === 'cancelled') {
                        $payment->status = 'Failed';
                    }
                    $payment->save();
                }

                return response()->json([
                    'success' => true,
                    'status' => $data['status'] ?? 'unknown',
                    'data' => $data,
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to verify payment',
            ], 400);

        } catch (\Exception $e) {
            Log::error('ZenoPay verification error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get payment status
     */
    public function getPaymentStatus($reference)
    {
        try {
            $payment = Payment::where('reference_number', $reference)->first();

            if (!$payment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'payment' => $payment,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get payment status',
            ], 500);
        }
    }
}
