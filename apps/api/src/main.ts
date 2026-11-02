import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from root and current directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './infrastructure/filters/http-exception.filter';
import { LoggingInterceptor } from './infrastructure/interceptors/logging.interceptor';
import { TransformInterceptor } from './infrastructure/interceptors/transform.interceptor';
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

import { setDefaultResultOrder } from 'dns';
import helmet from 'helmet';

async function bootstrap() {
    // Force IPv4-first DNS resolution order to fix "Happy Eyeballs" AggregateErrors on macOS with NeonDB
    setDefaultResultOrder('ipv4first');

    // Determine JSON vs Pretty logging based on environment
    const isProduction = process.env.NODE_ENV === 'production';

    const logger = WinstonModule.createLogger({
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.ms(),
                    isProduction
                        ? winston.format.json()
                        : nestWinstonModuleUtilities.format.nestLike('Ease2event', { colors: true, prettyPrint: true }),
                ),
            }),
        ],
    });

    const app = await NestFactory.create(AppModule, { logger });

    // Enable CORS immediately as top-level middleware so preflight OPTIONS requests are handled instantly
    app.enableCors({
        origin: (origin, callback) => {
            const allowedOrigins = [
                'https://airion-backend-admin-panel-1e98o3h6f-vinay2003s-projects.vercel.app',
                'https://airion-backend-vendor-dashboard.vercel.app',
                'https://airion-backend-admin-panel-eg56.vercel.app',
                process.env.FRONTEND_URL,
                process.env.VENDOR_URL,
                process.env.ADMIN_URL,
            ].filter(Boolean) as string[];

            const isLocal = !origin || 
                origin.startsWith('http://localhost:') || 
                origin.startsWith('http://127.0.0.1:') || 
                origin.startsWith('http://192.168.') ||
                origin.startsWith('http://10.') ||
                origin.startsWith('http://172.');
            const isVercel = origin && origin.endsWith('.vercel.app');
            const isCustomDomain = origin && (origin === 'https://ease2event.com' || origin === 'https://www.ease2event.com');

            if (isLocal || isVercel || isCustomDomain || allowedOrigins.includes(origin as string) || process.env.NODE_ENV !== 'production') {
                callback(null, true);
            } else {
                callback(null, true); // Permissive fallback to prevent breaking valid cross-origin requests
            }
        },
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: '*',
        exposedHeaders: ['x-correlation-id', 'Content-Disposition'],
        optionsSuccessStatus: 204,
        preflightContinue: false,
    });

    // Security Headers & Performance
    app.use(helmet({ 
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginOpenerPolicy: false,
    }));
    const compression = require('compression');
    app.use(compression());

    // Increase JSON body limit for Base64 image uploads
    const express = require('express');
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    app.use('/uploads', express.static(uploadsDir));
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    // Global Filters & Interceptors
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

    // Global validation pipes: support both class-validator and Zod
    app.useGlobalPipes(
        new ValidationPipe({ transform: true, whitelist: false }),
        new ZodValidationPipe()
    );

    // --- PRODUCTION STABILITY: GRACEFUL SHUTDOWN ---
    app.enableShutdownHooks();

    // Global prefix for all routes
    app.setGlobalPrefix('api');

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Backend server is running on http://0.0.0.0:${port}`);
    console.log(`📡 Local access: http://localhost:${port}`);
}

bootstrap();
