import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface DispenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: any;
  medications: any[];
  onDispense: (data: any) => void;
  loading?: boolean;
}

export function DispenseDialog({ 
  open, 
  onOpenChange, 
  prescription, 
  medications,
  onDispense,
  loading = false
}: DispenseDialogProps) {
  
  // Initialize editable medications with prescribed values
  const [editableMedications, setEditableMedications] = useState<any[]>(
    prescription?.medications?.map((med: any) => ({
      ...med,
      dispensed_quantity: med.quantity,
      dispensed_dosage: med.dosage
    })) || []
  );
  
  const [notes, setNotes] = useState('');

  // Update when prescription changes
  useState(() => {
    if (prescription?.medications) {
      setEditableMedications(
        prescription.medications.map((med: any) => ({
          ...med,
          dispensed_quantity: med.quantity,
          dispensed_dosage: med.dosage
        }))
      );
    }
  });

  // Calculate total cost based on edited quantities
  const totalCost = editableMedications.reduce((sum: number, med: any) => {
    const medicationData = medications.find(m => m.id === med.medication_id);
    const unitPrice = medicationData?.unit_price || 0;
    const quantity = med.dispensed_quantity || 0;
    return sum + (unitPrice * quantity);
  }, 0);

  const updateMedication = (index: number, field: string, value: any) => {
    const updated = [...editableMedications];
    updated[index] = { ...updated[index], [field]: value };
    setEditableMedications(updated);
  };

  const handleSubmit = () => {
    onDispense({
      medications: editableMedications,
      notes
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dispense Medication</DialogTitle>
          <DialogDescription>
            Review and confirm medication details before dispensing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Patient Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold mb-2">Patient Information</h4>
            <div className="text-sm">
              <span className="text-muted-foreground">Patient:</span>
              <span className="ml-2 font-medium">{prescription?.patient?.full_name}</span>
            </div>
          </div>

          {/* Medications List - Editable */}
          <div className="space-y-3">
            <h4 className="font-semibold">Medications to Dispense (Editable)</h4>
            {editableMedications.map((med: any, index: number) => {
              const medicationData = medications.find(m => m.id === med.medication_id);
              const unitPrice = medicationData?.unit_price || 0;
              const itemTotal = unitPrice * (med.dispensed_quantity || 0);
              const stockAvailable = medicationData?.stock_quantity || 0;
              
              return (
                <div key={`${index}-${med.medication_id}`} className="p-4 border rounded-lg bg-white">
                  <div className="space-y-3">
                    {/* Medication Selector */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Medication</Label>
                        {stockAvailable === 0 && (
                          <span className="text-xs text-red-600 font-medium">Out of Stock!</span>
                        )}
                      </div>
                      <Select
                        value={med.medication_id}
                        onValueChange={(value) => {
                          const selectedMed = medications.find(m => m.id === value);
                          if (selectedMed) {
                            updateMedication(index, 'medication_id', value);
                            updateMedication(index, 'medication_name', selectedMed.name);
                          }
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select medication" />
                        </SelectTrigger>
                        <SelectContent>
                          {medications
                            .sort((a, b) => {
                              // Sort by stock (available first) then by name
                              if (a.stock_quantity === 0 && b.stock_quantity > 0) return 1;
                              if (a.stock_quantity > 0 && b.stock_quantity === 0) return -1;
                              return a.name.localeCompare(b.name);
                            })
                            .map((medication) => (
                              <SelectItem 
                                key={medication.id} 
                                value={medication.id}
                                disabled={medication.stock_quantity === 0}
                              >
                                {medication.name} (Stock: {medication.stock_quantity})
                                {medication.stock_quantity === 0 && ' - OUT OF STOCK'}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Prescribed: {med.medication_name}
                        {med.medication_id !== medications.find(m => m.name === med.medication_name)?.id && 
                          ' (Substituted)'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Dosage</Label>
                        <Input
                          value={med.dispensed_dosage}
                          onChange={(e) => updateMedication(index, 'dispensed_dosage', e.target.value)}
                          placeholder="e.g., 500mg"
                          className="h-9"
                        />
                        <p className="text-xs text-muted-foreground">
                          Prescribed: {med.dosage}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          min="0"
                          max={stockAvailable}
                          value={med.dispensed_quantity}
                          onChange={(e) => updateMedication(index, 'dispensed_quantity', parseInt(e.target.value) || 0)}
                          className="h-9"
                        />
                        <p className="text-xs text-muted-foreground">
                          Prescribed: {med.quantity} | Stock: {stockAvailable}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        {med.frequency} • {med.duration || 'As prescribed'}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-700">TSh {itemTotal.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {med.dispensed_quantity} × TSh {unitPrice.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {med.instructions && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                        <span className="font-medium">Instructions:</span> {med.instructions}
                      </div>
                    )}

                    {stockAvailable < med.quantity && (
                      <div className="flex items-center gap-1 text-xs text-orange-600 mt-2 p-2 bg-orange-50 rounded">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Low stock: Only {stockAvailable} available (prescribed {med.quantity})</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Cost */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Cost:</span>
              <span className="text-2xl font-bold text-green-700">
                TSh {totalCost.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {editableMedications.length} medication(s) • Total items: {editableMedications.reduce((sum, m) => sum + (m.dispensed_quantity || 0), 0)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Pharmacist Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes or warnings for the patient (e.g., 'Reduced quantity due to affordability')"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
            >
              {loading ? 'Processing...' : `Dispense All (TSh ${totalCost.toLocaleString()})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
