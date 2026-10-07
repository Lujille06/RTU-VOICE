"use server"

import crypto from 'crypto'

export async function generateOTP(length: number = 6){
    let otp = "";

    for (let i = 0; i < length; i++){
        otp += crypto.randomInt(0, 10).toString();
    }
    
    return otp;
}