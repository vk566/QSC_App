// backend/routes.ts
import { Router, Request, Response } from 'express';
import { 
    QuantumEntropy, 
    SimulatedKyberKEM, 
    KeyDerivation, 
    AesGcmCipher 
} from './cryptoLogic';

export const router = Router();

// Define input type for the request body
interface SendMessageRequest {
    message: string;
}

// Define output structure
interface EncryptedResponse {
    status: string;
    encryptionDetails: {
        iv: string;
        authTag: string;
        ciphertext: string;
        kemCiphertext: string;
    };
    diagnosticInfo: string;
}

router.post('/send', async (req: Request<{}, {}, SendMessageRequest>, res: Response<EncryptedResponse | { error: string }>) => {
    try {
        const { message } = req.body;

        if (!message) {
             res.status(400).json({ error: 'Message field is required' });
             return;
        }

        // 1. Fetch Quantum Entropy (QRNG)
        const entropy = await QuantumEntropy.getBytes(32);

        // 2. Simulate Key Exchange (Alice generates keys, Server encapsulates)
        // In a real flow, Alice (client) would send her public key. 
        // Here we generate ephemeral keys to simulate the process self-contained.
        const aliceKeys = SimulatedKyberKEM.generateKeyPair();
        const kemOutput = SimulatedKyberKEM.encapsulate(aliceKeys.publicKey);

        // 3. Derive Session Key using HKDF
        // We use the entropy from QRNG as the salt for extra security
        const sessionKey = KeyDerivation.deriveSessionKey(
            kemOutput.sharedSecret,
            entropy,
            'api-secure-session',
            32 // AES-256 requires 32 bytes
        );

        // 4. Encrypt the user's message
        const messageBuffer = Buffer.from(message, 'utf-8');
        const encryptedData = AesGcmCipher.encrypt(messageBuffer, sessionKey);

        // 5. Construct Response
        const responseData: EncryptedResponse = {
            status: 'Message encrypted securely with Post-Quantum Simulation',
            encryptionDetails: {
                iv: encryptedData.iv.toString('hex'),
                authTag: encryptedData.authTag.toString('hex'),
                ciphertext: encryptedData.ciphertext.toString('hex'),
                kemCiphertext: kemOutput.ciphertext.toString('hex')
            },
            diagnosticInfo: `Used ${entropy.length} bytes of Quantum Entropy`
        };

        res.json(responseData);

    } catch (error) {
        console.error('Encryption API Error:', error);
        res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Internal Server Error' 
        });
    }
});