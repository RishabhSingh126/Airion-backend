import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class CreatePackageDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    basePrice: number;

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    images?: string[];

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    features?: string[];

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsUUID()
    @IsOptional()
    categoryId?: string;
}
