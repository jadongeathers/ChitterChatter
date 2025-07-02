// src/services/masterService.ts
import { fetchWithAuth } from '@/utils/api';

export interface Institution {
    id: number;
    name: string;
    location?: string;
  }
  
  export interface Term {
    id: number;
    name: string;
    code: string;
    start_date: string;
    end_date: string;
    institution_id: number;
  }
  
  export interface Class {
    id: number;
    course_code: string;
    title: string;
    institution_id: number;
  }
  
  export interface Section {
    id: number;
    section_code: string;
    class_id: number;
    term_id: number;
  }
  
  // Institutions
  export const fetchInstitutions = async (): Promise<Institution[]> => {
    const response = await fetchWithAuth('/api/master/institutions');
    if (!response.ok) throw new Error('Failed to fetch institutions');
    return response.json();
  };
  
  export const createInstitution = async (name: string, location?: string): Promise<Institution> => {
    const response = await fetchWithAuth('/api/master/institutions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, location }),
    });
    if (!response.ok) throw new Error('Failed to create institution');
    return response.json();
  };
  
  // Terms
  export const fetchTerms = async (institutionId: number): Promise<Term[]> => {
    const response = await fetchWithAuth(`/api/master/terms?institution_id=${institutionId}`);
    if (!response.ok) throw new Error('Failed to fetch terms');
    return response.json();
  };
  
  export const createTerm = async (term: Omit<Term, 'id'>): Promise<Term> => {
    const response = await fetchWithAuth('/api/master/terms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(term),
    });
    if (!response.ok) throw new Error('Failed to create term');
    return response.json();
  };
  
  // Classes
  export const fetchClasses = async (institutionId: number): Promise<Class[]> => {
    const response = await fetchWithAuth(`/api/master/classes?institution_id=${institutionId}`);
    if (!response.ok) throw new Error('Failed to fetch classes');
    return response.json();
  };
  
  export const createClass = async (cls: Omit<Class, 'id'>): Promise<Class> => {
    const response = await fetchWithAuth('/api/master/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cls),
    });
    if (!response.ok) throw new Error('Failed to create class');
    return response.json();
  };
  
  // Sections
  export const fetchSections = async (classId: number): Promise<Section[]> => {
    const response = await fetchWithAuth(`/api/master/sections?class_id=${classId}`);
    if (!response.ok) throw new Error('Failed to fetch sections');
    return response.json();
  };
  
  export const createSection = async (section: Omit<Section, 'id'>): Promise<Section> => {
    const response = await fetchWithAuth('/api/master/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(section),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create section');
    }
    return response.json();
  };