import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDashboardController } from './user-dashboard.controller';
import { UserDashboardService } from './user-dashboard.service';
import { Booking } from '../bookings/entities/booking.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { VendorAd } from '../vendors/entities/vendor-ad.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Booking, Vendor, VendorAd]),
        AuthModule, // For guards and shared logic
    ],
    controllers: [UserDashboardController],
    providers: [UserDashboardService],
})
export class UserDashboardModule {}
