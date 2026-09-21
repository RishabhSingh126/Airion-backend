import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { CreatePackageInquiryDto } from './dto/create-package-inquiry.dto';
import { AssignVendorDto } from './dto/assign-vendor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('packages')
export class PackagesController {
    constructor(private readonly packagesService: PackagesService) {}

    // Public package endpoints
    @Get()
    findAllPackages() {
        return this.packagesService.findAllPackages();
    }

    @Get(':id')
    findPackageById(@Param('id') id: string) {
        return this.packagesService.findPackageById(id);
    }

    // Public inquiry endpoint
    @Post(':id/inquire')
    createInquiry(@Param('id') id: string, @Body() createDto: CreatePackageInquiryDto) {
        return this.packagesService.createInquiry(id, createDto);
    }

    // Vendor specific endpoints
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('vendor')
    @Get('vendor/inquiries')
    findVendorInquiries(@Request() req: any) {
        const vendorId = req.user.vendorId;
        return this.packagesService.findInquiriesByVendor(vendorId);
    }

    // Admin package management endpoints
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'super_admin')
    @Post()
    createPackage(@Body() createDto: CreatePackageDto) {
        return this.packagesService.createPackage(createDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'super_admin')
    @Put(':id')
    updatePackage(@Param('id') id: string, @Body() updateDto: Partial<CreatePackageDto>) {
        return this.packagesService.updatePackage(id, updateDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'super_admin')
    @Delete(':id')
    deletePackage(@Param('id') id: string) {
        return this.packagesService.deletePackage(id);
    }

    // Admin inquiry management endpoints
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'super_admin')
    @Get('admin/inquiries')
    findAllInquiries() {
        return this.packagesService.findAllInquiries();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'super_admin')
    @Put('admin/inquiries/:id/assign')
    assignVendor(@Param('id') id: string, @Body() assignDto: AssignVendorDto) {
        return this.packagesService.assignVendorToInquiry(id, assignDto.vendorId);
    }
}
