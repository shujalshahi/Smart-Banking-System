import axios from 'axios'
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

const LAPTOP_IP = '192.168.5.137'; 

const API = axios.create({
  baseURL: `http://${LAPTOP_IP}:4300` 
})


export const registerBiometrics = async (userId) => {
  try {
    // 1. Get unique cryptographic challenge options from backend
    const { data: options } = await API.post('/auth/biometric/register-options', { userId });
    if (options.error) throw new Error(options.error);

    // 2. Open the native Windows Hello / Touch ID browser prompt
    let credentialResponse;
    try {
      credentialResponse = await startRegistration({ optionsJSON: options });
    } catch (browserError) {
      console.warn('Biometric registration prompt cancelled:', browserError);
      throw new Error('Biometric registration was cancelled.');
    }

    // 3. Send the secure signature back to backend to save public keys
    const { data: verificationResult } = await API.post('/auth/biometric/verify-registration', { 
      userId, 
      credentialResponse 
    });
    
    if (verificationResult.error) throw new Error(verificationResult.error);
    return { success: true, message: 'Biometrics linked successfully!' };

  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    console.error('Biometric registration error:', errorMsg);
    return { success: false, error: errorMsg };
  }
};


export const loginWithBiometrics = async (email) => {
  try {
    if (!email) throw new Error('Please enter your email address first.');

    // 1. Fetch challenge parameters customized for this user's email
    const { data: options } = await API.post('/auth/biometric/login-options', { email });
    if (options.error) throw new Error(options.error);

    // 2. Trigger the browser's native biometric identity verification sheet
    let credentialResponse;
    try {
      credentialResponse = await startAuthentication({ optionsJSON: options });
    } catch (browserError) {
      console.warn('Biometric authentication cancelled:', browserError);
      throw new Error('Biometric verification cancelled.');
    }

    // 3. Post verification payload back to backend to sign user in
    const { data: verificationResult } = await API.post('/auth/biometric/verify-login', { 
      email, 
      credentialResponse 
    });
    
    if (verificationResult.error) throw new Error(verificationResult.error);
    return { success: true, user: verificationResult.user };

  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    console.error('Biometric login error:', errorMsg);
    return { success: false, error: errorMsg };
  }
};

export default API