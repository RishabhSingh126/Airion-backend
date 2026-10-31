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
        
        let totalRevenue = revenueResult[0]?.total ? Number(revenueResult[0].total) : 0;
        let usersCount = Number(totalUsers[0].count);
        let vendorsCount = Number(totalVendors[0].count);

        const commissionEarned = totalRevenue * 0.10; // 10% commission

        // We could also add charts data here, but for now just return the main stats + mocked charts
        return {
            totalRevenue,
            commissionEarned,
            avgConversionRate: 4.8, // Mocked for now
            stats: [
                { label: 'Total Revenue', value: `₹${(totalRevenue / 100000).toFixed(2)}L`, change: '+12%', icon: 'DollarSign', color: 'emerald' },
                { label: 'Active Vendors', value: vendorsCount, change: '+8%', icon: 'Store', color: 'blue' },
                { label: 'Total Users', value: usersCount, change: '+24%', icon: 'Users', color: 'purple' },
                { label: 'Growth Rate', value: '18.2%', change: '+2%', icon: 'TrendingUp', color: 'rose' },
            ],
            // Sending mocked charts data so the dashboard doesn't break
            growthData: [
                { name: 'Jan', users: 4000, vendors: 240 },
                { name: 'Feb', users: 3000, vendors: 139 },
                { name: 'Mar', users: 2000, vendors: 980 },
                { name: 'Apr', users: 2780, vendors: 390 },
                { name: 'May', users: 1890, vendors: 480 },
                { name: 'Jun', users: 2390, vendors: 380 },
                { name: 'Jul', users: 3490, vendors: 430 },
            ],
            categoryData: [
                { name: 'Venues', value: 400 },
                { name: 'Catering', value: 300 },
                { name: 'Decor', value: 300 },
                { name: 'Photo', value: 200 },
            ],
            revenueData: [
                { name: 'Jan', adRevenue: 120000, subRevenue: 300000, commission: 120000 },
                { name: 'Feb', adRevenue: 150000, subRevenue: 320000, commission: 150000 },
                { name: 'Mar', adRevenue: 200000, subRevenue: 400000, commission: 200000 },
                { name: 'Apr', adRevenue: 220000, subRevenue: 450000, commission: 220000 },
                { name: 'May', adRevenue: 180000, subRevenue: 380000, commission: 180000 },
                { name: 'Jun', adRevenue: 280000, subRevenue: 500000, commission: 280000 },
            ],
            conversionData: [
                { name: 'Weddings', rate: 4.2 },
                { name: 'Corporate', rate: 5.8 },
                { name: 'Parties', rate: 3.5 },
                { name: 'Birthdays', rate: 6.1 },
            ],
            topVendors: [
                { id: 'v1', name: 'Royal Palace', city: 'Mumbai', revenue: '₹4.5L', bookings: 42, rating: 4.9 },
                { id: 'v2', name: 'Elite Catering', city: 'Delhi', revenue: '₹3.2L', bookings: 56, rating: 4.8 },
                { id: 'v3', name: 'Vibrant Decor', city: 'Pune', revenue: '₹2.8L', bookings: 38, rating: 4.7 },
            ]
        };
    }
}
