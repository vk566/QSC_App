import { Router, Request, Response } from 'express';
import { 
    encryptMessage, 
    decryptMessage, 
    deriveSessionKey 
} from './cryptoLogic';

export const router = Router();

// --- SEND ROUTE (Encryption) ---
router.post('/send', async (req: Request, res: Response) => {
    try {
        // 1. Get IDs from Frontend to generate the specific key
        const { message, senderId, receiverId, groupId } = req.body;

        if (!message) {
             res.status(400).json({ error: 'Message field is required' });
             return;
        }

        // 2. Derive the Session Key (Deterministic)
        const sessionKey = deriveSessionKey(senderId, receiverId, groupId);

        // 3. Encrypt
        const encryptedData = encryptMessage(message, sessionKey);

        // 4. Return formatted data (No sessionId needed anymore)
        res.json({
            status: 'Message encrypted securely',
            encryptionDetails: {
                iv: encryptedData.iv,
                authTag: encryptedData.authTag,
                ciphertext: encryptedData.ciphertext,
            }
        });

    } catch (error: any) {
        console.error('Encryption Error:', error.message);
        res.status(500).json({ error: 'Encryption failed' });
    }
});

// --- RECEIVE ROUTE (Decryption) ---
router.post('/receive', async (req: Request, res: Response) => {
    try {
        // 1. Get IDs and Ciphertext from Frontend
        const { ciphertext, iv, authTag, senderId, receiverId, groupId } = req.body;

        if (!ciphertext || !iv) {
            res.status(400).json({ error: "Missing decryption data" });
            return;
        }

        // 2. Re-derive the EXACT SAME Key used for encryption
        const sessionKey = deriveSessionKey(senderId, receiverId, groupId);

        // 3. Decrypt
        const plaintext = decryptMessage(ciphertext, iv, authTag, sessionKey);

        res.json({ plaintext });

    } catch (error: any) {
        console.error("Decryption Error:", error.message);
        res.status(500).json({ error: "Decryption failed or Auth Tag mismatch" });
    }
});