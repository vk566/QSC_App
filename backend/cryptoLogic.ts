import crypto from 'crypto';

// --- CONFIGURATION ---
// In production, keep this in your .env file!
// This key allows the backend to mathematically reconstruct chat keys.
const MASTER_SECRET = "QUANTUM_SUPER_SECRET_KEY_FOR_DEMO_APP_ONLY_32_BYTES_LONG"; 

/**
 * 1. Derive Deterministic Session Key
 * Instead of random bytes, we create a unique key based on WHO is talking.
 * This ensures we can recreate the key later for decryption.
 */
export const deriveSessionKey = (senderId: string, receiverId: string | null, groupId: string | null): Buffer => {
    let contextStr = "";
    
    if (groupId) {
        // Group Chat: Key depends on Group ID
        contextStr = `GROUP:${groupId}`;
    } else {
        // Direct Chat: Sort IDs so [A, B] generates same key as [B, A]
        const participants = [senderId, receiverId || ""].sort(); 
        contextStr = `P2P:${participants[0]}:${participants[1]}`;
    }

    // Use HMAC-SHA256 to mix the Context with the Master Secret
    return crypto.createHmac('sha256', MASTER_SECRET)
                 .update(contextStr)
                 .digest();
};

/**
 * 2. Encrypt Message (AES-256-GCM)
 */
export const encryptMessage = (message: string, sessionKey: Buffer) => {
    const iv = crypto.randomBytes(12); // Standard IV length for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', sessionKey, iv);
    
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');

    return {
        ciphertext: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag
    };
};

/**
 * 3. Decrypt Message
 */
export const decryptMessage = (
    ciphertext: string, 
    iv: string, 
    authTag: string, 
    sessionKey: Buffer
): string => {
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm', 
        sessionKey, 
        Buffer.from(iv, 'hex')
    );
    
    if (authTag) {
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    }

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
};