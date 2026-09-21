import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package } from './entities/package.entity';
import { PackageInquiry, InquiryStatus } from './entities/package-inquiry.entity';
import { CreatePackageDto } from './dto/create-package.dto';
import { CreatePackageInquiryDto } from './dto/create-package-inquiry.dto';
import { Vendor } from '../vendors/entities/vendor.entity';

@Injectable()
export class PackagesService {
    constructor(
        @InjectRepository(Package)
        private packageRepository: Repository<Package>,
        @InjectRepository(PackageInquiry)
        private inquiryRepository: Repository<PackageInquiry>,
        @InjectRepository(Vendor)
        private vendorRepository: Repository<Vendor>
    ) {}

    async createPackage(createDto: CreatePackageDto) {
        const newPackage = this.packageRepository.create(createDto);
        return this.packageRepository.save(newPackage);
    }

    async findAllPackages() {
        return this.packageRepository.find({
            relations: ['category'],
            order: { createdAt: 'DESC' }
        });
    }

    async findPackageById(id: string) {
        const pkg = await this.packageRepository.findOne({
            where: { id },
            relations: ['category']
        });
        if (!pkg) throw new NotFoundException('Package not found');
        return pkg;
    }

    async updatePackage(id: string, updateDto: Partial<CreatePackageDto>) {
        const pkg = await this.findPackageById(id);
        Object.assign(pkg, updateDto);
        return this.packageRepository.save(pkg);
    }

    async deletePackage(id: string) {
        const pkg = await this.findPackageById(id);
        return this.packageRepository.remove(pkg);
    }

    async createInquiry(packageId: string, createDto: CreatePackageInquiryDto) {
        const pkg = await this.findPackageById(packageId);
        const inquiry = this.inquiryRepository.create({
            ...createDto,
            packageId: pkg.id
        });
        return this.inquiryRepository.save(inquiry);
    }

    async findAllInquiries() {
        return this.inquiryRepository.find({
            relations: ['package', 'vendor'],
            order: { createdAt: 'DESC' }
        });
    }

    async findInquiriesByVendor(vendorId: string) {
        return this.inquiryRepository.find({
            where: { vendorId },
            relations: ['package'],
            order: { createdAt: 'DESC' }
        });
    }

    async assignVendorToInquiry(inquiryId: string, vendorId: string) {
        const inquiry = await this.inquiryRepository.findOne({ where: { id: inquiryId } });
        if (!inquiry) throw new NotFoundException('Inquiry not found');

        const vendor = await this.vendorRepository.findOne({ where: { id: vendorId } });
        if (!vendor) throw new NotFoundException('Vendor not found');

        inquiry.vendorId = vendor.id;
        inquiry.status = InquiryStatus.ASSIGNED;
        return this.inquiryRepository.save(inquiry);
    }
}
