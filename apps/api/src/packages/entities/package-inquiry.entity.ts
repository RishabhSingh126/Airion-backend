import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Package } from './package.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';

export enum InquiryStatus {
    PENDING = 'PENDING',
    ASSIGNED = 'ASSIGNED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

@Entity('package_inquiries')
export class PackageInquiry {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Package)
    @JoinColumn({ name: 'package_id' })
    package: Package;

    @Column('uuid', { name: 'package_id' })
    packageId: string;

    @Column('varchar', { name: 'customer_name' })
    customerName: string;

    @Column('varchar', { name: 'customer_email' })
    customerEmail: string;

    @Column('varchar', { name: 'customer_phone' })
    customerPhone: string;

    @Column('date', { name: 'event_date', nullable: true })
    eventDate: string;

    @Column('text', { nullable: true })
    message: string;

    @Column({ type: 'enum', enum: InquiryStatus, default: InquiryStatus.PENDING })
    status: InquiryStatus;

    @ManyToOne(() => Vendor)
    @JoinColumn({ name: 'vendor_id' })
    vendor: Vendor;

    @Column('uuid', { name: 'vendor_id', nullable: true })
    vendorId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
