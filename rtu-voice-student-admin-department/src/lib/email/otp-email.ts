import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";
import { buildOtpEmail, OTP_LOGO_CONTENT_ID } from "./template";

type MailResult = { success: true } | { success: false; error: string };
type OtpPurpose = "registration" | "password_reset";

function requireEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`Missing environment variable: ${name}`);
    return value;
}

const resend = new Resend(requireEnv("RESEND_API_KEY"));
const MAIL_FROM = requireEnv("MAIL_FROM");             
const LOG_OTP = process.env.LOG_OTP === "true";      
const LOGO_PATH = path.join(process.cwd(), "public", "images", "rtu-voice-logo.png");

async function sendOtpEmail(
    purpose: OtpPurpose,
    to: string,
    otpCode: string,
    name: string
): Promise<MailResult> {
    if (LOG_OTP) {
        console.log(`[DEV] OTP for ${to}: ${otpCode}`);
    }

    try {
        const { subject, html, text } = buildOtpEmail(purpose, { name, otp: otpCode });
        const logo = await readFile(LOGO_PATH);

        const { error } = await resend.emails.send({
            from: MAIL_FROM,
            to,
            subject,
            html,
            text,
            attachments: [
                {
                    filename: "rtu-voice-logo.png",
                    content: logo,
                    contentType: "image/png",
                    contentId: OTP_LOGO_CONTENT_ID,
                },
            ],
        });

        if (error) {
            console.error("[sendOtpEmail] Resend error:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error("[sendOtpEmail] Unexpected error:", err);
        return { success: false, error: "Unexpected error sending email" };
    }
}

export const sendRegistrationEmail = (email: string, otpCode: string, firstName: string) =>
    sendOtpEmail("registration", email, otpCode, firstName);

export const sendResetPasswordEmail = (email: string, otpCode: string, firstName: string) =>
    sendOtpEmail("password_reset", email, otpCode, firstName);