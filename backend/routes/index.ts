import { Router } from "express";
import {
  pqcKeyEncapsulation,
  deriveSessionKey,
  encryptMessage
} from "../cryptoLogic";

const router = Router();

router.post("/send", async (req, res) => {
  const { message } = req.body;
  const { sessionId, sharedSecret } = await pqcKeyEncapsulation();
  const key = deriveSessionKey(sharedSecret);
  const encrypted = encryptMessage(message, key);

  res.json({
    sessionId,
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
    sharedSecret: sharedSecret.toString("base64")
  });
});

export default router;
