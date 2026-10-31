import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('uploads')
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) {}

    @Post('image')
    @UseInterceptors(FileInterceptor('file', {
        limits: {
            fileSize: 1024 * 1024 * 1024 // 1GB limit
        }
    }))
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('File is missing');
        }
        
        const result = await this.uploadsService.uploadFile(file);
        return {
            success: true,
            url: result.url,
            message: 'File uploaded successfully'
        };
    }
}
