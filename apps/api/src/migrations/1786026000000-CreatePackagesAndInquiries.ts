import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePackagesAndInquiries1786026000000 implements MigrationInterface {
    name = 'CreatePackagesAndInquiries1786026000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "package_inquiries_status_enum" AS ENUM ('PENDING', 'ASSIGNED', 'COMPLETED', 'CANCELLED');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "packages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "base_price" numeric(10,2) NOT NULL,
                "images" text[] NOT NULL DEFAULT '{}',
                "features" jsonb,
                "is_active" boolean NOT NULL DEFAULT true,
                "category_id" uuid,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_packages_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_packages_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "package_inquiries" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "package_id" uuid NOT NULL,
                "customer_name" character varying NOT NULL,
                "customer_email" character varying NOT NULL,
                "customer_phone" character varying NOT NULL,
                "event_date" date,
                "message" text,
                "status" "package_inquiries_status_enum" NOT NULL DEFAULT 'PENDING',
                "vendor_id" uuid,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_package_inquiries_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_package_inquiries_package" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_package_inquiries_vendor" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE NO ACTION
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "package_inquiries";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "packages";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "package_inquiries_status_enum";`);
    }
}
