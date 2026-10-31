import { Injectable, InternalServerErrorException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
    private razorpay: any;

    constructor(private configService: ConfigService) {
        this.razorpay = new Razorpay({
            key_id: this.configService.get<string>('RAZORPAY_KEY_ID') || 'rzp_live',
            key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET') || 'secret',
        });
    }

    async createOrder(amount: number, currency = 'INR', receiptId?: string) {
        const amountInPaise = Math.round(amount * 100);
        
        if (amountInPaise < 100) {
            throw new BadRequestException('Amount must be at least 100 paise (₹1)');
        }

        try {
            const options = {
                amount: amountInPaise,
                currency,
                receipt: receiptId || `receipt_${Date.now()}`,
            };
            const order = await this.razorpay.orders.create(options);
            return {
                order_id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt
            };
        } catch (error: any) {
            console.error('Razorpay Order Creation Error:', error);
            if (error.statusCode === 401) {
                throw new UnauthorizedException('Razorpay authentication failed');
            }
            throw new InternalServerErrorException(error.description || 'Failed to create Razorpay order');
        }
    }

    verifySignature(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): boolean {
        const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || '';
        const body = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body.toString())
            .digest('hex');
            
        return expectedSignature === razorpaySignature;
    }
}
