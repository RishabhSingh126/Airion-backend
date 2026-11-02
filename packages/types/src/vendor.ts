import { z } from 'zod';

export const BusinessAddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  zipCode: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

export const BusinessHoursSchema = z.record(z.string(), z.object({
  open: z.string(),
  close: z.string(),
})).optional();

export const SocialLinksSchema = z.object({
  facebook: z.string().url().optional().nullable(),
  instagram: z.string().url().optional().nullable(),
  twitter: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
}).optional();

export const CreateVendorSchema = z.object({
  businessName: z.string().min(2),
  businessEmail: z.preprocess(
    val => (typeof val === 'string' && val.trim() === '') ? null : (typeof val === 'string' ? val.trim() : val),
    z.string().email().optional().nullable()
  ),
  businessPhone: z.preprocess(
    val => typeof val === 'string' ? val.trim().replace(/[\s\-\(\)]/g, '') : val,
    z.string().min(10).max(16).regex(/^\+?[0-9]*$/, 'Invalid phone number format')
  ),
  city: z.string().min(1).optional().nullable(),
  yearsInBusiness: z.string().optional().nullable(),
  gstNumber: z.preprocess(
    val => (typeof val === 'string' && val.trim() === '') ? null : val,
    z.string().length(15).regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST format').optional().nullable()
  ),
  panNumber: z.string().optional().nullable(),
  aadharNumber: z.string().optional().nullable(),
  acquisitionChannels: z.array(z.string()).min(1, 'Please select at least one channel').optional(),
  monthlyEventVolume: z.string().optional(),
  averageBookingPrice: z.number().min(0).optional(),
  painPoints: z.array(z.string()).optional(),
  businessAddress: BusinessAddressSchema.partial().optional(),
  businessDescription: z.string().max(2000).optional(),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  vendorType: z.string().optional().nullable(),
  businessHours: BusinessHoursSchema,
  portfolioImages: z.array(z.string()).optional(),
  socialLinks: SocialLinksSchema,
});

export const VendorSchema = CreateVendorSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  isVerified: z.boolean().default(false),
  rating: z.number().default(0),
  reviewCount: z.number().default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type CreateVendorDto = z.infer<typeof CreateVendorSchema>;
export type Vendor = z.infer<typeof VendorSchema>;
