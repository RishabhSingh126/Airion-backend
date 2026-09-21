import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreatePackageInquiryDto {
    @IsString()
    @IsNotEmpty()
    customerName: string;

    @IsEmail()
    @IsNotEmpty()
    customerEmail: string;

    @IsString()
    @IsNotEmpty()
    customerPhone: string;

    @IsString()
    @IsOptional()
    eventDate?: string;

    @IsString()
    @IsOptional()
    message?: string;
}
