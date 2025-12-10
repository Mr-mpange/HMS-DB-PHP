import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import { mobilePaymentService, MobilePaymentRequest } from '@/lib/mobilePaymentService';
import { Loader2, Stethoscope } from 'lucide-react';

interface QuickServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: any; // Optional - can be null for walk-ins
  onSuccess: () => void;
}

export function QuickServiceDialog({ open, onOpenChange, patient, onSuccess }: QuickServiceDialogProps) {
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Multiple services cart
  const [serviceCart, setServiceCart] = useState<Array<{service: any, quantity: number}>>([]);
  
  // Payment fields
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [mobilePhone, setMobilePhone] = useState<string>('');
  
  // Walk-in patient fields
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [walkInData, setWalkInData] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    gender: 'Male'
  });

  useEffect(() => {
    if (open) {
      fetchServices();
      setIsWalkIn(!patient); // If no patient, it's a walk-in
      setServiceCart([]); // Reset cart when dialog opens
    }
  }, [open, patient]);

  // Add service to cart
  const addToCart = () => {
    if (!selectedService) {
      toast.error('Please select a service');
      return;
    }
    
    const service = services.find(s => s.id === selectedService);
    if (!service) return;
    
    // Check if service already in cart
    const existingIndex = serviceCart.findIndex(item => item.service.id === selectedService);
    
    if (existingIndex >= 0) {
      // Update quantity
      const updated = [...serviceCart];
      updated[existingIndex].quantity += quantity;
      setServiceCart(updated);
      toast.success(`Updated ${service.service_name} quantity`);
    } else {
      // Add new service
      setServiceCart([...serviceCart, { service, quantity }]);
      toast.success(`Added ${service.service_name} to cart`);
    }
    
    // Reset selection
    setSelectedService('');
    setQuantity(1);
  };

  // Remove service from cart
  const removeFromCart = (serviceId: string) => {
    setServiceCart(serviceCart.filter(item => item.service.id !== serviceId));
  };

  // Calculate total amount from cart
  const calculateTotal = () => {
    return serviceCart.reduce((total, item) => {
      return total + (item.service.base_price * item.quantity);
    }, 0);
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/services');
      // Filter for active services
      // Quick service can handle ALL service types - patient will be routed to correct department
      const activeServices = response.data.services.filter((s: any) => s.is_active);
      setServices(activeServices);
      console.log('Loaded quick services:', activeServices.length, activeServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignService = async () => {
    if (serviceCart.length === 0) {
      toast.error('Please add at least one service to cart');
      return;
    }

    // Validate walk-in data if needed
    if (isWalkIn) {
      if (!walkInData.full_name || !walkInData.phone || !walkInData.date_of_birth) {
        toast.error('Please fill in all patient details');
        return;
      }
    } else if (!patient?.id) {
      toast.error('No patient selected');
      return;
    }

    // Validate payment
    const totalAmount = calculateTotal();
    
    if (!amountPaid || parseFloat(amountPaid) < totalAmount) {
      toast.error(`Payment required: TSh ${totalAmount.toLocaleString()}`);
      return;
    }

    // Validate mobile money phone if needed
    if (['M-Pesa', 'Airtel Money', 'Tigo Pesa', 'Halopesa'].includes(paymentMethod)) {
      if (!mobilePhone) {
        toast.error('Please enter mobile money phone number');
        return;
      }
      const phoneRegex = /^0[67][0-9]{8}$/;
      if (!phoneRegex.test(mobilePhone)) {
        toast.error('Invalid phone number format. Use 07xxxxxxxx or 06xxxxxxxx');
        return;
      }
    }

    setSubmitting(true);
    try {
      let patientId = patient?.id;

      // Register walk-in patient first if needed
      if (isWalkIn) {
        const registerRes = await api.post('/patients', {
          ...walkInData,
          status: 'Active',
          address: 'Walk-in',
          email: `walkin_${Date.now()}@temp.com` // Temporary email
        });
        
        if (registerRes.data.error) {
          throw new Error(registerRes.data.error);
        }
        
        patientId = registerRes.data.patient?.id || registerRes.data.patientId;
        toast.success(`Patient ${walkInData.full_name} registered`);
      }

      // Handle Mobile Money Payment
      if (['M-Pesa', 'Airtel Money', 'Tigo Pesa', 'Halopesa'].includes(paymentMethod)) {
        toast.info(`Initiating ${paymentMethod} payment for Quick Service...`);
        
        const serviceNames = serviceCart.map(item => item.service.service_name).join(', ');
        
        const paymentRequest: any = {
          phoneNumber: mobilePhone,
          amount: totalAmount,
          patientId: patientId,
          paymentType: 'Quick Service',
          paymentMethod: paymentMethod as 'M-Pesa' | 'Airtel Money' | 'Tigo Pesa' | 'Halopesa',
          description: `Quick Service: ${serviceNames}`,
          service_id: serviceCart[0].service.id,
          service_name: serviceNames,
          quantity: serviceCart.reduce((sum, item) => sum + item.quantity, 0),
          unit_price: totalAmount
        };

        const response = await mobilePaymentService.initiatePayment(paymentRequest);

        if (response.success && response.transactionId) {
          toast.success(
            `📱 ${paymentMethod} payment initiated!\n` +
            `Transaction ID: ${response.transactionId.slice(-8)}\n` +
            `Patient will receive payment prompt on their phone.`,
            { duration: 6000 }
          );
          
          // Close dialog and let webhook handle the rest
          onSuccess();
          onOpenChange(false);
          return;
        } else {
          throw new Error(response.error || 'Mobile payment initiation failed');
        }
      }
      
      // Create patient services for all items in cart
      for (const item of serviceCart) {
        await api.post('/patient-services', {
          patient_id: patientId,
          service_id: item.service.id,
          quantity: item.quantity,
          unit_price: item.service.base_price,
          total_price: item.service.base_price * item.quantity,
          service_date: new Date().toISOString().split('T')[0],
          status: 'Completed' // Mark as completed since payment is made upfront
        });
      }

      // Create invoice for all services
      const serviceNames = serviceCart.map(item => 
        `${item.service.service_name} (Qty: ${item.quantity})`
      ).join(', ');
      
      const invoiceRes = await api.post('/invoices', {
        patient_id: patientId,
        invoice_date: new Date().toISOString().split('T')[0],
        total_amount: totalAmount,
        paid_amount: parseFloat(amountPaid),
        balance: 0, // Fully paid
        status: 'Paid',
        notes: `Quick Service: ${serviceNames}`
      });

      const invoiceId = invoiceRes.data.invoice?.id || invoiceRes.data.invoiceId;

      // Create payment record linked to invoice
      await api.post('/payments', {
        patient_id: patientId,
        invoice_id: invoiceId,
        amount: parseFloat(amountPaid),
        payment_method: paymentMethod,
        payment_type: 'Quick Service',
        status: 'Completed',
        payment_date: new Date().toISOString(),
        notes: `Payment for ${serviceNames}`
      });

      // Determine routing based on service types in cart
      // If multiple services, prioritize: Lab > Doctor > Nurse > Pharmacy
      let currentStage = 'nurse'; // Default
      let nurseStatus = 'Not Required';
      let doctorStatus = 'Not Required';
      let labStatus = 'Not Required';
      let pharmacyStatus = 'Not Required';
      let billingStatus = 'Completed'; // Payment already received
      
      const serviceTypes = serviceCart.map(item => item.service.service_type);
      
      // Determine primary destination
      if (serviceTypes.some(t => t === 'Laboratory' || t === 'Radiology' || t === 'Imaging')) {
        currentStage = 'lab';
        labStatus = 'Pending';
      } else if (serviceTypes.some(t => t === 'Consultation' || t === 'Medical')) {
        currentStage = 'doctor';
        doctorStatus = 'Pending';
      } else if (serviceTypes.some(t => t === 'Nursing' || t === 'Procedure' || t === 'Vaccination' || t === 'Diagnostic')) {
        currentStage = 'nurse';
        nurseStatus = 'Pending';
      } else if (serviceTypes.some(t => t === 'Pharmacy')) {
        currentStage = 'pharmacy';
        pharmacyStatus = 'Pending';
      } else {
        currentStage = 'nurse';
        nurseStatus = 'Pending';
      }

      // Create a visit for quick service
      const visitNotes = `Quick Service: ${serviceCart.map(item => item.service.service_name).join(', ')} - Paid upfront`;
      
      await api.post('/visits', {
        patient_id: patientId,
        visit_date: new Date().toISOString().split('T')[0],
        reception_status: 'Completed',
        reception_completed_at: new Date().toISOString(),
        current_stage: currentStage,
        nurse_status: nurseStatus,
        doctor_status: doctorStatus,
        lab_status: labStatus,
        pharmacy_status: pharmacyStatus,
        billing_status: billingStatus,
        overall_status: 'Active',
        visit_type: 'Quick Service',
        notes: visitNotes
      });

      const patientName = isWalkIn ? walkInData.full_name : patient.full_name;
      const change = parseFloat(amountPaid) - totalAmount;
      
      // Determine destination message based on primary service type
      let destination = 'nurse';
      
      if (serviceTypes.some(t => t === 'Laboratory' || t === 'Radiology' || t === 'Imaging')) {
        destination = 'lab';
      } else if (serviceTypes.some(t => t === 'Consultation' || t === 'Medical')) {
        destination = 'doctor';
      } else if (serviceTypes.some(t => t === 'Nursing' || t === 'Procedure' || t === 'Vaccination' || t === 'Diagnostic')) {
        destination = 'nurse';
      } else if (serviceTypes.some(t => t === 'Pharmacy')) {
        destination = 'pharmacy';
      }
      
      const serviceCount = serviceCart.length;
      const serviceList = serviceCart.map(item => item.service.service_name).join(', ');
      
      if (change > 0) {
        toast.success(`${serviceCount} service(s) assigned to ${patientName}. Change: TSh ${change.toLocaleString()}. Patient sent to ${destination}.`, { duration: 5000 });
      } else {
        toast.success(`${serviceCount} service(s) (${serviceList}) assigned to ${patientName}. Payment received. Patient sent to ${destination}.`);
      }
      
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setSelectedService('');
      setQuantity(1);
      setServiceCart([]);
      setPaymentMethod('Cash');
      setAmountPaid('');
      setMobilePhone('');
      setWalkInData({
        full_name: '',
        phone: '',
        date_of_birth: '',
        gender: 'Male'
      });
    } catch (error: any) {
      console.error('Error assigning service:', error);
      toast.error(error.response?.data?.error || 'Failed to assign service');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedServiceData = services.find(s => s.id === selectedService);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Quick Service Assignment
          </DialogTitle>
          <DialogDescription>
            {isWalkIn ? 'Register walk-in patient and assign service' : `Assign a service directly to ${patient?.full_name} without doctor consultation`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto pr-2 flex-1">
            {isWalkIn ? (
              <div className="space-y-3 p-3 bg-blue-50 rounded-md">
                <p className="text-sm font-medium text-blue-900">Walk-in Patient Registration</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="full_name" className="text-xs">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={walkInData.full_name}
                      onChange={(e) => setWalkInData({...walkInData, full_name: e.target.value})}
                      placeholder="Patient name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-xs">Phone *</Label>
                    <Input
                      id="phone"
                      value={walkInData.phone}
                      onChange={(e) => setWalkInData({...walkInData, phone: e.target.value})}
                      placeholder="+255..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dob" className="text-xs">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      value={walkInData.date_of_birth}
                      onChange={(e) => setWalkInData({...walkInData, date_of_birth: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="gender" className="text-xs">Gender *</Label>
                    <Select value={walkInData.gender} onValueChange={(value) => setWalkInData({...walkInData, gender: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Patient</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{patient?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{patient?.phone}</p>
                </div>
              </div>
            )}

            {/* Service Cart */}
            {serviceCart.length > 0 && (
              <div className="space-y-2 p-3 bg-blue-50 rounded-md border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <Label className="text-blue-900 font-semibold">Services Cart ({serviceCart.length})</Label>
                  <Badge variant="default" className="bg-blue-600">
                    Total: TSh {calculateTotal().toLocaleString()}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {serviceCart.map((item) => (
                    <div key={item.service.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.service.service_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × TSh {item.service.base_price.toLocaleString()} = TSh {(item.service.base_price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.service.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Select Service *</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center gap-2">
                        <span>{service.service_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {service.service_type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedServiceData && (
              <div className="p-3 bg-blue-50 rounded-md space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Service Code:</span>
                  <span className="text-sm font-mono">{selectedServiceData.service_code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Price:</span>
                  <span className="text-sm font-semibold">
                    TSh {selectedServiceData.base_price.toLocaleString()}
                  </span>
                </div>
                {selectedServiceData.description && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedServiceData.description}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Quantity</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addToCart}
                  disabled={!selectedService}
                  className="bg-blue-50 hover:bg-blue-100"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Cart
                </Button>
              </div>
            </div>

            {serviceCart.length > 0 && (
              <div className="p-3 bg-green-50 rounded-md border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-green-900">Cart Total:</span>
                  <span className="text-lg font-bold text-green-700">
                    TSh {calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Section */}
            {serviceCart.length > 0 && (
              <div className="space-y-3 p-4 border-2 border-blue-200 rounded-lg bg-blue-50/50">
                <h4 className="font-semibold text-blue-900">Payment Details</h4>
                
                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">💵 Cash</SelectItem>
                      <SelectItem value="Card">💳 Card</SelectItem>
                      <SelectItem value="M-Pesa">📱 M-Pesa</SelectItem>
                      <SelectItem value="Airtel Money">📱 Airtel Money</SelectItem>
                      <SelectItem value="Tigo Pesa">📱 Tigo Pesa</SelectItem>
                      <SelectItem value="Halopesa">📱 Halopesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {['M-Pesa', 'Airtel Money', 'Tigo Pesa', 'Halopesa'].includes(paymentMethod) && (
                  <div className="space-y-2">
                    <Label>Mobile Money Phone Number *</Label>
                    <Input
                      type="tel"
                      placeholder="0712345678"
                      value={mobilePhone}
                      onChange={(e) => setMobilePhone(e.target.value)}
                      pattern="^0[67][0-9]{8}$"
                    />
                    <p className="text-xs text-blue-600">
                      📱 Payment request will be sent to this number
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Amount Paid *</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    min={calculateTotal()}
                  />
                </div>

                {amountPaid && parseFloat(amountPaid) > calculateTotal() && (
                  <div className="p-2 bg-green-100 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">Change:</span>
                      <span className="text-sm font-bold text-green-700">
                        TSh {(parseFloat(amountPaid) - calculateTotal()).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleAssignService} disabled={submitting || serviceCart.length === 0}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              `Assign ${serviceCart.length} Service${serviceCart.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
