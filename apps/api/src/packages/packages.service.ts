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
        let pkg: Package | null = null;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUuid) {
            pkg = await this.packageRepository.findOne({
                where: { id },
                relations: ['category']
            });
        }
        if (!pkg) {
            pkg = await this.packageRepository.createQueryBuilder('p')
                .where('LOWER(p.title) = LOWER(:title)', { title: id })
                .getOne();
        }
        if (!pkg) {
            const newPkg = this.packageRepository.create({
                title: id.length > 200 ? id.substring(0, 200) : id,
                description: `Package inquiry for ${id}`,
                basePrice: 50000,
                isActive: true
            });
            pkg = await this.packageRepository.save(newPkg);
        }
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
        const inquiryData: any = { ...createDto };
        if (!inquiryData.eventDate) {
            delete inquiryData.eventDate;
        }
        const inquiry = this.inquiryRepository.create({
            ...inquiryData,
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

    async findVendorByUserId(userId: string) {
        return this.vendorRepository.findOne({ where: { userId } });
    }
}
