import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
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
    }
  }, [open, patient]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/services');
      // Filter for direct services (Procedure, Consultation, Emergency)
      const directServices = response.data.services.filter((s: any) => 
        ['Procedure', 'Consultation', 'Emergency', 'Other'].includes(s.service_type) && s.is_active
      );
      setServices(directServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignService = async () => {
    if (!selectedService) {
      toast.error('Please select a service');
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

    setSubmitting(true);
    try {
      const service = services.find(s => s.id === selectedService);
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
      
      // Create patient service
      await api.post('/patient-services', {
        patient_id: patientId,
        service_id: selectedService,
        quantity: quantity,
        unit_price: service.base_price,
        total_price: service.base_price * quantity,
        service_date: new Date().toISOString().split('T')[0],
        status: 'Pending'
      });

      // Create a visit so patient appears in nurse queue
      await api.post('/visits', {
        patient_id: patientId,
        visit_date: new Date().toISOString().split('T')[0],
        reception_status: 'Checked In',
        reception_completed_at: new Date().toISOString(),
        current_stage: 'nurse',
        nurse_status: 'Pending',
        overall_status: 'Active',
        visit_type: 'Quick Service'
      });

      const patientName = isWalkIn ? walkInData.full_name : patient.full_name;
      toast.success(`${service.service_name} assigned to ${patientName}. Patient sent to nurse.`);
      onSuccess();
      onOpenChange(false);
      setSelectedService('');
      setQuantity(1);
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
      <DialogContent className="max-w-md">
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
          <div className="space-y-4">
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
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>

            {selectedServiceData && (
              <div className="p-3 bg-green-50 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Amount:</span>
                  <span className="text-lg font-bold text-green-700">
                    TSh {(selectedServiceData.base_price * quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleAssignService} disabled={submitting || !selectedService}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Service'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
