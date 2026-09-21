import { join } from 'path';
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { VendorsModule } from './vendors/vendors.module';
import { CategoriesModule } from './categories/categories.module';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LeadsModule } from './leads/leads.module';
import { AdsModule } from './ads/ads.module';
import { CouponsModule } from './coupons/coupons.module';
import { WishlistsModule } from './wishlists/wishlists.module';
import { UserDashboardModule } from './user-dashboard/user-dashboard.module';
import { UploadsModule } from './uploads/uploads.module';
import { CorrelationMiddleware } from './infrastructure/middleware/correlation.middleware';
import { BudgetModule } from './budget/budget.module';
import { GuestsModule } from './guests/guests.module';
import { ChatModule } from './chat/chat.module';
import { WalletModule } from './wallet/wallet.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AIModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { AvailabilityModule } from './availability/availability.module';
import { ContactsModule } from './contacts/contacts.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { MerchandiseModule } from './merchandise/merchandise.module';
import { RefundsModule } from './refunds/refunds.module';
import { CronModule } from './cron/cron.module';
import { HealthModule } from './health/health.module';
import { CartModule } from './cart/cart.module';
import { CmsModule } from './cms/cms.module';
import { PackagesModule } from './packages/packages.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [
                join(__dirname, '..', '..', '..', `.env.${process.env.NODE_ENV || 'development'}.local`),
                join(__dirname, '..', '..', '..', `.env.${process.env.NODE_ENV || 'development'}`),
                join(__dirname, '..', '..', '..', '.env'),
                '.env'
            ],
        }),
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100, // Increased for 50k users expected load
        }]),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const rawUrl = configService.get<string>('DATABASE_URL') ?? '';
                const isProd = configService.get<string>('NODE_ENV') === 'production';

                // Parse DATABASE_URL manually so we never pass sslmode/query-params
                // through pg-connection-string. Mixing URL-level ssl params with
                // TypeORM's ssl:{} object causes double SSL negotiation → ECONNRESET.
                let host = configService.get<string>('DATABASE_HOST') ?? 'localhost';
                let port = parseInt(configService.get<string>('DATABASE_PORT') ?? '5432', 10);
                let username = configService.get<string>('DATABASE_USER') ?? 'postgres';
                let password = configService.get<string>('DATABASE_PASSWORD') ?? '';
                let database = configService.get<string>('DATABASE_NAME') ?? 'postgres';

                if (rawUrl) {
                    try {
                        const parsed = new URL(rawUrl);
                        host     = parsed.hostname;
                        port     = parseInt(parsed.port || '5432', 10);
                        username = decodeURIComponent(parsed.username);
                        password = decodeURIComponent(parsed.password);
                        database = parsed.pathname.replace(/^\//, '');
                    } catch {
                        // fallback to individual env vars above
                    }
                }

                return {
                    type: 'postgres',
                    host,
                    port,
                    username,
                    password,
                    database,
                    // Sole SSL config — NeonDB requires SSL. rejectUnauthorized:false
                    // skips cert validation (safe for dev; set true + CA cert in prod).
                    ssl: { rejectUnauthorized: false },
                    extra: {
                        // Force IPv4 — NeonDB pooler does not support IPv6
                        family: 4,
                        // Keep connections alive to prevent idle-timeout resets
                        keepAlive: true,
                        keepAliveInitialDelayMillis: 10000,
                        // NeonDB free tier cold starts can take up to 30-45s
                        max: isProd ? 100 : 20, // Increased for prod to handle 50k users, and 20 for dev to avoid pool exhaustion
                        idleTimeoutMillis: 30000, // Reduced to 30s to prevent NeonDB from terminating stale connections
                        connectionTimeoutMillis: 60000,
                        // Pool-level SSL must mirror top-level ssl config
                        ssl: { rejectUnauthorized: false },
                    },
                    entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    autoLoadEntities: true,
                    synchronize: false, // Disabled because NeonDB hangs/deadlocks on heavy introspection
                    logging: !isProd ? ['error', 'warn'] : false,
                    retryAttempts: 20,
                    retryDelay: 5000,
                    connectTimeoutMS: 60000,
                };
            },
        }),
        ScheduleModule.forRoot(),
        CacheModule.register({ isGlobal: true }),
        AuthModule,
        VendorsModule,
        CategoriesModule,
        ServicesModule,
        BookingsModule,
        ReviewsModule,
        PaymentsModule,
        NotificationsModule,
        LeadsModule,
        AdsModule,
        CouponsModule,
        WishlistsModule,
        UserDashboardModule,
        UploadsModule,
        BudgetModule,
        GuestsModule,
        ChatModule,
        WalletModule,
        AnalyticsModule,
        AIModule,
        AdminModule,
        AvailabilityModule,
        ContactsModule,
        SubscriptionsModule,
        MerchandiseModule,
        RefundsModule,
        CronModule,
        HealthModule,
        CartModule,
        CmsModule,
        PackagesModule,
    ],
    controllers: [AppController],
})
export class AppModule implements NestModule { 
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(CorrelationMiddleware)
            .forRoutes({ path: '*', method: RequestMethod.ALL });
    }
}
