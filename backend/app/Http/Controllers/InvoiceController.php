<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Invoice::with(['patient', 'items']);
        
        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }
        
        if ($request->has('from')) {
            $query->where('created_at', '>=', $request->from);
        }
        
        if ($request->has('to')) {
            $query->where('created_at', '<=', $request->to);
        }
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        $limit = $request->get('limit', 50);
        $invoices = $query->orderBy('created_at', 'desc')->limit($limit)->get();
        
        return response()->json(['invoices' => $invoices]);
    }
    
    public function show($id)
    {
        $invoice = Invoice::with(['patient', 'items'])->findOrFail($id);
        return response()->json(['invoice' => $invoice]);
    }
    
    public function store(Request $request)
    {
        $request->validate([
            'invoice_number' => 'required|string|unique:invoices',
            'patient_id' => 'required|exists:patients,id',
            'total_amount' => 'required|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:Pending,Paid,Partially Paid,Cancelled',
            'invoice_date' => 'required|date',
        ]);
        
        $totalAmount = $request->total_amount;
        $paidAmount = $request->paid_amount ?? 0;
        $balance = $totalAmount - $paidAmount;
        
        $invoice = Invoice::create([
            'id' => Str::uuid(),
            'invoice_number' => $request->invoice_number,
            'patient_id' => $request->patient_id,
            'total_amount' => $totalAmount,
            'paid_amount' => $paidAmount,
            'balance' => $balance,
            'status' => $request->status ?? 'Pending',
            'invoice_date' => $request->invoice_date,
            'notes' => $request->notes,
        ]);
        
        // Create invoice items if provided
        if ($request->has('items') && is_array($request->items)) {
            foreach ($request->items as $item) {
                \App\Models\InvoiceItem::create([
                    'id' => Str::uuid(),
                    'invoice_id' => $invoice->id,
                    'service_id' => $item['service_id'] ?? null,
                    'description' => $item['service_name'] ?? $item['description'] ?? 'Service',
                    'quantity' => $item['quantity'] ?? 1,
                    'unit_price' => $item['unit_price'] ?? 0,
                    'total_price' => $item['total_price'] ?? ($item['unit_price'] * $item['quantity']),
                ]);
            }
        }
        
        // Reload invoice with items
        $invoice->load('items', 'patient');
        
        return response()->json(['invoice' => $invoice], 201);
    }
    
    public function update(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);
        
        $request->validate([
            'paid_amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:Pending,Paid,Partially Paid,Cancelled',
        ]);
        
        $invoice->update($request->only(['paid_amount', 'status', 'notes']));
        
        return response()->json(['invoice' => $invoice]);
    }
    
    public function destroy($id)
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->delete();
        
        return response()->json(['message' => 'Invoice deleted successfully']);
    }
    
    public function storeItem(Request $request)
    {
        $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'description' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
        ]);
        
        $item = InvoiceItem::create([
            'id' => Str::uuid(),
            'invoice_id' => $request->invoice_id,
            'description' => $request->description,
            'quantity' => $request->quantity,
            'unit_price' => $request->unit_price,
            'total_price' => $request->quantity * $request->unit_price,
        ]);
        
        return response()->json(['item' => $item], 201);
    }
}
