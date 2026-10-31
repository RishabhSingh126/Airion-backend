import { Controller, Post, Body, Headers, BadRequestException, RawBodyRequest, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import * as crypto from 'crypto';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post('create-order')
    async createOrder(@Body() body: { amount: number; currency?: string; receiptId?: string }) {
        if (!body.amount) {
            throw new BadRequestException('Amount is required');
        }
        return this.paymentsService.createOrder(body.amount, body.currency, body.receiptId);
    }

    @Post('verify')
    verifyPayment(@Body() body: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
        if (!body.razorpayOrderId || !body.razorpayPaymentId || !body.razorpaySignature) {
            throw new BadRequestException('Missing payment signature parameters');
        }
        
        const isValid = this.paymentsService.verifySignature(
            body.razorpayOrderId,
            body.razorpayPaymentId,
            body.razorpaySignature
        );

        if (!isValid) {
            throw new BadRequestException('Invalid payment signature');
        }

        // Ideally, update the booking/ad status in the DB here
        return { success: true, message: 'Payment verified successfully' };
    }

    @Post('webhook')
    async handleWebhook(
        @Headers('x-razorpay-signature') signature: string,
        @Body() body: any
    ) {
        if (!signature) {
            throw new BadRequestException('Webhook signature is missing');
        }

        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
        
        // Note: For true verification, the raw body buffer must be used.
        // For demonstration, simulating stringification.
        const stringifiedBody = JSON.stringify(body);
        
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(stringifiedBody)
            .digest('hex');

        if (expectedSignature !== signature) {
            throw new BadRequestException('Invalid Webhook Signature');
        }

        const eventType = body.event;
        console.log(`Received Razorpay Webhook Event: ${eventType}`);

        switch (eventType) {
            case 'payment.captured':
            case 'order.paid':
                // TODO: Update booking status to CONFIRMED
                console.log('Payment was successful for order:', body.payload.payment.entity.order_id);
                break;
            case 'payment.failed':
                // TODO: Update booking status to FAILED
                console.log('Payment failed for order:', body.payload.payment.entity.order_id);
                break;
            default:
                console.log(`Unhandled webhook event: ${eventType}`);
        }

        return { status: 'ok' };
    }
}
