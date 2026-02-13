QSC-Chat-App: Quantum-Secure Messenger 🔐
A cutting-edge, quantum-resistant communication platform built with React Native, designed to protect data against the threat of future quantum computer attacks.
🚀 Key Features
Post-Quantum Cryptography (PQC): Implements Kyber for secure key exchange and Dilithium for digital signatures.

Quantum Random Number Generation (QRNG): Uses true quantum entropy for initial key generation to ensure maximum unpredictability.

Dynamic Key Rotation: Features AES-256-GCM encryption with keys that rotate per message for perfect forward secrecy.

Zero-Knowledge Architecture: The backend (Node.js/Supabase) only stores encrypted ciphertext; even the server cannot read your messages.



🛠️ Technical Stack
Frontend: React Native (TypeScript)

Backend: Node.js

Database: Supabase / Firebase

Encryption Logic: CRYSTALS-Kyber, Dilithium, and AES-256-GCM

📦 Installation & Setup
Clone the repository:

Bash
git clone https://github.com/vk566/QSC-Chat-App.git
cd QSC-Chat-App
Install dependencies:

Bash
npm install
Run the application:

Bash
npm run android
📱 Download APK
You can find the latest stable build (FinalApp.apk) in the Releases section.
