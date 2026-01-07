import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Plus, Trash2 } from 'lucide-react';

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
  
  const [editableMedications, setEditableMedications] = useState<any[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const prescriptionItems = prescription?.items || prescription?.medications || [];
    
    console.log('🔍 DispenseDialog - Prescription data:', {
      prescription: prescription,
      items: prescriptionItems,
      itemsWithDetails: prescriptionItems.map((item: any) => ({
        id: item.id,
        medication_name: item.medication_name,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity
      }))
    });
    
    if (prescriptionItems.length > 0) {
      setEditableMedications(
        prescriptionItems.map((med: any) => ({
          ...med,
          dispensed_quantity: med.quantity,
          dispensed_dosage: med.dosage,
          // Keep original prescription values as defaults
          frequency: med.frequency || '',
          duration: med.duration || '',
          instructions: med.instructions || '',
          original_medication_name: med.medication_name,
          original_dosage: med.dosage,
          original_quantity: med.quantity,
          original_frequency: med.frequency,
          original_duration: med.duration,
          is_new: false
        }))
      );
      setNotes('');
    }
  }, [prescription]);

  const totalCost = editableMedications.reduce((sum: number, med: any) => {
    const medicationData = medications.find(m => m.id === med.medication_id);
    const unitPrice = medicationData?.unit_price || 0;
    const quantity = med.dispensed_quantity || 0;
    return sum + (unitPrice * quantity);
  }, 0);

  const updateMedication = (index: number, field: string, value: any) => {
    const updated = [...editableMedications];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'medication_id') {
      const selectedMed = medications.find(m => m.id === value);
      if (selectedMed) {
        const autoFilledDosage = selectedMed.strength ? 
          (selectedMed.strength + ' ' + (selectedMed.dosage_form || '')).trim() : 
          updated[index].dosage;

        updated[index] = {
          ...updated[index],
          medication_id: value,
          medication_name: selectedMed.name,
          dispensed_dosage: autoFilledDosage,
          prescribed_medication_name: selectedMed.name,
          prescribed_dosage: autoFilledDosage,
          original_medication_name: updated[index].original_medication_name || updated[index].medication_name,
          original_dosage: updated[index].original_dosage || updated[index].dosage,
          original_quantity: updated[index].original_quantity || updated[index].quantity
        };
        
        console.log('Auto-filled dosage for ' + selectedMed.name + ': ' + autoFilledDosage);
      }
    }
    
    setEditableMedications(updated);
  };

  const addNewMedication = () => {
    const newMedication = {
      id: 'new_' + Date.now(),
      medication_id: '',
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: 1,
      dispensed_quantity: 1,
      dispensed_dosage: '',
      instructions: '',
      prescribed_medication_name: '',
      prescribed_dosage: '',
      original_medication_name: '',
      original_dosage: '',
      original_quantity: 1,
      is_new: true
    };
    setEditableMedications([...editableMedications, newMedication]);
  };

  const removeMedication = (index: number) => {
    const updated = editableMedications.filter((_, i) => i !== index);
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
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold mb-2">Patient Information</h4>
            <div className="text-sm">
              <span className="text-muted-foreground">Patient:</span>
              <span className="ml-2 font-medium">{prescription?.patient?.full_name}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Medications to Dispense (Editable)</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addNewMedication}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Medication
              </Button>
            </div>
            
            {editableMedications.map((med: any, index: number) => {
              const medicationData = medications.find(m => m.id === med.medication_id);
              const unitPrice = medicationData?.unit_price || 0;
              const itemTotal = unitPrice * (med.dispensed_quantity || 0);
              const stockAvailable = medicationData?.stock_quantity || 0;
              
              return (
                <div key={index + '-' + med.medication_id} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Medication {index + 1}</span>
                    {(editableMedications.length > 1 || med.is_new) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedication(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Medication</Label>
                        {stockAvailable === 0 && (
                          <span className="text-xs text-red-600 font-medium">Out of Stock!</span>
                        )}
                      </div>
                      <Select
                        value={med.medication_id}
                        onValueChange={(value) => updateMedication(index, 'medication_id', value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select medication" />
                        </SelectTrigger>
                        <SelectContent>
                          {medications.map((medication) => (
                            <SelectItem 
                              key={medication.id} 
                              value={medication.id}
                              disabled={medication.stock_quantity === 0}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className={medication.stock_quantity === 0 ? 'text-gray-400' : ''}>
                                  <div className="font-medium">{medication.name}</div>
                                  {medication.strength && (
                                    <div className="text-xs text-muted-foreground">
                                      {medication.strength} {medication.dosage_form || ''}
                                    </div>
                                  )}
                                </div>
                                <span className={'text-xs ml-2 ' + (
                                  medication.stock_quantity === 0 ? 'text-red-500' : 
                                  medication.stock_quantity <= 5 ? 'text-orange-500' : 'text-green-600'
                                )}>
                                  Stock: {medication.stock_quantity}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          Frequency (times per day)
                          {med.original_frequency && med.frequency !== med.original_frequency && (
                            <span className="text-orange-600 text-xs">• Modified</span>
                          )}
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          max="24"
                          value={med.frequency || ''}
                          onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                          placeholder={med.original_frequency ? `Original: ${med.original_frequency}` : "e.g., 3"}
                          className={`h-9 ${med.original_frequency && med.frequency !== med.original_frequency ? 'border-orange-400' : ''}`}
                        />
                        {med.original_frequency && (
                          <div className="text-xs text-muted-foreground">
                            Doctor prescribed: {med.original_frequency} times/day
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          Duration (days)
                          {med.original_duration && med.duration !== med.original_duration && (
                            <span className="text-orange-600 text-xs">• Modified</span>
                          )}
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          value={med.duration || ''}
                          onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                          placeholder={med.original_duration ? `Original: ${med.original_duration}` : "e.g., 7"}
                          className={`h-9 ${med.original_duration && med.duration !== med.original_duration ? 'border-orange-400' : ''}`}
                        />
                        {med.original_duration && (
                          <div className="text-xs text-muted-foreground">
                            Doctor prescribed: {med.original_duration} days
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 mt-3">
                      <Label className="text-xs">Instructions</Label>
                      <Input
                        value={med.instructions || ''}
                        onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                        placeholder="e.g., Take after meals"
                        className="h-9"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        {med.frequency ? `${med.frequency} times/day` : 'Set frequency'} • {med.duration ? `${med.duration} days` : 'Set duration'}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-700">TSh {itemTotal.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {med.dispensed_quantity} × TSh {unitPrice.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

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
              placeholder="Any additional notes or warnings for the patient"
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
              {loading ? 'Processing...' : 'Dispense All (TSh ' + totalCost.toLocaleString() + ')'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}