import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter | null = null;
    private resendClient: Resend | null = null;

    constructor(private configService: ConfigService) {
        this.initClients();
    }

    private initClients() {
        const resendKey = this.configService.get<string>('RESEND_API_KEY');
        if (resendKey) {
            this.resendClient = new Resend(resendKey);
            this.logger.log('📧 [Email] Resend API client initialized.');
            return;
        }

        const user = this.configService.get<string>('SMTP_USER');
        const pass = this.configService.get<string>('SMTP_PASS');

        if (!user || !pass) {
            this.logger.warn('⚠️ [Email] No SMTP or Resend credentials configured. Emails will be logged to console only.');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            requireTLS: true,
            auth: { user, pass },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000,
            socketTimeout: 10000,
        });

        this.logger.log('📧 [Email] Gmail SMTP transporter initialized.');
    }

    async sendOtpEmail(to: string, otp: string, purpose: 'login' | 'signup' | 'admin_login'): Promise<void> {
        const subject = purpose === 'signup'
            ? 'Your Ease2event Signup Verification Code'
            : purpose === 'admin_login'
            ? 'Your Admin Login Verification Code'
            : 'Your Ease2event Login Verification Code';

        const html = this.buildOtpEmailTemplate(otp, purpose);

        // Always log OTP in dev for testing without real SMTP
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        if (!isProduction) {
            this.logger.log(`🔑 [EMAIL OTP] To: ${to} | Code: ${otp} | Purpose: ${purpose}`);
        }

        if (!this.resendClient && !this.transporter) {
            this.logger.warn(`📭 [Email] No email client configured — OTP logged above only.`);
            return;
        }

        try {
            if (this.resendClient) {
                // Using Resend API (HTTP based, bypasses Render SMTP block)
                const from = this.configService.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'; 
                const { error } = await this.resendClient.emails.send({
                    from: `"Ease2event" <${from}>`,
                    to: [to],
                    subject,
                    html,
                });
                
                if (error) throw new Error(error.message);
                this.logger.log(`✅ [Email] OTP email sent via Resend to: ${to}`);
            } else if (this.transporter) {
                const from = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER');
                await this.transporter.sendMail({
                    from: `"Ease2event" <${from}>`,
                    to,
                    subject,
                    html,
                });
                this.logger.log(`✅ [Email] OTP email sent via SMTP to: ${to}`);
            }
        } catch (error: any) {
            const isSandboxError = error.message && (
                error.message.includes('testing emails to your own email address') ||
                error.message.includes('verify a domain at resend.com/domains')
            );
            
            if (isSandboxError) {
                this.logger.warn(`⚠️ [Resend Sandbox Restriction] Unable to send email to ${to}. Please retrieve the OTP code from this log:`);
                this.logger.warn(`🔑 [EMAIL OTP LOG] To: ${to} | Code: ${otp} | Purpose: ${purpose}`);
                return; // Gracefully continue so signup/login flow is not blocked
            }

            this.logger.error(`❌ [Email] Failed to send OTP email to ${to}: ${error.message}`);
            // Throw an HttpException so the exact error isn't masked by NestJS in production
            throw new InternalServerErrorException(`EMAIL_ERROR: ${error.message}`);
        }
    }

    private buildOtpEmailTemplate(otp: string, purpose: 'login' | 'signup' | 'admin_login'): string {
        const action = purpose === 'signup' ? 'complete your registration' : purpose === 'admin_login' ? 'access the admin portal' : 'sign in to your account';
        const currentYear = new Date().getFullYear();

        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ease2event OTP</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#dc2626;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Ease2event</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Premium Event Planning Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 40px 32px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Verification Code</p>
              <h2 style="margin:0 0 24px;color:#0f172a;font-size:24px;font-weight:700;">
                Use this code to ${action}
              </h2>
              
              <!-- OTP Box -->
              <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:12px;padding:32px;text-align:center;margin-bottom:32px;">
                <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:2px;">Your Code</p>
                <p style="margin:0;color:#dc2626;font-size:48px;font-weight:800;letter-spacing:12px;font-family:'Courier New',monospace;">${otp}</p>
              </div>

              <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
                This code is valid for <strong>5 minutes</strong>. Do not share it with anyone.
              </p>
              <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
                If you did not request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                © ${currentYear} Ease2event. All rights reserved.<br/>
                This is an automated message, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `.trim();
    }

    async sendVendorStatusEmail(to: string, vendorName: string, status: 'approved' | 'rejected', reason?: string): Promise<void> {
        const subject = status === 'approved'
            ? 'Ease2Event - Your Vendor Account has been Approved!'
            : 'Ease2Event - Action Required: Vendor Account Update';

        const html = this.buildVendorStatusTemplate(vendorName, status, reason);

        const isProduction = this.configService.get('NODE_ENV') === 'production';
        if (!isProduction) {
            this.logger.log(`📧 [EMAIL VENDOR STATUS] To: ${to} | Status: ${status}`);
        }

        if (!this.resendClient && !this.transporter) {
            this.logger.warn(`📭 [Email] No email client configured — Vendor Status logged above only.`);
            return;
        }

        try {
            if (this.resendClient) {
                const from = this.configService.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'; 
                const { error } = await this.resendClient.emails.send({
                    from: `"Ease2event" <${from}>`,
                    to: [to],
                    subject,
                    html,
                });
                
                if (error) throw new Error(error.message);
                this.logger.log(`✅ [Email] Vendor status email sent via Resend to: ${to}`);
            } else if (this.transporter) {
                const from = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER');
                await this.transporter.sendMail({
                    from: `"Ease2event" <${from}>`,
                    to,
                    subject,
                    html,
                });
                this.logger.log(`✅ [Email] Vendor status email sent via SMTP to: ${to}`);
            }
        } catch (error: any) {
            this.logger.error(`❌ [Email] Failed to send Vendor Status email to ${to}: ${error.message}`);
        }
    }

    private buildVendorStatusTemplate(vendorName: string, status: 'approved' | 'rejected', reason?: string): string {
        const currentYear = new Date().getFullYear();
        const headerColor = status === 'approved' ? '#10b981' : '#f59e0b';
        const actionTitle = status === 'approved' ? 'Welcome Aboard!' : 'KYC Verification Update';
        const actionMessage = status === 'approved' 
            ? 'Great news! Your vendor account has been fully verified and approved. You can now log into your dashboard and start accepting bookings.'
            : 'We reviewed your KYC submission but encountered an issue. Please check the reason below and resubmit your documents from your dashboard.';

        let reasonHtml = '';
        if (status === 'rejected' && reason) {
            reasonHtml = `
              <div style="background:#fff7ed;border-left:4px solid #f97316;padding:16px;margin:24px 0;border-radius:4px;">
                <p style="margin:0 0 8px;font-weight:700;color:#9a3412;">Rejection Reason:</p>
                <p style="margin:0;color:#c2410c;white-space:pre-wrap;">${reason}</p>
              </div>
            `;
        }

        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ease2event Vendor Status</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:${headerColor};padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">Ease2event</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:48px 40px 32px;">
              <h2 style="margin:0 0 24px;color:#0f172a;font-size:24px;font-weight:700;">
                Hello ${vendorName},
              </h2>
              <h3 style="margin:0 0 16px;color:#334155;font-size:18px;">${actionTitle}</h3>
              <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
                ${actionMessage}
              </p>
              ${reasonHtml}
              <div style="margin-top:32px;">
                <a href="https://vendor.ease2event.com" style="background:#4f46e5;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Go to Dashboard</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                © ${currentYear} Ease2event. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `.trim();
    }
    async sendBookingStatusEmail(to: string, userName: string, bookingCode: string, status: 'confirmed' | 'canceled', serviceName: string, vendorName: string): Promise<void> {
        const subject = status === 'confirmed'
            ? `Booking Confirmed: ${serviceName}`
            : `Booking Canceled: ${serviceName}`;

        const html = this.buildBookingStatusTemplate(userName, bookingCode, status, serviceName, vendorName);

        if (!this.resendClient && !this.transporter) {
            this.logger.warn(`📭 [Email] No email client configured — Booking status logged to console only.`);
            return;
        }

        try {
            if (this.resendClient) {
                const from = this.configService.get<string>('RESEND_FROM_EMAIL') || 'booking@resend.dev'; 
                const { error } = await this.resendClient.emails.send({
                    from: `"Ease2event" <${from}>`,
                    to: [to],
                    subject,
                    html,
                });
                if (error) throw new Error(error.message);
                this.logger.log(`✅ [Email] Booking status email sent via Resend to: ${to}`);
            } else if (this.transporter) {
                const from = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER');
                await this.transporter.sendMail({
                    from: `"Ease2event" <${from}>`,
                    to,
                    subject,
                    html,
                });
                this.logger.log(`✅ [Email] Booking status email sent via SMTP to: ${to}`);
            }
        } catch (error: any) {
            this.logger.error(`❌ [Email] Failed to send Booking Status email to ${to}: ${error.message}`);
        }
    }

    private buildBookingStatusTemplate(userName: string, bookingCode: string, status: 'confirmed' | 'canceled', serviceName: string, vendorName: string): string {
        const currentYear = new Date().getFullYear();
        const headerColor = status === 'confirmed' ? '#10b981' : '#ef4444';
        const actionTitle = status === 'confirmed' ? 'Booking Confirmed!' : 'Booking Canceled';
        const actionMessage = status === 'confirmed' 
            ? `Great news! Your booking for <strong>${serviceName}</strong> has been officially confirmed by <strong>${vendorName}</strong>.`
            : `Unfortunately, your booking for <strong>${serviceName}</strong> with <strong>${vendorName}</strong> has been canceled.`;

        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ease2event Booking Update</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:${headerColor};padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">Ease2event</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:48px 40px 32px;">
              <h2 style="margin:0 0 24px;color:#0f172a;font-size:24px;font-weight:700;">
                Hello ${userName},
              </h2>
              <h3 style="margin:0 0 16px;color:#334155;font-size:18px;">${actionTitle} (Code: ${bookingCode})</h3>
              <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
                ${actionMessage}
              </p>
              <div style="margin-top:32px;">
                <a href="https://ease2event.com/dashboard/bookings" style="background:#dc2626;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">View Booking Details</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                © ${currentYear} Ease2event. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `.trim();
    }
}
