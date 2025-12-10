import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle, FileText } from 'lucide-react';

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formTemplate: any;
  visit: any;
  onSubmit: (formData: any) => void;
  submitting?: boolean;
}

export function ServiceFormDialog({ 
  open, 
  onOpenChange, 
  formTemplate, 
  visit, 
  onSubmit,
  submitting = false
}: ServiceFormDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const renderField = (field: any) => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({
              ...formData,
              [field.name]: e.target.value
            })}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            required={field.required}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({
              ...formData,
              [field.name]: e.target.value
            })}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            required={field.required}
          />
        );
      
      case 'select':
        return (
          <Select
            value={formData[field.name] || ''}
            onValueChange={(value) => setFormData({
              ...formData,
              [field.name]: value
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'textarea':
        return (
          <Textarea
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({
              ...formData,
              [field.name]: e.target.value
            })}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            required={field.required}
            rows={field.rows || 3}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({
              ...formData,
              [field.name]: e.target.value
            })}
            required={field.required}
          />
        );
      
      case 'time':
        return (
          <Input
            type="time"
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({
              ...formData,
              [field.name]: e.target.value
            })}
            required={field.required}
          />
        );
      
      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({
              ...formData,
              [field.name]: e.target.value
            })}
            required={field.required}
          />
        );
      
      default:
        return null;
    }
  };

  const handleSubmit = () => {
    // Validate required fields
    const missingFields = formTemplate.fields
      ?.filter((f: any) => f.required && !formData[f.name])
      .map((f: any) => f.label);
    
    if (missingFields && missingFields.length > 0) {
      toast.error(`Please fill required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    onSubmit(formData);
  };

  if (!formTemplate || !formTemplate.fields) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {formTemplate.title || 'Service Form'}
          </DialogTitle>
          <DialogDescription>
            Complete the form for {visit.patient?.full_name || 'patient'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {formTemplate.fields.map((field: any) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
              {renderField(field)}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? (
              <>Processing...</>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete & Discharge
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
