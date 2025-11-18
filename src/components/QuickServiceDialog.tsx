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
  patient: any;
  onSuccess: () => void;
}

export function QuickServiceDialog({ open, onOpenChange, patient, onSuccess }: QuickServiceDialogProps) {
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchServices();
    }
  }, [open]);

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

    if (!patient?.id) {
      toast.error('No patient selected');
      return;
    }

    setSubmitting(true);
    try {
      const service = services.find(s => s.id === selectedService);
      
      await api.post('/patient-services', {
        patient_id: patient.id,
        service_id: selectedService,
        quantity: quantity,
        unit_price: service.base_price,
        total_price: service.base_price * quantity,
        service_date: new Date().toISOString().split('T')[0],
        status: 'Pending'
      });

      toast.success(`${service.service_name} assigned to ${patient.full_name}`);
      onSuccess();
      onOpenChange(false);
      setSelectedService('');
      setQuantity(1);
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
            Assign a service directly to {patient?.full_name} without doctor consultation
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">{patient?.full_name}</p>
                <p className="text-sm text-muted-foreground">{patient?.phone}</p>
              </div>
            </div>

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
