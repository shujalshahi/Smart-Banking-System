const express = require('express');
const router = express.Router();
const User = require('../models/user'); 
const { 
  generateRegistrationOptions, 
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse 
} = require('@simplewebauthn/server');

// Configuration rules for the biometric handshake
const rpName = 'MERN Banking System';
const rpID = 'localhost'; 
const origin = 'http://localhost:5173'; 

// ==========================================
// REGISTER A DEVICE (Link Face ID / Touch ID)
// ==========================================

router.post('/register-options', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new Uint8Array(Buffer.from(user._id.toString())),
      userName: user.email,
      userDisplayName: user.name,
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform', 
        userVerification: 'required',
        residentKey: 'required',
      },
    });

    user.currentChallenge = options.challenge;
    await user.save();

    res.json(options);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate registration options' });
  }
});

router.post('/verify-registration', async (req, res) => {
  try {
    const { userId, credentialResponse } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const expectedChallenge = user.currentChallenge;

    const verification = await verifyRegistrationResponse({
      response: credentialResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const regInfo = verification.registrationInfo;
      
      const credentialID = regInfo.credential?.id || regInfo.credentialID || credentialResponse.id;
      const credentialPublicKey = regInfo.credential?.publicKey || regInfo.credentialPublicKey;
      const finalCounter = typeof regInfo.counter !== 'undefined' ? regInfo.counter : (regInfo.credential?.counter || 0);

      if (!credentialID || !credentialPublicKey) {
        return res.status(400).json({ 
          error: 'Registration components were missing from the device response.' 
        });
      }

      const base64PublicKey = Buffer.from(credentialPublicKey).toString('base64');
      
      const base64CredentialID = typeof credentialID === 'string' 
        ? Buffer.from(credentialID, 'base64url').toString('base64')
        : Buffer.from(credentialID).toString('base64');

      user.passkeys.push({
        credentialID: base64CredentialID,
        publicVerifyingKey: base64PublicKey,
        counter: finalCounter,
        transports: credentialResponse.response.transports || ['internal']
      });

      user.currentChallenge = null;
      await user.save();

      // 🛠️ UPDATE: Return success and the flag so frontend UI shifts instantly
      return res.json({ 
        success: true,
        hasBiometrics: true 
      });
    }

    res.status(400).json({ error: 'Registration verification failed' });
  } catch (error) {
    console.error("Registration error encountered:", error);
    res.status(500).json({ error: 'Internal validation server error' });
  }
});

// ==========================================
// LOGIN WITH A DEVICE (Face ID / Touch ID)
// ==========================================

router.post('/login-options', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.passkeys || user.passkeys.length === 0) {
      return res.status(400).json({ error: 'Biometric login is not enabled on this account' });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.passkeys.map(key => ({
        id: Buffer.from(key.credentialID, 'base64').toString('base64url'),
        type: 'public-key',
        transports: key.transports,
      })),
      userVerification: 'required',
    });

    user.currentChallenge = options.challenge;
    await user.save();

    res.json(options);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate login options' });
  }
});

router.post('/verify-login', async (req, res) => {
  try {
    const { email, credentialResponse } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const base64ResponseId = Buffer.from(credentialResponse.id, 'base64url').toString('base64');
    const dbKey = user.passkeys.find(k => k.credentialID === base64ResponseId);

    if (!dbKey) return res.status(400).json({ error: 'Device signature mismatch' });

    const publicKeyBuffer = new Uint8Array(Buffer.from(dbKey.publicVerifyingKey, 'base64'));

    const verification = await verifyAuthenticationResponse({
      response: credentialResponse,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: Buffer.from(dbKey.credentialID, 'base64').toString('base64url'), 
        counter: dbKey.counter,
        transports: dbKey.transports,
        publicKey: publicKeyBuffer,
        credentialPublicKey: publicKeyBuffer,
      },
    });

    if (verification.verified) {
      const authInfo = verification.authenticationInfo;
      if (authInfo) {
        dbKey.counter = typeof authInfo.newCounter !== 'undefined' ? authInfo.newCounter : (authInfo.counter || 0);
      }

      user.currentChallenge = null;
      await user.save();

      return res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
          balance: user.balance,
          // 🛠️ UPDATE: Pass the flag during active session log ins
          hasBiometrics: true
        }
      });
    }

    res.status(400).json({ error: 'Authentication engine failed verification' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal signature lookup process error' });
  }
});

// ==========================================
// UNLINK BIOMETRIC DEVICES
// ==========================================
router.post('/unlink-device', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Wipe out registered keys
    user.passkeys = [];
    user.currentChallenge = null;
    await user.save();

    res.json({ 
      success: true, 
      hasBiometrics: false,
      message: 'Biometric device unlinked successfully.' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to safely remove hardware keys' });
  }
});

module.exports = router;