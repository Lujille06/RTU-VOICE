import "server-only";
import { Resend } from "resend";
import { buildOtpEmail } from "./template";

type MailResult = { success: boolean };
type OtpPurpose = "registration" | "password_reset";

const isProd = process.env.NODE_ENV === "production";

// Shared sender used by both emails below
async function sendOtpEmail(
    purpose: OtpPurpose,
    to: string,
    otpCode: string,
    name: string
): Promise<MailResult> {
    // In development, Resend's test inbox swallows the email, so print the code
    // in your terminal instead. This never runs in production.
    if (!isProd) {
        console.log(`[DEV] OTP for ${to}: ${otpCode}`);
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { subject, html, text } = buildOtpEmail(purpose, {
            name,
            otp: otpCode,
            logoUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
        });

        // Resend does NOT throw on API failures; it returns { data, error }
        const { error } = await resend.emails.send({
            // In production, use a domain verified in Resend, e.g. "RTU Voice <no-reply@yourdomain.com>"
            from: process.env.MAIL_FROM ?? "onboarding@resend.dev",
            to: isProd ? to : "delivered@resend.dev",
            subject,
            html,
            text,
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

export async function sendRegistrationEmail(
    email: string,
    otpCode: string,
    firstName: string
): Promise<MailResult> {
    return sendOtpEmail("registration", email, otpCode, firstName);
}

export async function sendResetPasswordEmail(
    email: string,
    otpCode: string,
    firstName: string
): Promise<MailResult> {
    return sendOtpEmail("password_reset", email, otpCode, firstName);
}