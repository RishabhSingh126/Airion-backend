import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity('packages')
export class Package {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('varchar', { length: 255 })
    title: string;

    @Column('text')
    description: string;

    @Column('decimal', { name: 'base_price', precision: 10, scale: 2 })
    basePrice: number;

    @Column('text', { array: true, default: [] })
    images: string[];

    @Column('jsonb', { nullable: true })
    features: string[];

    @Column('boolean', { name: 'is_active', default: true })
    isActive: boolean;

    @ManyToOne(() => Category)
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @Column('uuid', { name: 'category_id', nullable: true })
    categoryId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
