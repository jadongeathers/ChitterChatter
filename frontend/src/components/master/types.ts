// Define common types used across components

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  institution: string;
  class_name: string;
  section: string;
  is_student: boolean;
  access_group?: string;
  is_registered?: boolean;
  is_active?: boolean;
  has_consented?: boolean; // Added consent field with optional flag
  consent_date?: string;   // Added consent date field
}

export interface Section {
  section: string;
  students: User[];
}

export interface Class {
  class_name: string;
  sections: Section[];
}

export interface ClassGroup {
  institution: string;
  classes: Class[];
}