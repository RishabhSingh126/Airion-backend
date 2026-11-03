import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

import fetch from 'cross-fetch';

@Injectable()
export class UploadsService {
  private supabase: SupabaseClient;
  private bucket: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = (this.configService.get<string>('SUPABASE_URL') || '').trim();
    const supabaseKey = (this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '').trim();
    
    if (!supabaseUrl || !supabaseKey) {
       console.warn('⚠️ Supabase Storage not fully configured in .env');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      global: { fetch: fetch },
      auth: { persistSession: false },
    });
    this.bucket = (this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'images').trim();
  }

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; public_id: string; format?: string; duration?: number }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // --- RELAXED SECURITY: ALL IMAGES, VIDEOS & DOCUMENTS ALLOWED ---
    const originalName = file.originalname || '';
    const isImage = file.mimetype.startsWith('image/') || 
                    ['image/x-icon', 'image/vnd.microsoft.icon', 'application/octet-stream'].includes(file.mimetype) ||
                    /\.(jpg|jpeg|png|webp|gif|svg|ico|avif)$/i.test(originalName);
    const isVideo = file.mimetype.startsWith('video/') ||
                    /\.(mp4|webm|mov|avi|mkv)$/i.test(originalName);
    const isDoc = file.mimetype === 'application/pdf' ||
                  /\.(pdf)$/i.test(originalName);
    
    if (!isImage && !isVideo && !isDoc) {
      throw new BadRequestException('Invalid file type. Please upload an image, video, or PDF document.');
    }

    // --- INCREASED LIMITS: 1GB TOTAL ---
    const maxSize = 1024 * 1024 * 1024; // 1GB
    if (file.size > maxSize) {
      throw new BadRequestException(`File too large. Max limit is 1024MB (1GB).`);
    }

    try {
      const fileExt = originalName ? originalName.split('.').pop() : (isImage ? 'jpg' : (isVideo ? 'mp4' : 'pdf'));
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // 1. Try Supabase Storage if configured
      if (this.supabase && this.bucket) {
        try {
          const uploadPromise = this.supabase.storage
              .from(this.bucket)
              .upload(filePath, file.buffer, {
                  contentType: file.mimetype || (isImage ? 'image/jpeg' : (isVideo ? 'video/mp4' : 'application/pdf')),
                  upsert: false
              });

          const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Supabase Storage timeout')), 6000)
          );

          const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any;

          if (!error && data) {
            const { data: { publicUrl } } = this.supabase.storage
                .from(this.bucket)
                .getPublicUrl(filePath);

            return {
                url: publicUrl,
                public_id: data.path,
                format: fileExt
            };
          }
        } catch (supaErr: any) {
          console.warn(`⚠️ Cloud Storage not available, using local persistent storage: ${supaErr.message}`);
        }
      }

      // 2. Reliable Local Storage Fallback
      const fs = require('fs');
      const path = require('path');
      const localDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
      }
      const localFilePath = path.join(localDir, fileName);
      fs.writeFileSync(localFilePath, file.buffer);

      const backendUrl = (
          this.configService.get<string>('RENDER_EXTERNAL_URL') ||
          this.configService.get<string>('BACKEND_URL') ||
          (process.env.NODE_ENV === 'production' ? 'https://airion-api.onrender.com' : '')
      )?.trim();
      const port = this.configService.get<string>('PORT') || '3000';
      const baseUrl = backendUrl || `http://localhost:${port}`;
      const fullUrl = `${baseUrl}/uploads/${fileName}`;

      return {
          url: fullUrl,
          public_id: fileName,
          format: fileExt
      };
    } catch (err: any) {
      console.warn(`⚠️ Upload Failed: ${err.message}`);
      throw new BadRequestException(`Upload Error: ${err.message}`);
    }
  }
}
