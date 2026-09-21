import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignVendorDto {
    @IsUUID()
    @IsNotEmpty()
    vendorId: string;
}
