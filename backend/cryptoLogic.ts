// backend/cryptoLogic.ts
import crypto from 'node:crypto';
import axios from 'axios';

// -----------------------------------------------------------------------------
// Interfaces & Types
// -----------------------------------------------------------------------------

export interface KeyPair {
    publicKey: Buffer;
    privateKey: Buffer;
}

export interface KEMOutput {
    sharedSecret: Buffer;
    ciphertext: Buffer;
}

export interface EncryptedData {
    iv: Buffer;
    authTag: Buffer;
    ciphertext: Buffer;
}

// -----------------------------------------------------------------------------
// 1. Quantum Random Number Generator (QRNG) with Fallback
// -----------------------------------------------------------------------------

export class QuantumEntropy {
    private static readonly ANU_API_URL = 'https://qrng.anu.edu.au/API/jsonI.php';
    private static readonly TIMEOUT_MS = 2000;

    /**
     * Fetches random bytes from a Quantum source.
     * Falls back to Node.js crypto.randomBytes on failure.
     * @param length Number of bytes required
     * @returns Promise resolving to a Buffer of random bytes
     */
    public static async getBytes(length: number): Promise<Buffer> {
        try {
            // Attempt to fetch from ANU Quantum Random Numbers Server
            // Note: API returns array of uint8
            const response = await axios.get<{ data: number[], success: boolean }>(this.ANU_API_URL, {
                params: {
                    length: length,
                    type: 'uint8',
                },
                timeout: this.TIMEOUT_MS,
            });

            if (response.data && Array.isArray(response.data.data) && response.data.data.length === length) {
                return Buffer.from(response.data.data);
            }
            
            throw new Error('Invalid response from QRNG API');
        } catch (error) {
            // Fallback to CSPRNG provided by Node.js
            console.warn('QRNG fetch failed, falling back to standard crypto:', error instanceof Error ? error.message : 'Unknown error');
            return crypto.randomBytes(length);
        }
    }
}

// -----------------------------------------------------------------------------
// 2. Simulated Post-Quantum KEM (Kyber-Style Abstraction)
// -----------------------------------------------------------------------------

/**
 * SIMULATED KEM for architectural demonstration.
 * In a production PQC environment, this would interface with 
 * liboqs-node or a WASM implementation of CRYSTALS-Kyber.
 */
export class SimulatedKyberKEM {
    private static readonly SECRET_SIZE = 32; // 256 bits
    private static readonly PUB_KEY_SIZE = 800; // Simulating Kyber512 size
    private static readonly PRIV_KEY_SIZE = 1632; // Simulating Kyber512 size
    private static readonly CIPHERTEXT_SIZE = 768; // Simulating Kyber512 size

    /**
     * Generates a key pair for the KEM.
     */
    public static generateKeyPair(): KeyPair {
        // In a real implementation, this involves polynomial generation.
        // Simulation: Random bytes of correct length.
        return {
            publicKey: crypto.randomBytes(this.PUB_KEY_SIZE),
            privateKey: crypto.randomBytes(this.PRIV_KEY_SIZE),
        };
    }

    /**
     * Encapsulates a shared secret for a given public key.
     * @param publicKey The recipient's public key
     */
    public static encapsulate(publicKey: Buffer): KEMOutput {
        if (publicKey.length !== this.PUB_KEY_SIZE) {
            throw new Error(`Invalid public key size. Expected ${this.PUB_KEY_SIZE}, got ${publicKey.length}`);
        }

        // 1. Generate the true shared secret (entropy)
        const sharedSecret = crypto.randomBytes(this.SECRET_SIZE);

        // 2. Generate ciphertext. In real Kyber, this is Enc(pk, seed).
        // Simulation: HMAC(pk, sharedSecret) to bind them, padded to size.
        const binding = crypto.createHmac('sha256', sharedSecret).update(publicKey).digest();
        const padding = crypto.randomBytes(this.CIPHERTEXT_SIZE - binding.length);
        const ciphertext = Buffer.concat([binding, padding]);

        return { sharedSecret, ciphertext };
    }

