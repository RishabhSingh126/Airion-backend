import { z } from 'zod';

export enum UserRole {
  USER = 'user',
  VENDOR = 'vendor',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  phoneNumber: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  role: z.nativeEnum(UserRole),
  isEmailVerified: z.boolean().default(false),
  isActive: z.boolean().default(true),
  avatar: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
  provider: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof UserSchema>;

export type BaseUser = {
  id: string;
  email: string | null;
  name?: string | null;
  phoneNumber?: string | null;
  role: UserRole;
  avatar?: string | null;
  location?: string | null;
  language?: string | null;
};
