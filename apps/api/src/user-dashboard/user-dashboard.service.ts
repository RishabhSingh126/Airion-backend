import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { Vendor, VendorVerificationStatus } from '../vendors/entities/vendor.entity';
import { VendorAd, AdStatus } from '../vendors/entities/vendor-ad.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class UserDashboardService {
    private readonly logger = new Logger(UserDashboardService.name);

    constructor(
        @InjectRepository(Booking)
        private readonly bookingRepository: Repository<Booking>,
        @InjectRepository(Vendor)
        private readonly vendorRepository: Repository<Vendor>,
        @InjectRepository(VendorAd)
        private readonly vendorAdRepository: Repository<VendorAd>,
    ) { }

    async getOverview(userId: string) {
        this.logger.log(`📊 Fetching dashboard overview for user: ${userId}`);

        // 1. Fetch Stats
        const stats = await this.bookingRepository
            .createQueryBuilder('booking')
            .select([
                "COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed')) as upcoming",
                "SUM(total_amount) FILTER (WHERE status = 'completed' OR payment_status = 'paid') as spent"
            ])
            .where('booking.userId = :userId', { userId })
            .getRawOne();

        // 2. Fetch Recent Bookings
        const recentBookings = await this.bookingRepository.find({
            where: { userId },
            relations: ['vendor'],
            order: { createdAt: 'DESC' },
            take: 3
        });

        // 3. Fetch Trending/Recommended Vendors
        const trendingVendors = await this.vendorRepository.find({
            where: { verificationStatus: VendorVerificationStatus.APPROVED },
            relations: ['category'],
            order: { rating: 'DESC' },
            take: 4
        });

        // 4. Fetch Active Deals from real ads
        const activeAds = await this.vendorAdRepository.find({
            where: { status: AdStatus.ACTIVE },
            take: 4
        });

        const deals = activeAds.map(ad => ({
            id: ad.id,
            title: ad.title,
            subtitle: 'Sponsored Offer',
            image: ad.imageUrl,
            link: '/marketplace'
        }));

        return {
            stats: {
                upcomingEvents: Number(stats?.upcoming || 0),
                budgetSpent: Number(stats?.spent || 0),
                pendingTasks: 3, // Mock tasks for now
            },
            recentBookings: recentBookings.map(b => ({
                id: b.id,
                vendorName: b.vendor?.businessName || 'Unknown Vendor',
                category: 'Vendor',
                status: b.status,
                location: b.vendor?.city || 'Patna',
                date: new Date(b.createdAt).toLocaleDateString(),
                time: '10:00 AM',
                price: Number(b.totalAmount),
                imageUrl: b.vendor?.portfolioImages?.[0] || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400'
            })),
            trendingVendors: trendingVendors.map(v => ({
                id: v.id,
                name: v.businessName,
                category: v.category?.name || 'Service',
                rating: v.rating,
                price: '₹25,000',
                image: v.portfolioImages?.[0] || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400',
                location: v.city || 'Patna'
            })),
            deals
        };
    }
}
