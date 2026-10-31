import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);

    constructor(private configService: ConfigService) {}

    /**
     * Sends an OTP via SMS to the provided phone number.
     * @param phoneNumber The recipient's phone number
     * @param otp The 6-digit OTP code
     * @param context Context of the OTP (e.g. signup, login, admin_login)
     */
    async sendOtpSms(phoneNumber: string, otp: string, context: string): Promise<void> {
        this.logger.log(`Dispatching SMS OTP [${context}] to ${phoneNumber}`);

        // Strip +91 prefix — Fast2SMS takes 10-digit Indian numbers
        const cleanNumber = phoneNumber.replace(/^\+91/, '').trim();

        const apiKey = this.configService.get<string>('FAST2SMS_API_KEY');

        if (!apiKey || apiKey === 'your_fast2sms_api_key_here' || apiKey.length < 20) {
            this.logger.warn(`[DEV SMS LOG] 📱 -> To: ${cleanNumber} | Code: ${otp} | Context: ${context}`);
            return;
        }

        try {
            // Fast2SMS Quick Route (route: 'q') — works without DLT for testing
            const response = await axios.get(
                'https://www.fast2sms.com/dev/bulkV2',
                {
                    params: {
                        authorization: apiKey,
                        route: 'q',
                        message: `Your Ease2event verification code is ${otp}`,
                        flash: 0,
                        numbers: cleanNumber,
                    }
                }
            );

            this.logger.log(`📡 [FAST2SMS] Response: ${JSON.stringify(response.data)}`);

            if (response.data.return === true) {
                this.logger.log(`✅ SMS sent to ${cleanNumber} successfully.`);
            } else {
                const errorMsg = Array.isArray(response.data.message)
                    ? response.data.message.join(', ')
                    : response.data.message || 'Fast2SMS API failed';
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || error.message;
            this.logger.error(`❌ [SMS_ERROR] Failed to send OTP to ${cleanNumber}: ${errorMsg}`);

            this.logger.warn(`⚠️ [DEV/BYPASS] SMS failed — OTP for ${cleanNumber} is: ${otp}`);
            return; // Allow flow to continue even if SMS fails, so user can check Render logs for the OTP
        }
    }
}
