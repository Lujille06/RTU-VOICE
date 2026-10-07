import crypto from 'crypto'
import bcrypt from "bcrypt";

export async function generateOTP(length: number = 6){
    let otp = "";

    for (let i = 0; i < length; i++){
        otp += crypto.randomInt(0, 10).toString();
    }
    
    return otp;
}

export async function hashOTP(otp: string, round: number = 10){
    const hashedOtp = bcrypt.hash(otp, round);

    return hashedOtp;
}