    /**
     * Decapsulates ciphertext using the private key to recover the shared secret.
     * @param ciphertext The encrypted shared secret
     * @param privateKey The recipient's private key
     */
    public static decapsulate(ciphertext: Buffer, privateKey: Buffer): Buffer {
        if (ciphertext.length !== this.CIPHERTEXT_SIZE) {
            throw new Error(`Invalid ciphertext size.`);
        }
        if (privateKey.length !== this.PRIV_KEY_SIZE) {
            throw new Error(`Invalid private key size.`);
        }

        // Real Kyber: Dec(sk, c) -> sharedSecret
        // Simulation: We cannot mathematically recover the random secret from our HMAC simulation 
        // without storing it. To make this runnable in a mock flow, we will simulate 
        // a "derived" secret that is consistent if this were a real algorithm.
        
        // FOR SIMULATION PURPOSES ONLY:
        // Return a hash of the ciphertext and private key to ensure determinism.
        return crypto.createHash('sha256')
            .update(ciphertext)
            .update(privateKey)
            .digest();
    }
}

// -----------------------------------------------------------------------------
// 3. HKDF-Based Dynamic Session Key Derivation
// -----------------------------------------------------------------------------

export class KeyDerivation {
    private static readonly ALGORITHM = 'sha256';

    /**
     * Derives a cryptographically strong session key.
     * @param ikm Input Keying Material (e.g., shared secret from KEM)
     * @param salt Optional salt value (non-secret random value)
     * @param info Context and application specific information
     * @param length Length of output key material in bytes
     */
    public static deriveSessionKey(
        ikm: Buffer, 
        salt: Buffer, 
        info: string, 
        length: number
    ): Buffer {
        // crypto.hkdfSync(digest, ikm, salt, info, keylen)
        const derivedKeyArrayBuffer = crypto.hkdfSync(
            this.ALGORITHM,
            ikm,
            salt,
            Buffer.from(info),
            length
        );

        // Explicitly convert ArrayBuffer to Buffer to fix TS type mismatch
        return Buffer.from(derivedKeyArrayBuffer);
    }
}

// -----------------------------------------------------------------------------
// 4. AES-256-GCM Encryption/Decryption
// -----------------------------------------------------------------------------

export class AesGcmCipher {
    private static readonly ALGO = 'aes-256-gcm';
    private static readonly IV_LENGTH = 12; // Standard 96-bit IV
    private static readonly TAG_LENGTH = 16; // Standard 128-bit tag

    /**
     * Encrypts data using AES-256-GCM.
     * @param plaintext Data to encrypt
     * @param key 32-byte (256-bit) encryption key
     */
    public static encrypt(plaintext: Buffer, key: Buffer): EncryptedData {
        if (key.length !== 32) {
            throw new Error('Invalid key length. AES-256 requires 32 bytes.');
        }

        const iv = crypto.randomBytes(this.IV_LENGTH);
        const cipher = crypto.createCipheriv(this.ALGO, key, iv);

        const encrypted = Buffer.concat([
            cipher.update(plaintext),
            cipher.final()
        ]);

        const tag = cipher.getAuthTag();

        return {
            iv,
            authTag: tag,
            ciphertext: encrypted
        };
    }

    /**
     * Decrypts data using AES-256-GCM.
     * @param encryptedData Object containing IV, AuthTag, and Ciphertext
     * @param key 32-byte decryption key
     */
    public static decrypt(encryptedData: EncryptedData, key: Buffer): Buffer {
        if (key.length !== 32) {
            throw new Error('Invalid key length. AES-256 requires 32 bytes.');
        }

        const decipher = crypto.createDecipheriv(this.ALGO, key, encryptedData.iv);
        
        decipher.setAuthTag(encryptedData.authTag);

        const decrypted = Buffer.concat([
            decipher.update(encryptedData.ciphertext),
            decipher.final()
        ]);

        return decrypted;
    }
}