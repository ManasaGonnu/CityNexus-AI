export type UserRole = 'citizen' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  officerBadge?: string;
  joinedDate: string;
  resolvedCount?: number;
  activeAssignedCount?: number;
}

/**
 * Returns a clean, capitalized first letter monogram from user's name or email.
 * E.g., "Manas" -> "M", "manasagonnu87@gmail.com" -> "M", "user@gmail.com" -> "U"
 */
export function getMonogram(name?: string, email?: string): string {
  if (name && name.trim().length > 0) {
    const cleanName = name.trim();
    // If name is something like "+91 9876543210", get the first letter of email if available or "C"
    const firstChar = cleanName.charAt(0);
    if (/[a-zA-Z]/.test(firstChar)) {
      return firstChar.toUpperCase();
    }
  }
  if (email && email.trim().length > 0) {
    const firstChar = email.trim().charAt(0);
    if (/[a-zA-Z]/.test(firstChar)) {
      return firstChar.toUpperCase();
    }
  }
  return 'U';
}
