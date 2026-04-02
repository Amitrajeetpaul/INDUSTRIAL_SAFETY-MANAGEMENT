import 'dotenv/config';
import { storage } from './server/storage';
import { hashPassword } from './server/auth';
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied: string, stored: string) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function check() {
    const admin = await storage.getUserByUsername('admin');
    if (admin) {
        const isMatch = await comparePasswords('password123', admin.password);
        console.log("Password match for admin:", isMatch);
    }
}

check();
