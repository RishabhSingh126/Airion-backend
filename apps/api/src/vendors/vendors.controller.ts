import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Put, NotFoundException, BadRequestException, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { VendorsService } from './vendors.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { ActivityType } from './entities/activity.entity';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('vendors')
export class VendorsController {
    constructor(
        private readonly vendorsService: VendorsService,
        private readonly analyticsService: AnalyticsService,
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() createVendorDto: CreateVendorDto, @Request() req: any) {
        return this.vendorsService.create(createVendorDto, req.user);
    }

    @Get('discovery')
    @UseInterceptors(CacheInterceptor)
    async getDiscovery(
        @Query('city') city?: string,
        @Query('categoryId') categoryId?: string,
        @Query('search') search?: string,
        @Query('sponsored') sponsored?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.vendorsService.getDiscovery({
            city,
            categoryId,
            search,
            sponsored: sponsored === 'true' ? true : (sponsored === 'false' ? false : undefined),
            limit: limit ? parseInt(limit, 10) : 20,
            offset: offset ? parseInt(offset, 10) : 0,
        });
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getMyProfile(@Request() req: any) {
        try {
            // Guard against unauthorized or malformed data
            if (!req || !req.user) return null;

            // Normalize UserId (some payloads use .sub, others use .userId)
            const userId = req.user.userId || (req.user as any).sub;
            if (!userId) {
                console.warn('[VendorsController] User authenticated but no ID found in payload');
                return null;
            }

            const vendor = await this.vendorsService.findByUserId(userId);
            return vendor || null;
        } catch (error) {
            console.error('[VendorsController] Failed to resolve vendor profile:', error);
            // We return null to maintain stable UX even on unexpected internal errors
            return null;
        }
    }

    @Get('ads')
    @UseGuards(JwtAuthGuard)
    async getAds(@Request() req: any) {
        const userId = req.user.userId || req.user.sub;
        const vendor = await this.vendorsService.findByUserId(userId);
        if (!vendor) return [];
        return vendor.ads || [];
    }

    @Get('gallery')
    @UseGuards(JwtAuthGuard)
    async getGallery(@Request() req: any) {
        const userId = req.user.userId || req.user.sub;
        const vendor = await this.vendorsService.findByUserId(userId);
        if (!vendor) return [];
        return vendor.gallery || [];
    }

    @Get('me/profile-views')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR)
    async getMyProfileViews(@Request() req: any) {
        const userId = req.user.userId || req.user.sub;
        const vendor = await this.vendorsService.findByUserId(userId);
        if (!vendor) {
            return {
                totalUniqueViews: 0,
                todayUniqueViews: 0,
                weekUniqueViews: 0,
                monthUniqueViews: 0,
            };
        }
        return this.vendorsService.getVendorViewAnalytics(vendor.id);
    }

    @Post(':id/profile-view')
    @UseGuards(OptionalJwtAuthGuard, ThrottlerGuard)
    async recordProfileView(
        @Param('id') vendorId: string,
        @Request() req: any,
        @Body() body: { guestVisitorId?: string }
    ) {
        let viewerUserId = undefined;
        if (req.user) {
            viewerUserId = req.user.userId || req.user.sub;
        }
        return this.vendorsService.recordProfileView(vendorId, viewerUserId, body.guestVisitorId);
    }



    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        const vendor = await this.vendorsService.findOne(id);

        // Track profile view for analytics
        await this.analyticsService.trackEvent(
            'profile_view',
            id,
            req.user?.userId,
            { ip: req.ip, userAgent: req.headers['user-agent'] }
        );

