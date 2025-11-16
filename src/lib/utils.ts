import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import api from '@/lib/api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function generateInvoiceNumber(): Promise<string> {
  // Generate unique invoice number with timestamp and random
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  return `INV-${timestamp}-${random}`;
}

export async function logActivity(action: string, details?: Record<string, any>) {
  try {
    // Log activity via MySQL API
    await api.post('/activity', {
      action,
      details: details ? JSON.stringify(details) : null
    });
  } catch (error) {
    console.warn('Failed to log activity', action, error);
  }
}