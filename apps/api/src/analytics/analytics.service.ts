import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(AnalyticsEvent)
        private readonly eventRepository: Repository<AnalyticsEvent>,
        private readonly dataSource: DataSource,
    ) {}

    async trackEvent(type: any, targetId: string, userId?: string, metadata?: any) {
        const event = this.eventRepository.create({
            type,
            targetId,
            userId,
            metadata,
        });
        return this.eventRepository.save(event);
    }

    async getVendorPerformance(vendorId: string, days: number = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch views grouped by day
        const views = await this.eventRepository
            .createQueryBuilder('event')
            .select([
                "TO_CHAR(created_at, 'Mon DD') as name",
                "COUNT(*) as views"
            ])
            .where('event.targetId = :vendorId', { vendorId })
            .andWhere('event.type = :type', { type: 'profile_view' })
            .andWhere('event.createdAt >= :startDate', { startDate })
            .groupBy("TO_CHAR(created_at, 'Mon DD'), DATE_TRUNC('day', created_at)")
            .orderBy("DATE_TRUNC('day', created_at)", "ASC")
            .getRawMany();

        return views.map(v => ({
            name: v.name,
            views: Number(v.views),
            inquiries: Math.floor(Number(v.views) * 0.1), // Simulated conversion for now
        }));
    }

    async getAdminGlobalStats() {
        const totalUsers = await this.dataSource.query(`SELECT COUNT(*) as count FROM users WHERE role = 'user'`);
        const totalVendors = await this.dataSource.query(`SELECT COUNT(*) as count FROM users WHERE role = 'vendor'`);
        
        // Sum totalAmount from bookings where status is completed or confirmed
        const revenueResult = await this.dataSource.query(`
            SELECT SUM(CAST(total_amount AS NUMERIC)) as total 
            FROM bookings 
            WHERE status IN ('confirmed', 'completed')
        `);
        
        const totalRevenue = revenueResult[0]?.total ? Number(revenueResult[0].total) : 0;
        const usersCount = Number(totalUsers[0]?.count || 0);
        const vendorsCount = Number(totalVendors[0]?.count || 0);

        const commissionEarned = totalRevenue * 0.10; // 10% commission

        // Real Top Vendors from database
        const topVendorsDb = await this.dataSource.query(`
            SELECT v.id, v.business_name as name, 
                   COALESCE(v.city, v.business_address->>'city', 'India') as city,
                   COALESCE(v.rating, 0) as rating,
                   COUNT(b.id) as bookings,
                   COALESCE(SUM(CAST(b.total_amount AS NUMERIC)), 0) as revenue
            FROM vendors v
            LEFT JOIN bookings b ON b.vendor_id = v.id
            GROUP BY v.id, v.business_name, v.city, v.business_address, v.rating
            ORDER BY bookings DESC, rating DESC
            LIMIT 5
        `).catch(() => []);

        const topVendors = topVendorsDb.map((v: any, idx: number) => ({
            id: v.id || `v-${idx}`,
            name: v.name || 'Vendor Partner',
            city: v.city || 'India',
            revenue: `₹${Number(v.revenue || 0).toLocaleString('en-IN')}`,
            bookings: Number(v.bookings || 0),
            rating: Number(v.rating || 5.0)
        }));

        // Real Category Distribution from database
        const categoryDataDb = await this.dataSource.query(`
            SELECT c.name, COUNT(s.id)::int as count
            FROM categories c
            LEFT JOIN services s ON s.category_id = c.id
            GROUP BY c.id, c.name
            ORDER BY count DESC
            LIMIT 6
        `).catch(() => []);

        const categoryData = categoryDataDb.length > 0 
            ? categoryDataDb.map((c: any) => ({ name: c.name, value: Number(c.count || 0) }))
            : [
                { name: 'Venues', value: 0 },
                { name: 'Catering', value: 0 },
                { name: 'Decor', value: 0 },
                { name: 'Photo', value: 0 },
            ];

        return {
            totalRevenue,
            commissionEarned,
            avgConversionRate: 0,
            stats: [
                { label: 'Total Revenue', value: `₹${(totalRevenue / 100000).toFixed(2)}L`, change: '+0%', icon: 'DollarSign', color: 'emerald' },
                { label: 'Active Vendors', value: vendorsCount, change: '+0%', icon: 'Store', color: 'blue' },
                { label: 'Total Users', value: usersCount, change: '+0%', icon: 'Users', color: 'purple' },
                { label: 'Growth Rate', value: '100%', change: '+0%', icon: 'TrendingUp', color: 'rose' },
            ],
            growthData: [
                { name: 'Mon', users: usersCount, vendors: vendorsCount },
                { name: 'Tue', users: usersCount, vendors: vendorsCount },
                { name: 'Wed', users: usersCount, vendors: vendorsCount },
                { name: 'Thu', users: usersCount, vendors: vendorsCount },
                { name: 'Fri', users: usersCount, vendors: vendorsCount },
                { name: 'Sat', users: usersCount, vendors: vendorsCount },
                { name: 'Sun', users: usersCount, vendors: vendorsCount },
            ],
            categoryData,
            revenueData: [
                { name: 'Gross Revenue', adRevenue: 0, subRevenue: 0, commission: commissionEarned },
            ],
            conversionData: [],
            topVendors
        };
    }
}
