"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { Resend } from "resend";
import * as AuthStore from "@/features/auth/authStore"
import { generateOtp, hashOtp } from "@/features/auth";

export type RegisterState = {
    success: boolean;
    message: string;
    errors?: {
        firstName?: string[];
        lastName?: string[];
        email?: string[];
        password?: string[];
        confirmPassword?: string[];
    }
}

export type verifyState = {
    success: boolean;
    message: string;
}


// validate the registration input and send otp if successful
export async function validateAndSendOtp(formData: FormData): Promise<RegisterState> {
    // create database connection
    const supabase = await createClient();

    // fetch the input from the form
    const firstName = String(formData.get('firstName')).trim();
    const lastName = String(formData.get('lastName')).trim();
    const email = String(formData.get('email')).trim().toLowerCase();
    const [local, domain, ...rest] = email.split("@");
    const password = String(formData.get('password')).trim();
    const confirmPassword = String(formData.get('confirmPassword')).trim();

    const errors: NonNullable<RegisterState["errors"]> = {};

    // input validation
    if (!firstName){
        errors.firstName = ["Please enter your first name."];
    }
    if (!lastName){
        errors.lastName = ["Please enter your last name."];
    }
    if (!email){
        errors.email = ["Please enter your institutional email."];
    }
    if (!local || domain !== "rtu.edu.ph" || rest.length > 0 ){
        errors.email = ["Please enter your institutional email."];
    }
    if (!password){
        errors.password = ["Please enter your password."];
    }
    if (!confirmPassword){
        errors.confirmPassword = ["Please enter your password."]
    }
    if (confirmPassword !== password){
        errors.confirmPassword = ["Password doesn't match."]
    }

    // returns if there's an invalid  input
    if (Object.keys(errors).length > 0){
        return ({
            success: false,
            message: "[Error] Invalid Input.",
            errors,
        });
    }

    // checks if email is already registered
    const {data:user, error:userError} = await supabase
                                        .from("users")
                                        .select("rtu_email")
                                        .eq("rtu_email", email)
                                        .maybeSingle();

    if (userError){
        return ({
            success: false,
            message: String(userError.message)
        });
    }
                                     
    if (user){
        return ({
            success: false,
            message: "[Error] Invalid Input.",
            errors: {
                email: ["Email has already been used."]
            }
        });
    }

    // checks resend cooldown 
    const {data:otp, error:otpError} = await supabase
    .from("otp_verifications")
    .select("created_at")
    .eq("email", email)
    .eq("purpose_id", 1)
    .order("created_at", { ascending: false})
    .limit(1)
    .maybeSingle();

    if(otpError){
        return ({
            success: false,
            message: "[Error] Fetching Data."
        });
    }

    if(otp){
        const otp_created_at = new Date(otp.created_at).getTime();
        
        const secondsSince = Date.now() - otp_created_at;

        if (secondsSince < 60){
            return ({
                success: false,
                message: "please wait"
            });
        }

        
    }
    
    // generate otp code 
    let debugMessage = "Diagnostic Started.\n";
    let otpCode = "Not Generated Yet";
    let hashedOtp = "Not Hashed Yet";

    try {
        // 1. Generate OTP
        otpCode = await generateOtp();
        debugMessage += `1. Generated OTP: ${otpCode} (Type: ${typeof otpCode})\n`;

        // 2. Hash it
        hashedOtp = await hashOtp(otpCode); 
        debugMessage += `2. Hash completed successfully.\n`;

        // 3. Database Insert
        const { error: otp_insert_error } = await supabase
            .from("otp_verifications")
            .insert({
                email: email,
                hashed_code: hashedOtp,
                purpose_id: 1,
                attempts: 0,
            });

        if (otp_insert_error) {
            debugMessage += `3. Database Error: ${otp_insert_error.message}\n`;
        } else {
            debugMessage += `3. Database insert succeeded.\n`;
        }

    } catch (err: any) {
        debugMessage += `CRITICAL CAUGHT ERROR: ${err.message}\n`;
    }

    // 4. Send EVERYTHING to your inbox so you can read the variables directly
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'delivered@resend.dev', 
        subject: "Debug OTP Code Details",
        html: `
            <h1>Your OTP Code is: ${otpCode}</h1>
            <h3>Server Execution Logs:</h3>
            <pre>${debugMessage}</pre>
        `
    });

    AuthStore.useEmailStore.getState().setEmail(email)
    AuthStore.useFirstNameStore.getState().setFirstName(firstName)
    AuthStore.useLastNameStore.getState().setLastName(lastName)
    AuthStore.usePasswordStore.getState().setPassword(password)
    return ({
        success: true,
        message: ""
    })
}