        return vendor;
    }

    @Put('me')
    @UseGuards(JwtAuthGuard)
    async updateProfile(@Body() updateVendorDto: UpdateVendorDto, @Request() req: any) {
        try {
            const userId = req.user.userId || req.user.sub;
            let vendor = await this.vendorsService.findByUserId(userId);

            if (!vendor) {
                vendor = await this.vendorsService.create(updateVendorDto as any, { userId });
                return vendor;
            }

            return await this.vendorsService.update(vendor.id, updateVendorDto, userId);
        } catch (error: any) {
            console.error('[updateProfile Error]:', error);
            throw new BadRequestException(error.message || 'Failed to update vendor');
        }
    }

    /**
     * Admin Endpoints: Get all vendors with status filter
     */
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async findAll(@Query('status') status?: string) {
        return this.vendorsService.findAll(status as any);
    }

    /**
     * Admin Endpoint: Update single vendor approval/KYC status
     * Body: { status: VendorVerificationStatus, rejectionReason?: string }
     */
    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateStatus(
        @Param('id') id: string,
        @Body() body: { status: string; rejectionReason?: string },
        @Request() req: any,
    ) {
        if (!body.status) {
            throw new BadRequestException('Status is required');
        }
        return this.vendorsService.updateStatus(id, body.status, {
            rejectionReason: body.rejectionReason,
            reviewedById: req.user?.userId,
        });
    }


    @Get(':id/stats/bookings')
    @UseGuards(JwtAuthGuard)
    async getStats(@Param('id') id: string) {
        return this.vendorsService.getVendorStats(id);
    }

    @Get(':id/earnings')
    @UseGuards(JwtAuthGuard)
    async getEarnings(@Param('id') id: string, @Query('year') year?: string) {
        return this.vendorsService.getDetailedEarnings(id, year ? parseInt(year, 10) : undefined);
    }

    // --- ADS ENDPOINTS ---

    @Post('ads')
    @UseGuards(JwtAuthGuard)
    async createAd(@Request() req: any, @Body() adData: any) {
        const userId = req.user.userId || req.user.sub;
        return this.vendorsService.createAd(userId, adData);
    }

    @Put('ads/:adId')
    @UseGuards(JwtAuthGuard)
    async updateAd(@Request() req: any, @Param('adId') adId: string, @Body() updateData: any) {
        const userId = req.user.userId || req.user.sub;
        return this.vendorsService.updateAd(userId, adId, updateData);
    }

    @Delete('ads/:adId')
    @UseGuards(JwtAuthGuard)
    async deleteAd(@Request() req: any, @Param('adId') adId: string) {
        const userId = req.user.userId || req.user.sub;
        return this.vendorsService.deleteAd(userId, adId);
    }

    // --- GALLERY ENDPOINTS ---

    @Post('gallery')
    @UseGuards(JwtAuthGuard)
    async addToGallery(@Request() req: any, @Body() item: any) {
        const userId = req.user.userId || req.user.sub;
        console.log('[VendorsController.addToGallery] Incoming Sync Request:', {
            userId: userId,
            item: { ...item, imageUrl: item.imageUrl?.substring(0, 50) + '...' } // Don't log full base64
        });
        return this.vendorsService.addToGallery(userId, item);
    }

    @Delete('gallery/:itemId')
    @UseGuards(JwtAuthGuard)
    async removeFromGallery(@Request() req: any, @Param('itemId') itemId: string) {
        const userId = req.user.userId || req.user.sub;
        return this.vendorsService.removeFromGallery(userId, itemId);
    }

    @Delete('gallery-purge')
    @UseGuards(JwtAuthGuard)
    async purgeGallery(@Request() req: any) {
        const userId = req.user.userId || req.user.sub;
        return this.vendorsService.purgeGallery(userId);
    }

    @Get(':id/performance')
    @UseGuards(JwtAuthGuard)
    async getPerformance(@Param('id') id: string) {
        return this.analyticsService.getVendorPerformance(id);
    }

    @Get(':id/bookings')
    @UseGuards(JwtAuthGuard)
    async getBookings(@Param('id') id: string) {
        // This is a direct lookup for a specific vendor's bookings
        return this.vendorsService.findBookings(id);
    }

    @Get(':id/availability')
    @UseGuards(JwtAuthGuard)
    async getAvailability(@Param('id') id: string) {
        return this.vendorsService.getAvailability(id);
    }
}
