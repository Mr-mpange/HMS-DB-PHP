import api from '@/lib/api';
import { logActivity } from '@/lib/utils';

export interface MedicalService {
  id?: string;
  service_code: string;
  service_name: string;
  service_type: string;
  description?: string;
  base_price: number;
  currency: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Create a new medical service
export const createMedicalService = async (service: Omit<MedicalService, 'id' | 'created_at' | 'updated_at'>, userId: string) => {
  try {
    // Medical services not yet implemented in backend
    console.log('Create medical service:', service);
    await logActivity('medical_service.create', { service_name: service.service_name });
    return { data: null, error: new Error('Medical services management not yet implemented') };
  } catch (error) {
    console.error('Error creating medical service:', error);
    return { data: null, error };
  }
};

// Get all medical services
export const getMedicalServices = async () => {
  try {
    // Medical services not yet implemented in backend
    return { data: [], error: null };
  } catch (error) {
    console.error('Error fetching medical services:', error);
    return { data: null, error };
  }
};

// Get a single medical service by ID
export const getMedicalServiceById = async (id: string) => {
  try {
    // Medical services not yet implemented in backend
    return { data: null, error: new Error('Medical services management not yet implemented') };
  } catch (error) {
    console.error('Error fetching medical service:', error);
    return { data: null, error };
  }
};

// Update a medical service
export const updateMedicalService = async (id: string, updates: Partial<MedicalService>, userId: string) => {
  try {
    // Medical services not yet implemented in backend
    console.log('Update medical service:', id, updates);
    await logActivity('medical_service.update', { service_id: id });
    return { data: null, error: new Error('Medical services management not yet implemented') };
  } catch (error) {
    console.error('Error updating medical service:', error);
    return { data: null, error };
  }
};

// Delete a medical service
export const deleteMedicalService = async (id: string, userId: string) => {
  try {
    // Medical services not yet implemented in backend
    console.log('Delete medical service:', id);
    await logActivity('medical_service.delete', { service_id: id });
    return { error: new Error('Medical services management not yet implemented') };
  } catch (error) {
    console.error('Error deleting medical service:', error);
    return { error };
  }
};

// Toggle service active status
export const toggleServiceStatus = async (id: string, currentStatus: boolean, userId: string) => {
  try {
    // Medical services not yet implemented in backend
    console.log('Toggle service status:', id, currentStatus);
    await logActivity('medical_service.toggle', { service_id: id, new_status: !currentStatus });
    return { data: null, error: new Error('Medical services management not yet implemented') };
  } catch (error) {
    console.error('Error toggling service status:', error);
    return { data: null, error };
  }
};
