import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVendorMissingColumns1786030000000 implements MigrationInterface {
    name = 'AddVendorMissingColumns1786030000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "vendor_type" varchar;`);
        await queryRunner.query(`ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "pan_number" varchar;`);
        await queryRunner.query(`ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "aadhar_number" varchar;`);
        await queryRunner.query(`ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "is_sponsored" boolean DEFAULT false;`);
        await queryRunner.query(`ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "is_featured" boolean DEFAULT false;`);
        await queryRunner.query(`ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "rejection_reason" text;`);
        await queryRunner.query(`ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "reviewed_by_id" uuid;`);
        await queryRunner.query(`ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "kyc_submitted_at" timestamp;`);
        await queryRunner.query(`ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "kyc_reviewed_at" timestamp;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vendors" DROP COLUMN IF EXISTS "kyc_reviewed_at";`);
        await queryRunner.query(`ALTER TABLE "vendors" DROP COLUMN IF EXISTS "kyc_submitted_at";`);
        await queryRunner.query(`ALTER TABLE "vendors" DROP COLUMN IF EXISTS "reviewed_by_id";`);
        await queryRunner.query(`ALTER TABLE "vendors" DROP COLUMN IF EXISTS "rejection_reason";`);
        await queryRunner.query(`ALTER TABLE "vendors" DROP COLUMN IF EXISTS "is_featured";`);
        await queryRunner.query(`ALTER TABLE "vendors" DROP COLUMN IF EXISTS "is_sponsored";`);
        await queryRunner.query(`ALTER TABLE "vendors" DROP COLUMN IF EXISTS "aadhar_number";`);
        await queryRunner.query(`ALTER TABLE "vendors" DROP COLUMN IF EXISTS "pan_number";`);
        await queryRunner.query(`ALTER TABLE "vendors" DROP COLUMN IF EXISTS "vendor_type";`);
    }
}

