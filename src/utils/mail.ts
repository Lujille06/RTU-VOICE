import "server-only";
import { Resend } from "resend";

type MailResult = { success: boolean };

const isProd = process.env.NODE_ENV === "production";

// Shared sender used by both emails below
async function sendOtpEmail(
    to: string,
    subject: string,
    title: string,
    otpCode: string
): Promise<MailResult> {
    // In development, Resend's test inbox swallows the email, so print the code
    // in your terminal instead. This never runs in production.
    if (!isProd) {
        console.log(`[DEV] OTP for ${to}: ${otpCode}`);
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Resend does NOT throw on API failures; it returns { data, error }
        const { error } = await resend.emails.send({
            // In production, use a domain verified in Resend, e.g. "RTU Voice <no-reply@yourdomain.com>"
            from: process.env.MAIL_FROM ?? "onboarding@resend.dev",
            to: isProd ? to : "delivered@resend.dev",
            subject,
            html: `
                <div style="font-family: sans-serif;">
                    <h2>${title}</h2>
                    <p>Your OTP code is:</p>
                    <h1 style="letter-spacing: 4px;">${otpCode}</h1>
                    <p>This code expires soon. If you didn't request it, you can ignore this email.</p>
                </div>
            `,
        });

        if (error) {
            console.error("[sendOtpEmail] Resend error:", error);
            return { success: false };
        }
    } catch (err) {
        console.error("[sendOtpEmail] Unexpected error:", err);
        return { success: false };
    }

    return { success: true };
}

export async function sendRegistrationEmail(email: string, otpCode: string): Promise<MailResult> {
    return sendOtpEmail(email, "Verify your email for RTU Voice", "Verify your email", otpCode);
}

export async function sendResetPasswordEmail(email: string, otpCode: string): Promise<MailResult> {
    return sendOtpEmail(email, "Reset your password for RTU Voice", "Reset your password", otpCode);
}