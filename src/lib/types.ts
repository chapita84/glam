
import { User } from 'firebase/auth';

export type Permission = {
  id: string;
  label: string;
  children?: Permission[];
};

export type Role = {
  id: string;
  name: string;
  description: string;
  permissions: Set<string>;
};

export type BaseCurrentUser = {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL?: string | null;
    [key: string]: any;
};

// This is the main user type used across the app
export interface CurrentUser extends BaseCurrentUser {
    globalRole?: 'superAdmin' | 'studioOwner' | 'client';
    // Studio-specific role is added dynamically
    role?: Role | null;
}
