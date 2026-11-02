import { Controller, Post, UseInterceptors, UploadedFile, Body, Req, BadRequestException, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('uploads')
export class UploadsController {
    private readonly logger = new Logger(UploadsController.name);

    constructor(private readonly uploadsService: UploadsService) {}

    @Post('image')
    @UseInterceptors(FileInterceptor('file', {
        limits: {
            fileSize: 1024 * 1024 * 1024 // 1GB limit
        }
    }))
    async uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: any,
        @Req() req: any
    ) {
        let fileToUpload: Express.Multer.File = file;

        // Fallback 1: Multer might populate req.files if multiple or differently named
        if (!fileToUpload && req.files) {
            if (Array.isArray(req.files) && req.files.length > 0) {
                fileToUpload = req.files[0];
            } else if (typeof req.files === 'object') {
                const firstKey = Object.keys(req.files)[0];
                if (firstKey && req.files[firstKey]?.[0]) {
                    fileToUpload = req.files[firstKey][0];
                }
            }
        }

        // Fallback 2: Base64 data URL or raw Base64 string in JSON body (file, image, or data)
        if (!fileToUpload && body) {
            const rawData = body.file || body.image || body.data;
            if (typeof rawData === 'string' && (rawData.startsWith('data:') || rawData.length > 50)) {
                try {
                    let mimeType = 'image/jpeg';
                    let base64String = rawData;
                    if (rawData.startsWith('data:')) {
                        const matches = rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                        if (matches && matches.length === 3) {
                            mimeType = matches[1];
                            base64String = matches[2];
                        }
                    }
                    const buffer = Buffer.from(base64String, 'base64');
                    const ext = mimeType.split('/')[1] || 'jpg';
                    fileToUpload = {
                        fieldname: 'file',
                        originalname: `upload-${Date.now()}.${ext}`,
                        encoding: '7bit',
                        mimetype: mimeType,
                        buffer: buffer,
                        size: buffer.length,
                    } as Express.Multer.File;
                } catch (e: any) {
                    this.logger.warn(`Base64 decode failed: ${e.message}`);
                }
            }
        }

        if (!fileToUpload) {
            throw new BadRequestException('File is missing');
        }
        
        const result = await this.uploadsService.uploadFile(fileToUpload);
        return {
            success: true,
            url: result.url,
            data: { url: result.url },
            message: 'File uploaded successfully'
        };
    }
}