// verify and register user
export async function verifyAndRegisterUser(formData: FormData): Promise<verifyState>{
    // create database connection
    const supabase = await createClient();

    const first_digit = String(formData.get("first_digit")).trim();
    const second_digit = String(formData.get("second_digit")).trim();
    const third_digit = String(formData.get("third_digit")).trim();
    const fourth_digit = String(formData.get("fourth_digit")).trim();
    const fifth_digit = String(formData.get("fifth_digit")).trim();
    const sixth_digit = String(formData.get("sixth_digit")).trim();
    
    // input validation
    if (!first_digit || !second_digit || !third_digit || !fourth_digit || !fifth_digit || !sixth_digit){
        return ({
            success: false,
            message: "Please enter the 6-digit code"
        });
    }

    const email = AuthStore.useEmailStore.getState().email;

    if (!email){
        return ({
            success: false,
            message: "no email stored in the state."
        });
    }

    const purpose_id = 1; // Registration id

    const {data: emailData, error: emailError} = await supabase.from("otp_verifications").select("id, email, hashed_code, attempts, created_at, expires_at").eq("email", email).eq("purpose_id", purpose_id).order("created_at", {ascending: false}).limit(1);
    
    if (emailError){
        return ({
            success: false,
            message: String(emailError.message)
        });
    }

    // if no generated otp yet
    if (!emailData){
        return ({
            success: false,
            message: "OTP not found"
        });
    }

    const mostRecentOtp = emailData[0];
    // if attempt to the otp reaches 3 (invalid the otp)
    if (mostRecentOtp.attempts >= 3){
        return ({
            success: false,
            message: "You reached the maximum attempts"
        });
    }


    // checks the expiry
    let {created_at, expires_at} = mostRecentOtp;

    created_at = new Date(created_at).getTime();
    expires_at = new Date(expires_at).getTime();
    
    const current_time = Date.now();
    if (current_time > expires_at){
        return({
            success: false,
            message: "Code expired."
        });
    }

    if (current_time < created_at) {
        return {
            success: false,
            message: "Invalid action time."
        };
    }

    // hash the input
    let otpCode = ""
    formData.forEach((digit) => {otpCode+=digit})

    const isMatch = await bcrypt.compare(otpCode, mostRecentOtp.hashed_code);
    // compare it in the database
    if(!isMatch){
        const {error: attemptUpdateError} = await supabase.from("otp_verifications").update({attempts: Number(mostRecentOtp['attempts']) + 1}).eq("id", mostRecentOtp['id']).select();

        if (attemptUpdateError){
            return({
                success: false,
                message: "Failed to update attempt count"
            })
        }
        return {
            success: false,
            message: "Otp doesnt match"
        }
    }

    const password = AuthStore.usePasswordStore.getState().password;
    const firstName = AuthStore.useFirstNameStore.getState().firstName;
    const lastName = AuthStore.useLastNameStore.getState().lastName;

    if (!firstName){
        return ({
            success: false,
            message: "no first name stored in the state."
        });
    }

    if (!lastName){
        return ({
            success: false,
            message: "no last name stored in the state."
        });
    }

    if (!password){
        return ({
            success: false,
            message: "no password stored in the state."
        });
    }

    // if success register account
    const {error} = await supabase.auth.signUp({
        email: email, 
        password: password, 
        options: {
            data: {
                first_name: firstName,
                last_name: lastName
            } 
        }
    });

    if (error){
        return ({
            success: false,
            message: error.message
        })
    }

    // resets the authStore states
    AuthStore.useEmailStore.getState().reset();
    AuthStore.usePasswordStore.getState().reset();
    AuthStore.useFirstNameStore.getState().reset();
    AuthStore.useLastNameStore.getState().reset();

    return {
        success: true,
        message: ""
    }
    
}

// resend otp
export async function resendOtp(purpose_id: number){
    const supabase = await createClient();

    const email = AuthStore.useEmailStore.getState().email;

    if (!email) {
        return ({
            success: false,
            message: "no email in the state!"
        })
    }

    // if the resend reaches 5, blocked for 1 day
    const {data: otpData, error: errorData} = await supabase.from("otp_verifications").select("id").eq("email",email).eq("purpose_id", purpose_id).order("created_at", {ascending: false})

    if (errorData){
        return ({
            success: false,
            message: errorData.message
        })
    }

    if(!otpData){
        return ({
            success: false,
            message: "No OTP found."
        })
    }

    if (otpData?.length > 5){
        return ({
            success: false,
            message: "You reached the maximum count of resend. Wait for 24 hours to register again."
        })
    }

    // invalid the old one
    const {error:updateOtpError} = await supabase.from("otp_verifications").update({expires_at: Date.now()}).eq("id", otpData[0].id).select()

    if(updateOtpError){
        return ({
            success: false,
            message: updateOtpError.message
        })
    }

    // generate new otp and hash it
    const newOtpCode = await generateOtp();

    const newHashedOtp = await hashOtp(newOtpCode);

    // insert to the db
    const {error: insertOtpError} = await supabase.from("otp_verifications").insert({
                email: email,
                hashed_code: newHashedOtp,
                purpose_id: purpose_id,
                attempts: 0,
            }).select();
    
    if (insertOtpError){
        return ({
            success: false,
            message: "Inserting otp error"
        })
    }

    // send email    
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'delivered@resend.dev', 
        subject: "Resend",
        html: `
            <h1>Your OTP Code is: ${newOtpCode}</h1>
        `
    });

    return ({
        success: true,
        message: "Email sent"
    })
}

// login user
// change user password


// create complaint
// edit complaint department
// export async function reassignDepartment(){
//     revalidatePath("/");
// }
// edit complaint status
