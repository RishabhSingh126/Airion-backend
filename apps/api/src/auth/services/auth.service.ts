import { Injectable, ConflictException, UnauthorizedException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { Otp } from '../entities/otp.entity';
import { SendOtpDto, VerifySignupOtpDto, VerifyLoginOtpDto, ResetPasswordDto } from '../dto/otp.dto';
import { SignupDto } from '../dto/signup.dto';

import { SessionService } from './session.service';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { RefreshToken } from '../entities/refresh-token.entity';
import * as admin from 'firebase-admin';
import { EmailService } from '../../common/services/email.service';
import { SmsService } from '../../common/services/sms.service';
const { authenticator } = require('otplib');
// @ts-ignore
import * as QRCode from 'qrcode';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Otp)
        private otpRepository: Repository<Otp>,
        @InjectRepository(RefreshToken)
        private refreshTokenRepository: Repository<RefreshToken>,
        private jwtService: JwtService,
        private configService: ConfigService,
        private sessionService: SessionService,
        private emailService: EmailService,
        private smsService: SmsService,
    ) {
        this.initializeFirebase();
    }

    // Initialize Firebase Admin SDK using Environment Variables
    private initializeFirebase() {
        if (admin.apps.length === 0) {
            const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
            const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
            const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

            // Check if credentials are placeholder values
            const isPlaceholderConfig = !clientEmail || 
                clientEmail.includes('xxxxx') || 
                !privateKey || 
                privateKey.includes('REPLACE_WITH_REAL');

            if (!projectId || isPlaceholderConfig) {
                this.logger.warn('⚠️ Firebase Admin SDK: Service account credentials are placeholder/missing.');
                this.logger.warn('   → Dev fallback active: Firebase tokens will be decoded locally (no SMS verification on backend).');
                this.logger.warn('   → To enable full verification: Firebase Console → Project Settings → Service accounts → Generate new private key');
                this.logger.warn('   → Then set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in your .env file.');
                if (this.configService.get('NODE_ENV') === 'production') {
                    this.logger.error('FATAL: Production mode requires valid Firebase credentials. Insecure fallback will fail incoming requests.');
                }
                return;
            }

            try {
                // Robust private key parsing
                let formattedPrivateKey = privateKey;
                
                // Remove surrounding quotes if they exist
                if (formattedPrivateKey.startsWith('"') && formattedPrivateKey.endsWith('"')) {
                    formattedPrivateKey = formattedPrivateKey.slice(1, -1);
                } else if (formattedPrivateKey.startsWith("'") && formattedPrivateKey.endsWith("'")) {
                    formattedPrivateKey = formattedPrivateKey.slice(1, -1);
                }

                // Replace escaped newlines with actual newlines and normalize double-escaped chars
                formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\'/g, "'").trim();
                
                // If user omitted -----BEGIN PRIVATE KEY----- / -----END PRIVATE KEY-----, add them automatically
                if (!formattedPrivateKey.includes('BEGIN PRIVATE KEY')) {
                    const cleanKey = formattedPrivateKey.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
                    const chunks = cleanKey.match(/.{1,64}/g) || [cleanKey];
                    formattedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----\n`;
                } else if (!formattedPrivateKey.includes('\n')) {
                    // Fix spacing/formatting if it's on a single line without explicit \n
                    formattedPrivateKey = formattedPrivateKey.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n');
                    formattedPrivateKey = formattedPrivateKey.replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----\n');
                    
                    const content = formattedPrivateKey.replace('-----BEGIN PRIVATE KEY-----\n', '').replace('\n-----END PRIVATE KEY-----\n', '').replace(/\s+/g, '');
                    const matchedContent = content.match(/.{1,64}/g);
                    if (matchedContent) {
                        formattedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${matchedContent.join('\n')}\n-----END PRIVATE KEY-----\n`;
                    }
                }

                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey: formattedPrivateKey,
                    }),
                });
                this.logger.log('🔥 Firebase Admin SDK initialized successfully!');
            } catch (error: any) {
                this.logger.error(`❌ Failed to initialize Firebase Admin SDK: ${error.message}`);
            }
        }
    }

    // Generate 6-digit secure OTP
    private generateOTP(): string {
        return CryptoUtil.generateOTP(6);
    }

    // Send OTP for signup
    async sendSignupOTP(dto: SendOtpDto): Promise<{ message: string; otp?: string; _dev_otp?: string }> {
        const identifier = (dto.phone || dto.email)?.trim()?.toLowerCase();

        if (!identifier) {
            throw new BadRequestException('Please provide either phone or email');
        }

        // Check if user already exists
        const whereConditions: any[] = [];
        if (dto.phone) whereConditions.push({ phoneNumber: dto.phone });
        if (dto.email) whereConditions.push({ email: dto.email });

        // Run existence check and cleanup in parallel
        const [existingUser, _] = await Promise.all([
            this.userRepository.findOne({ where: whereConditions }),
            this.otpRepository.delete({ identifier, type: 'signup' })
        ]);

        if (existingUser) {
            throw new ConflictException('User already exists with this phone or email');
        }

        const otpCode = this.generateOTP();
        const hashedOtp = await bcrypt.hash(otpCode, 10);
        const expiresAt = (Date.now() + 5 * 60 * 1000).toString(); // Standard 5 minute TTL

        const otp = this.otpRepository.create({
            identifier,
            otp: hashedOtp,
            expiresAt,
            type: 'signup',
        });
        await this.otpRepository.save(otp);

        this.logger.log(`🔑 [OTP_DEBUG] Signup OTP for ${identifier}: ${otpCode}`);

        // Send OTP via email or SMS
        if (dto.email) {
            await this.emailService.sendOtpEmail(dto.email, otpCode, 'signup');
        } else if (dto.phone) {
            await this.smsService.sendOtpSms(dto.phone, otpCode, 'signup');
        }

        const isProduction = this.configService.get('NODE_ENV') === 'production';
        return {
            message: 'OTP sent successfully',
            ...(!isProduction && { _dev_otp: otpCode })
        };
    }

    // Verify OTP and create account
    async verifySignupOTP(dto: VerifySignupOtpDto): Promise<{ access_token: string; refresh_token: string; user: Partial<User>; isProfileComplete?: boolean }> {
        const identifier = (dto.phone || dto.email)?.trim()?.toLowerCase();

        if (!identifier) {
            throw new BadRequestException('Please provide either phone or email');
        }

        // 🚨 SECURITY: Block admin role from signup — admins are created manually
        if (dto.role === UserRole.ADMIN) {
            throw new ForbiddenException('Admin accounts cannot be created via signup. Contact your system administrator.');
        }

                // Validate OTP
        const otpRecord = await this.otpRepository.findOne({
            where: { identifier, type: 'signup' },
            order: { createdAt: 'DESC' },
        });

        if (true) {
            if (!otpRecord) {
                throw new UnauthorizedException('OTP not found or expired');
            }

            if (Number(otpRecord.expiresAt) < Date.now()) {
                await this.otpRepository.delete({ identifier });
                throw new UnauthorizedException('OTP expired');
            }

            const isMatch = await bcrypt.compare(dto.otp, otpRecord.otp);
            if (!isMatch) {
                throw new UnauthorizedException('Invalid OTP code');
            }
        }

        // Clear OTP after successful verification
        if (otpRecord) {
            await this.otpRepository.delete({ identifier });
        }
        // Create new user
        const userData = {
            name: dto.name || `User ${dto.phone || dto.email}`, // Default name if not provided
            email: dto.email,
            phoneNumber: dto.phone,
            password: dto.password || 'otp-auth-user', // Placeholder for OTP-only users
            role: (dto.email === 'abhishekkumar518@gmail.com' || dto.email === 'vinaysharma31681@gmail.com' || dto.email === 'modeweltjob@gmail.com') ? UserRole.ADMIN : (dto.role || UserRole.USER),
            emailVerified: !!dto.email, // Auto-verify if using email
            marketingConsent: dto.marketingConsent || false,
        };
        const user = this.userRepository.create(userData as any) as unknown as User;

        await this.userRepository.save(user);

        // isProfileComplete is false for new vendor accounts (they must complete onboarding)
        const isProfileComplete = false;

        // Generate JWT token — include isProfileComplete for vendor routing decisions
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            isProfileComplete: user.role === UserRole.VENDOR ? isProfileComplete : undefined,
            vendorId: (user as any).vendor?.id
        };
        const access_token = this.jwtService.sign(payload);

        // Return user without password
        const { password, ...userWithoutPassword } = user;

        const refresh_token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        await this.sessionService.createSession(user.id, refresh_token, '0.0.0.0', 'Ease2event Gateway');

        return {
            access_token,
            refresh_token,
            user: userWithoutPassword as Partial<User>,
            isProfileComplete: user.role === UserRole.VENDOR ? isProfileComplete : undefined,
        };
    }

    // Send OTP for login
    async sendLoginOTP(dto: SendOtpDto): Promise<{ message: string; otp?: string; _dev_otp?: string }> {
        const identifier = (dto.phone || dto.email)?.trim()?.toLowerCase();

        if (!identifier) {
            throw new BadRequestException('Please provide either phone or email');
        }

        // Check if user exists with flexible phone matching
        const whereConditions: any[] = [];
        if (dto.phone) {
            whereConditions.push({ phoneNumber: dto.phone });
            // Also try matching without +91 if provided
            if (dto.phone.startsWith('+91')) {
                whereConditions.push({ phoneNumber: dto.phone.substring(3) });
            }
            // Also try matching with +91 if not provided
            else if (dto.phone.length === 10) {
                whereConditions.push({ phoneNumber: `+91${dto.phone}` });
            }
        }
        if (dto.email) whereConditions.push({ email: dto.email });

        // User lookup
        const user = await this.userRepository.findOne({ where: whereConditions });

        // Enforce role check if role is provided
        if (user && (dto as any).role && user.role !== (dto as any).role) {
            this.logger.warn(`🚨 [AUTH] Cross-role login attempt: User ${identifier} (Role: ${user.role}) tried to login as ${(dto as any).role}`);
            throw new UnauthorizedException(`Account found, but registered as ${user.role}. Please login to the correct portal.`);
        }

        // Parallelize user check and OTP cleanup
        await this.otpRepository.delete({ identifier, type: 'login' });

        const otpCode = this.generateOTP();
        const hashedOtp = await bcrypt.hash(otpCode, 10);
        const expiresAt = (Date.now() + 5 * 60 * 1000).toString(); // Standard 5 minute TTL

        const otp = this.otpRepository.create({
            identifier,
            otp: hashedOtp,
            expiresAt,
            type: 'login',
        });

        await this.otpRepository.save(otp);

        this.logger.log(`🔑 [OTP_DEBUG] Login OTP for ${identifier}: ${otpCode}`);

        // Send OTP via email or SMS
        if (dto.email) {
            await this.emailService.sendOtpEmail(dto.email, otpCode, 'login');
        } else if (dto.phone) {
            await this.smsService.sendOtpSms(dto.phone, otpCode, 'login');
        }

        const isProduction = this.configService.get('NODE_ENV') === 'production';
        return {
            message: 'OTP sent successfully',
            ...(!isProduction && { _dev_otp: otpCode })
        };
    }

    // Send OTP for Admin Login
    async sendAdminOtp(dto: { email: string }): Promise<{ message: string; otp?: string; _dev_otp?: string }> {
        const adminEmails = ['vinaysharma31681@gmail.com', 'abhishekkumar518@gmail.com'];
        const identifier = dto.email?.trim().toLowerCase() || '';

        if (!adminEmails.includes(identifier)) {
            this.logger.warn(`🚨 SECURITY ALERT: Unauthorized Admin OTP request from ${dto.email}`);
            throw new ForbiddenException('Unauthorized access attempt: Email not authorized');
        }

        // Email is authorized — generate and send OTP
        // (DB record check happens at verifyAdminOtp when issuing the JWT)
        await this.otpRepository.delete({ identifier });

        const otpCode = this.generateOTP();
        const hashedOtp = await bcrypt.hash(otpCode, 10);
        const expiresAt = (Date.now() + 5 * 60 * 1000).toString();

        const otp = this.otpRepository.create({
            identifier,
            otp: hashedOtp,
            expiresAt,
            attempts: 0
        });

        await this.otpRepository.save(otp);

        this.logger.log(`🔑 [OTP_DEBUG] Admin OTP for ${identifier}: ${otpCode}`);
        this.logger.log(`🔒 [ADMIN_AUDIT] OTP sent to Admin: ${identifier}`);

        await this.emailService.sendOtpEmail(identifier, otpCode, 'admin_login');

        const isProduction = this.configService.get('NODE_ENV') === 'production';
        return {
            message: 'OTP sent successfully to admin email',
            ...(!isProduction && { _dev_otp: otpCode }),
        };
    }

    // Verify OTP and login for normal users
    async verifyLoginOTP(dto: VerifyLoginOtpDto): Promise<{ access_token: string; refresh_token: string; user: Partial<User>; isProfileComplete?: boolean }> {
        const identifier = (dto.phone || dto.email)?.trim()?.toLowerCase();

        if (!identifier) {
            throw new BadRequestException('Please provide either phone or email');
        }

                // Get OTP Record
        const otpRecord = await this.otpRepository.findOne({
            where: { identifier, type: 'login' },
            order: { createdAt: 'DESC' },
        });

        // Validate OTP record
        if (true) {
            if (!otpRecord) {
                throw new UnauthorizedException('Verification code expired or not found. Please resend.');
            }

            if (Number(otpRecord.expiresAt) < Date.now()) {
                await this.otpRepository.delete({ identifier });
                throw new UnauthorizedException('Verification code expired.');
            }

            const isMatch = await bcrypt.compare(dto.otp, otpRecord.otp);
            if (!isMatch) {
                throw new UnauthorizedException('Invalid verification code.');
            }
        }

        // Clear OTP
        if (otpRecord) {
            await this.otpRepository.delete({ identifier });
        }

        // Get user — load vendor relation to get isProfileComplete
        const whereConditions: any[] = [];
        if (dto.phone) {
            whereConditions.push({ phoneNumber: dto.phone });
            if (dto.phone.startsWith('+91')) {
                whereConditions.push({ phoneNumber: dto.phone.substring(3) });
            } else if (dto.phone.length === 10) {
                whereConditions.push({ phoneNumber: `+91${dto.phone}` });
            }
        }
        if (dto.email) whereConditions.push({ email: dto.email });

        const user = await this.userRepository.findOne({
            where: whereConditions,
            relations: ['vendor', 'vendor.category', 'vendor.subcategory', 'vendor.gallery', 'vendor.ads'],
        });

        let loggedInUser = user;

        if (!loggedInUser) {
            if (dto.email === 'abhishekkumar518@gmail.com' || dto.email === 'vinaysharma31681@gmail.com' || dto.email === 'modeweltjob@gmail.com') {
                const userData = {
                    name: 'Admin',
                    email: dto.email,
                    phoneNumber: dto.phone,
                    password: 'otp-auth-user',
                    role: UserRole.ADMIN,
                    emailVerified: true,
                };
                loggedInUser = this.userRepository.create(userData as any) as unknown as User;
                await this.userRepository.save(loggedInUser);
            } else {
                throw new UnauthorizedException('User not found');
            }
        }

        if (!loggedInUser) {
            throw new UnauthorizedException('User session could not be established');
        }

        // Enforce role check if role is provided
        if (dto.role && loggedInUser.role !== dto.role) {
            this.logger.warn(`🚨 [AUTH] Cross-role login attempt: User ${identifier} (Role: ${loggedInUser.role}) tried to verify as ${dto.role}`);
            throw new UnauthorizedException(`Account found, but registered as ${loggedInUser.role}. Please login to the correct portal.`);
        }

        // Update last login
        loggedInUser.lastLoginAt = new Date();
        await this.userRepository.save(loggedInUser);

        // Get vendor isProfileComplete status
        const isProfileComplete = (loggedInUser as any).vendor?.isProfileComplete ?? false;
        const vendorId = (loggedInUser as any).vendor?.id;

        // Generate JWT token — include isProfileComplete for client-side routing
        const payload = {
            sub: loggedInUser.id,
            email: loggedInUser.email,
            role: loggedInUser.role,
            isProfileComplete: loggedInUser.role === UserRole.VENDOR ? isProfileComplete : undefined,
            vendorId,
        };
        const access_token = this.jwtService.sign(payload);

        // Return user without password
        const { password, ...userWithoutPassword } = loggedInUser;

        // Prevent circular reference issues during serialization
        if (userWithoutPassword.vendor) {
            delete (userWithoutPassword.vendor as any).user;
            
            if (userWithoutPassword.vendor.gallery) {
                userWithoutPassword.vendor.gallery.forEach((item: any) => {
                    delete item.vendor;
                });
            }
            if (userWithoutPassword.vendor.ads) {
                userWithoutPassword.vendor.ads.forEach((item: any) => {
                    delete item.vendor;
                });
            }
        }

        // 🔐 SECURE REFRESH SYSTEM: Generate Entropy-Rich Token
        const refreshTokenPlain = CryptoUtil.generateSecureToken(32);
        const tokenHash = CryptoUtil.hashValue(refreshTokenPlain);

        // Persist session node
        const refreshToken = this.refreshTokenRepository.create({
            userId: loggedInUser.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Day TTL
        });
        await this.refreshTokenRepository.save(refreshToken);

        return {
            access_token,
            refresh_token: refreshTokenPlain,
            user: userWithoutPassword as Partial<User>,
            isProfileComplete: loggedInUser.role === UserRole.VENDOR ? isProfileComplete : undefined,
        };
    }

    // Verify OTP for Admin
    async verifyAdminOtp(dto: { email: string; otp: string }): Promise<{ access_token: string; user: Partial<User> }> {
        const adminEmails = ['vinaysharma31681@gmail.com', 'abhishekkumar518@gmail.com'];
        const identifier = dto.email?.trim().toLowerCase() || '';

        if (!adminEmails.includes(identifier)) {
            throw new ForbiddenException('Unauthorized access attempt: Email not authorized');
        }
        const otpRecord = await this.otpRepository.findOne({
            where: { identifier },
            order: { createdAt: 'DESC' },
        });

        if (!otpRecord) {
            throw new UnauthorizedException('OTP not found or expired');
        }

        if (Number(otpRecord.expiresAt) < Date.now()) {
            await this.otpRepository.delete({ identifier });
            throw new UnauthorizedException('OTP expired');
        }

        // Check attempts
        if (otpRecord.attempts >= 3) {
            await this.otpRepository.delete({ identifier });
            throw new ForbiddenException('Maximum attempts reached. Please request a new OTP.');
        }

        const isMatch = await bcrypt.compare(dto.otp, otpRecord.otp);
        if (!isMatch) {
            otpRecord.attempts += 1;
            await this.otpRepository.save(otpRecord);
            this.logger.warn(`🔒 [ADMIN_AUDIT] Failed verification attempt for Admin. Attempt ${otpRecord.attempts}/3`);
            throw new UnauthorizedException(`Invalid OTP code. ${3 - otpRecord.attempts} attempts remaining.`);
        }

        // Success: Clear OTP
        await this.otpRepository.delete({ identifier });

        // Raw SQL query — bypasses TypeORM metadata/module cache entirely
        let rows = await this.userRepository.query(
            `SELECT id, name, email as "email", role FROM users WHERE email = $1 AND role = 'admin' LIMIT 1`,
            [identifier]
        );
        let adminUser = rows[0];

        if (!adminUser) {
            this.logger.log(`⚠️ [ADMIN_AUDIT] No admin DB record for email: ${identifier}. Auto-creating admin user.`);
            
            const userData = {
                name: 'Admin',
                email: identifier,
                password: 'otp-auth-user',
                role: UserRole.ADMIN,
                emailVerified: true,
            };
            
            const newUser = this.userRepository.create(userData as any) as unknown as User;
            await this.userRepository.save(newUser);
            
            adminUser = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            };
        }

        // Check if user has MFA enabled — if so, issue a short-lived temp token instead of full access
        const fullUser = await this.userRepository.findOne({ where: { id: adminUser.id } });
        if (fullUser?.mfaEnabled && fullUser?.mfaSecret) {
            const tempPayload = { sub: adminUser.id, role: adminUser.role, is2faPending: true };
            const tempToken = this.jwtService.sign(tempPayload, { expiresIn: '5m' });
            this.logger.log(`🔐 [ADMIN_2FA] 2FA required for Admin ID: ${adminUser.id}`);
            return {
                require2fa: true,
                tempToken,
                user: null,
                access_token: null,
            } as any;
        }

        const payload = {
            sub: adminUser.id,
            role: adminUser.role,
            name: adminUser.name
        };
        const access_token = this.jwtService.sign(payload);

        this.logger.log(`✅ [ADMIN_AUDIT] Successful login for Admin ID: ${adminUser.id}`);

        return {
            access_token,
            user: { id: adminUser.id, name: adminUser.name, role: adminUser.role, email: adminUser.email }
        };
    }

    async getUserById(userId: string): Promise<Partial<User>> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['vendor', 'vendor.gallery', 'vendor.ads', 'vendor.category', 'vendor.subcategory'], // Deep load vendor assets
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const { password, ...userWithoutPassword } = user;

        // Prevent circular reference issues during serialization
        if (userWithoutPassword.vendor) {
            delete (userWithoutPassword.vendor as any).user;
            
            if (userWithoutPassword.vendor.gallery) {
                userWithoutPassword.vendor.gallery.forEach(item => {
                    delete (item as any).vendor;
                });
            }
            if (userWithoutPassword.vendor.ads) {
                userWithoutPassword.vendor.ads.forEach(item => {
                    delete (item as any).vendor;
                });
            }
        }

        return userWithoutPassword;
    }

    async signup(dto: SignupDto): Promise<{ access_token: string; user: Partial<User> }> {
        const existingUser = await this.userRepository.findOne({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('User already exists with this email');
        }

        const user = this.userRepository.create({
            name: dto.name,
            email: dto.email,
            phoneNumber: dto.phoneNumber,
            password: dto.password,
            role: dto.role || UserRole.USER,
            marketingConsent: true, // Direct signup assumes consent or handle via DTO
        });

        await this.userRepository.save(user);

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            vendorId: (user as any).vendor?.id
        };
        const access_token = this.jwtService.sign(payload);

        const { password, ...userWithoutPassword } = user;
        return { access_token, user: userWithoutPassword };
    }

    // Forgot Password
    async forgotPassword(email: string): Promise<{ message: string; link?: string }> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new BadRequestException('User with this email does not exist');
        }

        // Generate cryptographically secure reset token
        const token = CryptoUtil.generateSecureToken(32);
        const identifier = 'reset_' + email;
        const expiresAt = (Date.now() + 15 * 60 * 1000).toString(); // 15 mins

        // Delete existing reset tokens
        await this.otpRepository.delete({ identifier });

        const otp = this.otpRepository.create({
            identifier,
            otp: token,
            expiresAt,
        });
        await this.otpRepository.save(otp);

        // Simulate sending email
        const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
        const resetLink = `${frontendUrl}/reset-password?token=${token}&email=${email}`;
        console.log('📧 Password Reset Link for ' + email + ': ' + resetLink);

        return {
            message: 'Password reset link sent to your email',
            link: this.configService.get('NODE_ENV') !== 'production' ? resetLink : undefined
        };
    }

    /**
     * 🔄 Secure Token Rotation
     * Verifies current entropy-rich refresh token and issues a new synchronized pair.
     */
    async refreshToken(token: string): Promise<{ access_token: string; refresh_token: string }> {
        if (!token) throw new UnauthorizedException('Identity cipher missing.');

        const tokenHash = CryptoUtil.hashValue(token);
        const refreshToken = await this.refreshTokenRepository.findOne({
            where: { tokenHash, isRevoked: false },
            relations: ['user', 'user.vendor']
        });

        if (!refreshToken || refreshToken.expiresAt < new Date()) {
            if (refreshToken) {
                refreshToken.isRevoked = true;
                await this.refreshTokenRepository.save(refreshToken);
            }
            throw new UnauthorizedException('Identity synchronization expired. Re-authentication required.');
        }

        const user = refreshToken.user;

        // 🔐 ROTATE: Revoke old cipher immediately
        refreshToken.isRevoked = true;
        await this.refreshTokenRepository.save(refreshToken);

        // Generate new atomic identity pair
        const isProfileComplete = (user as any).vendor?.isProfileComplete ?? false;
        const vendorId = (user as any).vendor?.id;

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            isProfileComplete: user.role === UserRole.VENDOR ? isProfileComplete : undefined,
            vendorId,
        };
        const access_token = this.jwtService.sign(payload);

        const newRefreshTokenPlain = CryptoUtil.generateSecureToken(32);
        const newTokenHash = CryptoUtil.hashValue(newRefreshTokenPlain);

        const newRefreshToken = this.refreshTokenRepository.create({
            userId: user.id,
            tokenHash: newTokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        await this.refreshTokenRepository.save(newRefreshToken);

        return { access_token, refresh_token: newRefreshTokenPlain };
    }

    // Reset Password
    async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
        const { email, token, newPassword } = dto;
        const identifier = 'reset_' + email;

        const otpRecord = await this.otpRepository.findOne({
            where: { identifier },
            order: { createdAt: 'DESC' },
        });

        if (!otpRecord) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        if (Number(otpRecord.expiresAt) < Date.now()) {
            await this.otpRepository.delete({ identifier });
            throw new BadRequestException('Reset token expired');
        }

        if (otpRecord.otp !== token) {
            throw new BadRequestException('Invalid reset token');
        }

        // Update password
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new BadRequestException('User not found');
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await this.userRepository.save(user);

        // Clear token
        await this.otpRepository.delete({ identifier });

        return { message: 'Password reset successfully' };
    }

    async changePassword(userId: string, dto: { oldPassword?: string; newPassword: string }): Promise<{ message: string }> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // If user already has a password, verify old password unless it's an OTP-only user with placeholder password
        if (user.password && user.password !== 'otp-auth-user' && dto.oldPassword) {
            const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
            if (!isMatch) {
                throw new BadRequestException('Incorrect current password');
            }
        } else if (user.password && user.password !== 'otp-auth-user' && !dto.oldPassword) {
            throw new BadRequestException('Current password is required to change password');
        }

        user.password = await bcrypt.hash(dto.newPassword, 10);
        await this.userRepository.save(user);

        return { message: 'Password changed successfully' };
    }

    async updateProfile(userId: string, dto: any): Promise<any> {
        try {
            // Strict filtering of fields to ensure database compatibility
            const allowedFields = ['name', 'email', 'avatar', 'location', 'language', 'interests', 'marketingConsent', 'phoneNumber'];
            const filteredDto: any = {};

            for (const key of allowedFields) {
                if (dto[key] !== undefined && dto[key] !== null) {
                    const value = typeof dto[key] === 'string' ? dto[key].trim() : dto[key];
                    if (value !== '') {
                        filteredDto[key] = value;
                    }
                }
            }

            // Check if phone number or email is already taken by ANOTHER user
            if (filteredDto.email) {
                const existingEmail = await this.userRepository.findOne({
                    where: { email: filteredDto.email }
                });
                if (existingEmail && existingEmail.id !== userId) {
                    throw new BadRequestException('This email address is already associated with another account.');
                }
            }

            if (filteredDto.phoneNumber) {
                const existingPhone = await this.userRepository.findOne({
                    where: { phoneNumber: filteredDto.phoneNumber }
                });
                if (existingPhone && existingPhone.id !== userId) {
                    throw new BadRequestException('This phone number is already associated with another account.');
                }
            }

            if (Object.keys(filteredDto).length === 0) {
                return this.getUserById(userId);
            }

            await this.userRepository
                .createQueryBuilder()
                .update(User)
                .set(filteredDto)
                .where("id = :id", { id: userId })
                .execute();

            // Return a clean version of the user without circular relations to avoid 500 errors during JSON serialization
            const updatedUser = await this.userRepository.findOne({ where: { id: userId } });
            if (!updatedUser) {
                throw new Error('User not found after update');
            }

            // Remove sensitive fields
            const { password, ...safeUser } = updatedUser;
            return safeUser;
        } catch (error: any) {
            this.logger.error(`CRITICAL: Profile update failed for user ${userId}. Error: ${error.message}`, error.stack);
            throw new BadRequestException(error.message || 'Error saving user information');
        }
    }

    async findAllUsers(role?: string): Promise<User[]> {
        const where: any = {};
        if (role) {
            where.role = role;
        }

        return this.userRepository.find({
            where,
            order: { createdAt: 'DESC' },
            select: ['id', 'name', 'email', 'phoneNumber', 'createdAt', 'role', 'lastLoginAt']
        });
    }

    // Verify Firebase ID Token and return local JWTs
    async verifyFirebaseToken(idToken: string, requestedRole: UserRole): Promise<{ access_token: string; refresh_token: string; user: Partial<User>; isProfileComplete?: boolean }> {
        this.initializeFirebase();

        try {
            let phoneNumber: string | undefined;
            let email: string | undefined;
            let name: string | undefined;

        // If Firebase Admin SDK is not configured, use a safe development mode fallback
        const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
        const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
        const isPlaceholderConfig = !clientEmail || 
            clientEmail.includes('xxxxx') || 
            !privateKey || 
            privateKey.includes('REPLACE_WITH_REAL');
        
        const isNotConfigured = admin.apps.length === 0 || isPlaceholderConfig;

        if (isNotConfigured) {
            if (this.configService.get('NODE_ENV') === 'production') {
                throw new UnauthorizedException('Insecure token verification is disabled in production. Valid Firebase credentials are required on the server.');
            }
            // Dev fallback: decode Firebase JWT locally without verifying signature
            try {
                this.logger.warn('⚠️ [Firebase Auth] Using local token decode fallback (no Admin SDK). Set real service account keys for production!');
                const parts = idToken.split('.');
                if (parts.length !== 3) {
                    throw new BadRequestException('Invalid Firebase token format.');
                }
                const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4);
                const decodedPayload = JSON.parse(Buffer.from(paddedPayload, 'base64').toString('utf-8'));
                phoneNumber = decodedPayload.phone_number;
                email = decodedPayload.email;
                name = decodedPayload.name;
                
                if (!phoneNumber && !email) {
                    throw new BadRequestException('Firebase token does not contain a phone number or email.');
                }
                this.logger.log(`📱 [Firebase Dev Fallback] Decoded from token - Phone: ${phoneNumber || 'N/A'}, Email: ${email || 'N/A'}`);
            } catch (decodeErr: any) {
                if (decodeErr instanceof BadRequestException) throw decodeErr;
                throw new BadRequestException('Failed to decode Firebase token. Please ensure it is a valid Firebase ID token.');
            }
        } else {
            try {
                // 1. Verify token with Firebase Admin
                const decodedToken = await admin.auth().verifyIdToken(idToken);
                phoneNumber = decodedToken.phone_number;
                email = decodedToken.email;
                name = decodedToken.name;
            } catch (err: any) {
                this.logger.error('Firebase token verification failed:', err);
                throw new UnauthorizedException('Invalid Firebase authentication token.');
            }
        }

        if (!phoneNumber && !email) {
            throw new UnauthorizedException('Authentication token did not contain a valid phone number or email.');
        }

        if (phoneNumber) phoneNumber = phoneNumber.trim();
        if (email) email = email.trim().toLowerCase();

            // 2. Query our local DB for the user using flexible matching
            const whereConditions: any[] = [];
            if (phoneNumber) {
                whereConditions.push({ phoneNumber });
                if (phoneNumber.startsWith('+91')) {
                    whereConditions.push({ phoneNumber: phoneNumber.substring(3) });
                } else if (phoneNumber.length === 10) {
                    whereConditions.push({ phoneNumber: `+91${phoneNumber}` });
                }
            }
            if (email) {
                whereConditions.push({ email });
            }

            let user = await this.userRepository.findOne({
                where: whereConditions,
                relations: ['vendor', 'vendor.category', 'vendor.subcategory', 'vendor.gallery', 'vendor.ads'],
            });

            // 3. Auto-Register if user does not exist (Genesis Flow)
            if (!user) {
                if (requestedRole === UserRole.ADMIN) {
                    throw new ForbiddenException('Admin accounts cannot be created via social/phone auth.');
                }
                
                const generatedName = name || (phoneNumber ? `User ${phoneNumber}` : `User ${email}`);
                const userData = {
                    name: generatedName,
                    phoneNumber: phoneNumber || null,
                    email: email || null,
                    password: 'firebase-auth-user', // Placeholder
                    role: requestedRole || UserRole.USER,
                    emailVerified: !!email,
                };
                user = this.userRepository.create(userData as any) as unknown as User;
                await this.userRepository.save(user);
            } else {
            // Update existing user with new info if missing
            let updated = false;
            if (email && !user.email) { user.email = email; user.emailVerified = true; updated = true; }
            if (name && user.name.startsWith('User +')) { user.name = name; updated = true; }
            if (phoneNumber && !user.phoneNumber) { user.phoneNumber = phoneNumber; updated = true; }
            
            // Auto-upgrade to Admin if email matches admin list
            if (email && user.role !== UserRole.ADMIN) {
                const adminEmails = [
                    'abhishekkumar518@gmail.com',
                    'vinaysharma31681@gmail.com',
                    'modeweltjob@gmail.com',
                    'admin@ease2event.com'
                ];
                if (adminEmails.includes(email)) {
                    user.role = UserRole.ADMIN;
                    updated = true;
                    this.logger.log(`🛡️ Auto-upgraded user ${email} to ADMIN role via Firebase Login`);
                }
            }
            
            if (updated) await this.userRepository.save(user);
        }

        // Update last login
        user.lastLoginAt = new Date();
        await this.userRepository.save(user);

        // Get vendor attributes if vendor
            const isProfileComplete = user.role === UserRole.VENDOR ? ((user as any).vendor?.isProfileComplete ?? false) : undefined;
            const vendorId = (user as any).vendor?.id;

            // 4. Generate local application JWTs
            const payload = {
                sub: user.id,
                email: user.email,
                role: user.role,
                isProfileComplete: user.role === UserRole.VENDOR ? isProfileComplete : undefined,
                vendorId,
            };
            const access_token = this.jwtService.sign(payload);

            // Return user without password
            const { password, ...userWithoutPassword } = user;

            // Generate secure refresh token
            const refreshTokenPlain = CryptoUtil.generateSecureToken(32);
            const tokenHash = CryptoUtil.hashValue(refreshTokenPlain);

            const refreshToken = this.refreshTokenRepository.create({
                userId: user.id,
                tokenHash,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Day TTL
            });
            await this.refreshTokenRepository.save(refreshToken);

            return {
                access_token,
                refresh_token: refreshTokenPlain,
                user: userWithoutPassword as Partial<User>,
                isProfileComplete: user.role === UserRole.VENDOR ? isProfileComplete : undefined,
            };
        } catch (error: any) {
            this.logger.error(`❌ Firebase token verification failed: ${error.message}`, error.stack);
            throw new UnauthorizedException(error.message || 'Invalid Firebase token or verification error');
        }
    }

    // ─────────────────────────────────────────
    // TOTP / MFA Methods (Admin 2FA)
    // ─────────────────────────────────────────

    /**
     * Generate a new TOTP secret for the user and return a QR code URL.
     * The secret is NOT saved until the user verifies it via enable2fa.
     */
    async generate2faSecret(userId: string): Promise<{ secret: string; qrCodeUrl: string; otpAuthUrl: string }> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('User not found');

        const secret = authenticator.generateSecret();
        const appName = this.configService.get('APP_NAME', 'Ease2Event');
        const otpAuthUrl = authenticator.keyuri(user.email || user.phoneNumber || userId, appName, secret);
        const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

        // Temporarily store the secret (not enabled yet)
        user.mfaSecret = secret;
        await this.userRepository.save(user);

        this.logger.log(`🔐 [2FA] Generated 2FA secret for user: ${userId}`);
        return { secret, qrCodeUrl, otpAuthUrl };
    }

    /**
     * Verify an OTP code and permanently enable 2FA for the user.
     */
    async enable2fa(userId: string, otp: string): Promise<{ message: string }> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('User not found');
        if (!user.mfaSecret) throw new BadRequestException('Generate a 2FA secret first by calling /auth/2fa/generate');

        const isValid = authenticator.verify({ token: otp, secret: user.mfaSecret });
        if (!isValid) throw new BadRequestException('Invalid OTP code. Please try again.');

        user.mfaEnabled = true;
        await this.userRepository.save(user);

        this.logger.log(`✅ [2FA] 2FA enabled for user: ${userId}`);
        return { message: '2FA has been enabled successfully.' };
    }

    /**
     * Verify a TOTP code using a temporary token issued during Admin login.
     * If valid, exchange the temp token for a full access token.
     */
    async verify2faLogin(tempToken: string, otp: string): Promise<{ access_token: string; user: Partial<User> }> {
        let decoded: any;
        try {
            decoded = this.jwtService.verify(tempToken);
        } catch {
            throw new UnauthorizedException('Temporary token is invalid or expired. Please log in again.');
        }

        if (!decoded.is2faPending) {
            throw new UnauthorizedException('Invalid token type.');
        }

        const user = await this.userRepository.findOne({ where: { id: decoded.sub } });
        if (!user || !user.mfaSecret) throw new UnauthorizedException('User not found or 2FA not configured.');

        const isValid = authenticator.verify({ token: otp, secret: user.mfaSecret });
        if (!isValid) {
            this.logger.warn(`🔒 [2FA] Failed 2FA verification for user: ${user.id}`);
            throw new UnauthorizedException('Invalid 2FA code. Please check your authenticator app.');
        }

        const payload = { sub: user.id, role: user.role };
        const access_token = this.jwtService.sign(payload);

        const refreshTokenPlain = CryptoUtil.generateSecureToken(32);
        const tokenHash = CryptoUtil.hashValue(refreshTokenPlain);
        await this.refreshTokenRepository.save(this.refreshTokenRepository.create({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }));

        this.logger.log(`✅ [2FA] 2FA verified and full session issued for user: ${user.id}`);
        const { password, mfaSecret, ...safeUser } = user as any;
        return { access_token, user: safeUser };
    }

    /**
     * Disable 2FA for a user (requires current OTP for confirmation).
     */
    async disable2fa(userId: string, otp: string): Promise<{ message: string }> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user || !user.mfaEnabled || !user.mfaSecret) throw new BadRequestException('2FA is not enabled.');

        const isValid = authenticator.verify({ token: otp, secret: user.mfaSecret });
        if (!isValid) throw new BadRequestException('Invalid OTP code.');

        user.mfaEnabled = false;
        user.mfaSecret = undefined;
        await this.userRepository.save(user);

        this.logger.log(`✅ [2FA] 2FA disabled for user: ${userId}`);
        return { message: '2FA has been disabled.' };
    }
}
