import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Dispute } from './entities/dispute.entity';
import { Vendor, VendorVerificationStatus } from '../vendors/entities/vendor.entity';
import { User } from '../auth/entities/user.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Category } from '../categories/entities/category.entity';
import { Location } from '../categories/entities/location.entity';
import { SupportTicket } from './entities/support-ticket.entity';
import { Ad } from '../ads/entities/ad.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { AuditLog } from '../auth/entities/audit-log.entity';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(Dispute)
        private readonly disputeRepository: Repository<Dispute>,
        @InjectRepository(Vendor)
        private readonly vendorRepository: Repository<Vendor>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Booking)
        private readonly bookingRepository: Repository<Booking>,
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
        @InjectRepository(Location)
        private readonly locationRepository: Repository<Location>,
        @InjectRepository(SupportTicket)
        private readonly ticketRepository: Repository<SupportTicket>,
        @InjectRepository(Ad)
        private readonly adRepository: Repository<Ad>,
        @InjectRepository(Coupon)
        private readonly couponRepository: Repository<Coupon>,
        @InjectRepository(AuditLog)
        private readonly auditLogRepository: Repository<AuditLog>,
        private readonly dataSource: DataSource,
    ) { }

    private async logAdminAction(
        queryRunner: QueryRunner,
        adminId: string,
        action: string,
        resource: string,
        resourceId?: string,
        previousValue?: any,
        newValue?: any
    ) {
        if (!adminId) return; // For unauthenticated fallback if any
        const log = this.auditLogRepository.create({
            userId: adminId,
            action,
            resourceType: resource,
            resourceId,
            ipAddress: '127.0.0.1',
            userAgent: 'Admin Panel',
            success: true,
            metadata: {
                previousValue,
                newValue
            }
        });
        await queryRunner.manager.save(log);
    }

    async updateVendorStatus(vendorId: string, status: 'approved' | 'rejected', adminId?: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const vendor = await queryRunner.manager.findOne(Vendor, { where: { id: vendorId } });
            if (!vendor) throw new NotFoundException('Vendor not found');
            
            const newStatus = status === 'approved' ? VendorVerificationStatus.APPROVED : VendorVerificationStatus.REJECTED;
            if (vendor.verificationStatus === newStatus) throw new BadRequestException(`Vendor is already ${status}`);

            const previousStatus = vendor.verificationStatus;
            vendor.verificationStatus = newStatus;
            vendor.isVerified = status === 'approved';
            
            await queryRunner.manager.save(vendor);
            if (adminId) {
                await this.logAdminAction(queryRunner, adminId, 'UPDATE_VENDOR_STATUS', 'Vendor', vendorId, { status: previousStatus }, { status: newStatus });
            }

            await queryRunner.commitTransaction();
            return vendor;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async suspendVendor(vendorId: string, adminId?: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const vendor = await queryRunner.manager.findOne(Vendor, { where: { id: vendorId } });
            if (!vendor) throw new NotFoundException('Vendor not found');

            const previousStatus = vendor.verificationStatus;
            vendor.isVerified = false;
            vendor.verificationStatus = VendorVerificationStatus.REJECTED;
            
            await queryRunner.manager.save(vendor);
            if (adminId) {
                await this.logAdminAction(queryRunner, adminId, 'SUSPEND_VENDOR', 'Vendor', vendorId, { status: previousStatus }, { status: VendorVerificationStatus.REJECTED });
            }

            await queryRunner.commitTransaction();
            return vendor;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async createDispute(data: { bookingId: string; raisedById: string; reason: string }) {
        const dispute = this.disputeRepository.create(data);
        return this.disputeRepository.save(dispute);
    }

    async resolveDispute(id: string, resolution: string, refundAmount: number = 0, adminId?: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const dispute = await queryRunner.manager.findOne(Dispute, { where: { id } });
            if (!dispute) throw new NotFoundException('Dispute not found');
            
            const prev = { status: dispute.status, adminResolution: dispute.adminResolution, refundAmount: dispute.refundAmount };
            dispute.status = 'resolved';
            dispute.adminResolution = resolution;
            dispute.refundAmount = refundAmount;
            
            await queryRunner.manager.save(dispute);
            if (adminId) {
                await this.logAdminAction(queryRunner, adminId, 'RESOLVE_DISPUTE', 'Dispute', id, prev, { status: 'resolved', adminResolution: resolution, refundAmount });
            }
            await queryRunner.commitTransaction();
            return dispute;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getDisputes(status?: string) {
        return this.disputeRepository.find({
            where: status ? { status } : {},
            relations: ['booking', 'raisedBy'],
            order: { createdAt: 'DESC' },
        });
    }

    async getDashboardStats() {
        const usersCount = await this.userRepository.count();
        const vendorsCount = await this.vendorRepository.count();
        const bookingsCount = await this.bookingRepository.count();
        
        const totalRevResult = await this.bookingRepository
            .createQueryBuilder('booking')
            .select('SUM(booking.totalAmount)', 'sum')
            .where('booking.status IN (:...statuses)', { statuses: ['confirmed', 'completed'] })
            .getRawOne();
        const realRevenue = totalRevResult?.sum ? Number(totalRevResult.sum) : 0;
        const commissionRevenue = realRevenue * 0.1;

        return {
            users: usersCount,
            vendors: vendorsCount,
            bookings: bookingsCount,
            revenue: realRevenue,
            advertisementRevenue: 0,
            subscriptionRevenue: 0,
            commissionRevenue: commissionRevenue,
            charts: {
                revenue: [
                    { name: 'Week 1', adRevenue: 0, subRevenue: 0, commission: 0 },
                    { name: 'Week 2', adRevenue: 0, subRevenue: 0, commission: 0 },
                    { name: 'Week 3', adRevenue: 0, subRevenue: 0, commission: 0 },
                    { name: 'Week 4', adRevenue: 0, subRevenue: 0, commission: commissionRevenue },
                ]
            },
            suspiciousLogins: [],
            pendingApprovals: await this.vendorRepository.find({
                where: { verificationStatus: VendorVerificationStatus.KYC_PENDING },
                take: 5
            })
        };
    }

    // --- Phase 5: Reports Integration ---
    async getReports(timeRange: string = 'Month') {
        const topVendorsFromDb = await this.vendorRepository.find({
            where: { isVerified: true },
            order: { rating: 'DESC', totalReviews: 'DESC' },
            take: 10
        });

        const topVendors = topVendorsFromDb.map((v) => ({
            id: v.id,
            name: v.businessName,
            revenue: `₹0`,
            bookings: v.totalReviews,
            rating: v.rating,
            city: v.city || 'Unknown'
        }));

        const totalRevResult = await this.bookingRepository
            .createQueryBuilder('booking')
            .select('SUM(booking.totalAmount)', 'sum')
            .where('booking.status IN (:...statuses)', { statuses: ['confirmed', 'completed'] })
            .getRawOne();
        const totalRevenue = totalRevResult?.sum ? Number(totalRevResult.sum) : 0;
        const totalComm = totalRevenue * 0.1;

        const revenueData = timeRange === 'Week' ? [
            { name: 'Mon', adRevenue: 0, subRevenue: 0, commission: 0 },
            { name: 'Tue', adRevenue: 0, subRevenue: 0, commission: 0 },
            { name: 'Wed', adRevenue: 0, subRevenue: 0, commission: 0 },
            { name: 'Thu', adRevenue: 0, subRevenue: 0, commission: 0 },
            { name: 'Fri', adRevenue: 0, subRevenue: 0, commission: 0 },
            { name: 'Sat', adRevenue: 0, subRevenue: 0, commission: 0 },
            { name: 'Sun', adRevenue: 0, subRevenue: 0, commission: totalComm },
        ] : timeRange === 'Year' ? [
            { name: '2023', adRevenue: 0, subRevenue: 0, commission: 0 },
            { name: '2024', adRevenue: 0, subRevenue: 0, commission: 0 },
            { name: '2025', adRevenue: 0, subRevenue: 0, commission: 0 },
            { name: '2026', adRevenue: 0, subRevenue: 0, commission: totalComm },
        ] : [
            { name: 'Week 1', adRevenue: 0, subRevenue: 0, commission: 0 },
            { name: 'Week 2', adRevenue: 0, subRevenue: 0, commission: 0 },
            { name: 'Week 3', adRevenue: 0, subRevenue: 0, commission: 0 },
            { name: 'Week 4', adRevenue: 0, subRevenue: 0, commission: totalComm },
        ];

        const conversionData = [
            { name: 'Wedding', rate: 0 },
            { name: 'Corporate', rate: 0 },
            { name: 'Birthday', rate: 0 },
            { name: 'Concert', rate: 0 },
            { name: 'Exhibition', rate: 0 },
        ];

        return {
            totalRevenue,
            commissionEarned: totalComm,
            avgConversionRate: 0,
            revenueData,
            conversionData,
            topVendors
        };
    }

    // --- Phase 6: Bookings Integration ---
    async getBookings(page = 1, limit = 50) {
        const [bookings, total] = await this.bookingRepository.findAndCount({
            relations: ['user', 'vendor', 'service'], // Include relations for UI
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        const mappedBookings = bookings.map(b => ({
            id: b.id,
            bookingCode: b.bookingCode,
            userName: b.user ? b.user.name : 'Unknown User',
            vendorName: b.vendor ? b.vendor.businessName : 'Unknown Vendor',
            category: b.service ? b.service.categoryId : 'General', // Would prefer populated category name here
            city: b.vendor ? b.vendor.city : 'Unknown',
            eventDate: b.eventDate ? b.eventDate.toISOString().split('T')[0] : (b.bookingDate ? b.bookingDate.toISOString().split('T')[0] : 'TBD'),
            amount: `₹${b.totalAmount || 0}`,
            status: b.status.charAt(0).toUpperCase() + b.status.slice(1) // e.g. 'pending' -> 'Pending'
        }));

        return {
            data: mappedBookings,
            total,
            page,
            limit
        };
    }

    async updateBookingStatus(id: string, status: string, adminId?: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const booking = await queryRunner.manager.findOne(Booking, { where: { id } });
            if (!booking) throw new NotFoundException('Booking not found');

            const prev = { status: booking.status };
            booking.status = status.toLowerCase(); // Ensure lowercase for DB
            await queryRunner.manager.save(booking);

            if (adminId) {
                await this.logAdminAction(queryRunner, adminId, 'UPDATE_BOOKING', 'Booking', id, prev, { status: booking.status });
            }

            await queryRunner.commitTransaction();
            return { success: true, message: 'Status updated' };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // --- Phase 7: Support Tickets Integration ---
    async getTickets() {
        const tickets = await this.ticketRepository.find({
            order: { createdAt: 'DESC' }
        });

        return tickets.map(t => ({
            id: t.ticketCode, // returning ticketCode as id for frontend matching
            user: t.user,
            type: t.type,
            subject: t.subject,
            priority: t.priority,
            status: t.status,
            lastUpdated: t.updatedAt?.toISOString() || t.createdAt.toISOString()
        }));
    }

    async updateTicketStatus(id: string, status: string, adminId?: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const ticket = await queryRunner.manager.findOne(SupportTicket, { where: { ticketCode: id } });
            if (!ticket) throw new NotFoundException('Ticket not found');

            const prev = { status: ticket.status };
            ticket.status = status;
            await queryRunner.manager.save(ticket);

            if (adminId) {
                await this.logAdminAction(queryRunner, adminId, 'UPDATE_TICKET', 'Ticket', id, prev, { status });
            }

            await queryRunner.commitTransaction();
            return { success: true, message: 'Status updated' };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async replyToTicket(id: string, reply: string, adminId?: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const ticket = await queryRunner.manager.findOne(SupportTicket, { where: { ticketCode: id } });
            if (!ticket) throw new NotFoundException('Ticket not found');

            const newReply = {
                id: Date.now().toString(),
                message: reply,
                sender: 'Admin',
                timestamp: new Date().toISOString()
            };

            ticket.replies = [...(ticket.replies || []), newReply];
            await queryRunner.manager.save(ticket);

            if (adminId) {
                await this.logAdminAction(queryRunner, adminId, 'REPLY_TICKET', 'Ticket', id, null, newReply);
            }

            await queryRunner.commitTransaction();
            return { success: true, message: 'Reply sent' };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // --- Phase 8: Advertisements Integration ---
    async getAdvertisements() {
        const ads = await this.adRepository.find({
            order: { createdAt: 'DESC' }
        });

        // Fetch vendors to attach names
        const vendorIds = [...new Set(ads.map(ad => ad.vendorId))].filter(id => id && id !== '00000000-0000-0000-0000-000000000000');
        const vendors = vendorIds.length > 0 ? await this.vendorRepository.findByIds(vendorIds) : [];
        const vendorMap = new Map(vendors.map(v => [v.id, v.businessName]));

        return ads.map(ad => ({
            id: ad.id,
            campaignName: ad.campaignName,
            vendorName: vendorMap.get(ad.vendorId) || 'Unknown Vendor',
            adType: ad.adType.charAt(0).toUpperCase() + ad.adType.slice(1),
            status: ad.status,
            dailyBudget: ad.dailyBudget,
            totalBudget: ad.totalBudget,
            startDate: ad.startDate.toISOString().split('T')[0],
            endDate: ad.endDate.toISOString().split('T')[0],
            impressions: ad.impressions,
            clicks: ad.clicks
        }));
    }

    async createAdvertisement(dto: {
        vendorId: string;
        campaignName: string;
        adType: string;
        dailyBudget: number;
        totalBudget: number;
        startDate: string;
        endDate: string;
        mediaUrls?: string[];
    }, adminId?: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const ad = this.adRepository.create({
                vendorId: dto.vendorId,
                campaignName: dto.campaignName,
                adType: dto.adType.toLowerCase() as any,
                dailyBudget: dto.dailyBudget,
                totalBudget: dto.totalBudget,
                startDate: new Date(dto.startDate),
                endDate: new Date(dto.endDate),
                mediaUrls: dto.mediaUrls || [],
                status: 'active' as any, // Admin created ads are active by default
                impressions: 0,
                clicks: 0,
            });

            const savedAd = await queryRunner.manager.save(ad);

            if (adminId) {
                await this.logAdminAction(
                    queryRunner,
                    adminId,
                    'CREATE_AD',
                    'Advertisement',
                    savedAd.id,
                    null,
                    savedAd
                );
            }

            await queryRunner.commitTransaction();
            return savedAd;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async updateAdvertisementStatus(id: string, status: string, adminId?: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const ad = await queryRunner.manager.findOne(Ad, { where: { id } });
            if (!ad) throw new NotFoundException('Advertisement not found');

            const prev = { status: ad.status };
            ad.status = status.toLowerCase() as any;
            await queryRunner.manager.save(ad);

            if (adminId) {
                await this.logAdminAction(queryRunner, adminId, 'UPDATE_AD', 'Advertisement', id, prev, { status: ad.status });
            }

            await queryRunner.commitTransaction();
            return { success: true, message: 'Status updated' };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // --- Phase 9: Coupons Integration ---
    async getCoupons() {
        const coupons = await this.couponRepository.find({
            order: { createdAt: 'DESC' }
        });

        return coupons.map(c => ({
            id: c.id,
            code: c.code,
            type: c.type,
            value: Number(c.value), // decimal converts to string in postgres sometimes
            usageLimit: c.usageLimit,
            usedCount: c.usedCount,
            expiryDate: c.expiryDate.toISOString().split('T')[0],
            status: c.status,
            applicableTo: c.applicableTo
        }));
    }

    async createCoupon(data: any, adminId?: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const existing = await queryRunner.manager.findOne(Coupon, { where: { code: data.code } });
            if (existing) {
                throw new BadRequestException('Coupon with this code already exists');
            }

            const coupon = this.couponRepository.create({
                code: data.code,
                type: data.type,
                value: data.value,
                usageLimit: data.usageLimit || 100,
                expiryDate: new Date(data.expiryDate || new Date().setFullYear(new Date().getFullYear() + 1)),
                applicableTo: data.applicableTo || 'All',
                status: 'Active'
            });

            await queryRunner.manager.save(coupon);

            if (adminId) {
                await this.logAdminAction(queryRunner, adminId, 'CREATE_COUPON', 'Coupon', coupon.id, null, coupon);
            }

            await queryRunner.commitTransaction();
            return { success: true, message: 'Coupon created successfully', coupon };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async deleteCoupon(id: string, adminId?: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const coupon = await queryRunner.manager.findOne(Coupon, { where: { id } });
            if (!coupon) throw new NotFoundException('Coupon not found');

            await queryRunner.manager.remove(coupon);

            if (adminId) {
                await this.logAdminAction(queryRunner, adminId, 'DELETE_COUPON', 'Coupon', id, coupon, null);
            }

            await queryRunner.commitTransaction();
            return { success: true, message: 'Coupon deleted' };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // --- Phase 4: Categories & Locations ---

    async getCategories() {
        const categories = await this.categoryRepository.find({
            order: { sortOrder: 'ASC', name: 'ASC' }
        });
        
        // Count vendors per category
        const result = await Promise.all(categories.map(async (cat) => {
            const vendorsCount = await this.vendorRepository.count({ where: { categoryId: cat.id, isVerified: true } });
            return { ...cat, vendorsCount };
        }));
        return result;
    }

    async createCategory(data: Partial<Category>, adminId?: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            if (!data.slug && data.name) {
                data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            }
            const category = this.categoryRepository.create(data);
            await queryRunner.manager.save(category);

            if (adminId) {
                await this.logAdminAction(queryRunner, adminId, 'CREATE_CATEGORY', 'Category', category.id, null, category);
            }

            await queryRunner.commitTransaction();
            return category;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async updateCategory(id: string, data: Partial<Category>, adminId?: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const category = await queryRunner.manager.findOne(Category, { where: { id } });
            if (!category) throw new NotFoundException('Category not found');

            const prev = { ...category };
            Object.assign(category, data);
            await queryRunner.manager.save(category);

            if (adminId) {
                await this.logAdminAction(queryRunner, adminId, 'UPDATE_CATEGORY', 'Category', id, prev, category);
            }

            await queryRunner.commitTransaction();
            return category;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async deleteCategory(id: string, adminId?: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const category = await queryRunner.manager.findOne(Category, { where: { id } });
            if (!category) throw new NotFoundException('Category not found');

            await queryRunner.manager.remove(category);

            if (adminId) {
                await this.logAdminAction(queryRunner, adminId, 'DELETE_CATEGORY', 'Category', id, category, null);
            }

            await queryRunner.commitTransaction();
            return { success: true };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getLocations() {
        const locations = await this.locationRepository.find({
            order: { city: 'ASC' }
        });
        
        const result = await Promise.all(locations.map(async (loc) => {
            const vendorsCount = await this.vendorRepository.count({ where: { city: loc.city, isVerified: true } });
            return { ...loc, vendorsCount };
        }));
        return result;
    }

    async createLocation(data: Partial<Location>, adminId?: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const location = this.locationRepository.create(data);
            await queryRunner.manager.save(location);

            if (adminId) {
                await this.logAdminAction(queryRunner, adminId, 'CREATE_LOCATION', 'Location', location.id, null, location);
            }

            await queryRunner.commitTransaction();
            return location;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async updateLocation(id: string, data: Partial<Location>, adminId?: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const location = await queryRunner.manager.findOne(Location, { where: { id } });
            if (!location) throw new NotFoundException('Location not found');

            const prev = { ...location };
            Object.assign(location, data);
            await queryRunner.manager.save(location);

            if (adminId) {
                await this.logAdminAction(queryRunner, adminId, 'UPDATE_LOCATION', 'Location', id, prev, location);
            }

            await queryRunner.commitTransaction();
            return location;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async deleteLocation(id: string, adminId?: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const location = await queryRunner.manager.findOne(Location, { where: { id } });
            if (!location) throw new NotFoundException('Location not found');

            await queryRunner.manager.remove(location);

            if (adminId) {
                await this.logAdminAction(queryRunner, adminId, 'DELETE_LOCATION', 'Location', id, location, null);
            }

            await queryRunner.commitTransaction();
            return { success: true };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // --- Phase 3: Vendor Management ---
    
    async getVendors(page: number = 1, limit: number = 20, search?: string, status?: string, category?: string) {
        const query = this.vendorRepository.createQueryBuilder('vendor')
            .leftJoinAndSelect('vendor.user', 'user')
            .leftJoinAndSelect('vendor.category', 'category');

        if (search) {
            query.where('vendor.businessName ILIKE :search OR vendor.businessEmail ILIKE :search', { search: `%${search}%` });
        }

        if (status && status !== 'all') {
            query.andWhere('vendor.verificationStatus = :status', { status });
        }

        if (category && category !== 'all') {
            query.andWhere('vendor.categoryId = :category', { category });
        }

        query.orderBy('vendor.createdAt', 'DESC');

        const [data, total] = await query
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getVendorDetails(id: string) {
        const vendor = await this.vendorRepository.findOne({ 
            where: { id },
            relations: ['user', 'category', 'subcategory'] 
        });
        if (!vendor) throw new NotFoundException('Vendor not found');
        return vendor;
    }

    // --- Phase 2: User Management ---

    async getUsers(page: number = 1, limit: number = 20, search?: string, status?: string, sort?: string) {
        const query = this.userRepository.createQueryBuilder('user');

        if (search) {
            query.where('user.name ILIKE :search OR user.email ILIKE :search', { search: `%${search}%` });
        }

        if (status === 'blocked') {
            query.andWhere('user.isBlocked = :isBlocked', { isBlocked: true });
        } else if (status === 'active') {
            query.andWhere('user.isBlocked = :isBlocked', { isBlocked: false });
        }

        if (sort === 'newest') {
            query.orderBy('user.createdAt', 'DESC');
        } else if (sort === 'oldest') {
            query.orderBy('user.createdAt', 'ASC');
        } else {
            query.orderBy('user.createdAt', 'DESC');
        }

        const [data, total] = await query
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getUserDetails(id: string) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async updateUser(id: string, updates: Partial<User>, adminId?: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const user = await queryRunner.manager.findOne(User, { where: { id } });
            if (!user) throw new NotFoundException('User not found');
            
            const prev = { isBlocked: user.isBlocked };
            Object.assign(user, updates);
            await queryRunner.manager.save(user);

            if (adminId) {
                await this.logAdminAction(queryRunner, adminId, 'UPDATE_USER', 'User', id, prev, { isBlocked: user.isBlocked });
            }

            await queryRunner.commitTransaction();
            return user;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async blockUser(id: string, adminId?: string) {
        return this.updateUser(id, { isBlocked: true }, adminId);
    }

    async unblockUser(id: string, adminId?: string) {
        return this.updateUser(id, { isBlocked: false }, adminId);
    }
}
