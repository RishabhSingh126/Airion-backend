import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { CreatePackageInquiryDto } from './dto/create-package-inquiry.dto';
import { AssignVendorDto } from './dto/assign-vendor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('packages')
export class PackagesController {
    constructor(private readonly packagesService: PackagesService) {}

    // Public package list
    @Get()
    findAllPackages() {
        return this.packagesService.findAllPackages();
    }

    // Vendor specific endpoints (defined before :id)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR)
    @Get('vendor/inquiries')
    async findVendorInquiries(@Request() req: any) {
        let vendorId = req.user.vendorId;
        if (!vendorId && (req.user.userId || req.user.sub)) {
            const vendor = await this.packagesService.findVendorByUserId(req.user.userId || req.user.sub);
            vendorId = vendor?.id;
        }
        return this.packagesService.findInquiriesByVendor(vendorId);
    }

    // Admin inquiry management endpoints (defined before :id)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @Get('admin/inquiries')
    findAllInquiries() {
        return this.packagesService.findAllInquiries();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @Put('admin/inquiries/:id/assign')
    assignVendor(@Param('id') id: string, @Body() assignDto: AssignVendorDto) {
        return this.packagesService.assignVendorToInquiry(id, assignDto.vendorId);
    }

    // Admin package creation
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @Post()
    createPackage(@Body() createDto: CreatePackageDto) {
        return this.packagesService.createPackage(createDto);
    }

    // Single package by ID
    @Get(':id')
    findPackageById(@Param('id') id: string) {
        return this.packagesService.findPackageById(id);
    }

    // Public inquiry endpoint
    @Post(':id/inquire')
    createInquiry(@Param('id') id: string, @Body() createDto: CreatePackageInquiryDto) {
        return this.packagesService.createInquiry(id, createDto);
    }

    // Admin package update
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @Put(':id')
    updatePackage(@Param('id') id: string, @Body() updateDto: Partial<CreatePackageDto>) {
        return this.packagesService.updatePackage(id, updateDto);
    }

    // Admin package delete
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @Delete(':id')
    deletePackage(@Param('id') id: string) {
        return this.packagesService.deletePackage(id);
    }
}


