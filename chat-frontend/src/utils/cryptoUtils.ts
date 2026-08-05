export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export interface E2EEKeyPair {
  publicKey: string;  // SPKI format base64
  privateKey: string; // JWK format string
}

/**
 * Generates an RSA-OAEP 2048 keypair.
 */
export async function generateE2EEKeys(): Promise<E2EEKeyPair> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );

  const spkiBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const jwkPrivateKey = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

  return {
    publicKey: arrayBufferToBase64(spkiBuffer),
    privateKey: JSON.stringify(jwkPrivateKey)
  };
}

/**
 * Encrypts a message using hybrid AES-GCM and RSA-OAEP envelope encryption.
 */
export async function encryptMessageForUsers(
  plainText: string,
  selfPublicKeyB64: string,
  recipientPublicKeyB64: string,
  selfId: number,
  recipientId: number
): Promise<{ ciphertext: string; iv: string; encryptedKeys: string }> {
  // 1. Generate one-time symmetric AES key
  const aesKey = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );

  // 2. Encrypt plaintext with AES
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encodedContent = encoder.encode(plainText);
  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    aesKey,
    encodedContent
  );

  const ciphertextB64 = arrayBufferToBase64(cipherBuffer);
  const ivB64 = arrayBufferToBase64(iv);

  // 3. Export raw AES key
  const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);

  // 4. Import RSA public keys
  const importPub = async (b64: string) => {
    return window.crypto.subtle.importKey(
      'spki',
      base64ToArrayBuffer(b64),
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['encrypt']
    );
  };

  const selfPubKey = await importPub(selfPublicKeyB64);
  const recipientPubKey = await importPub(recipientPublicKeyB64);

  // 5. Encrypt AES key for self
  const encKeySelfBuffer = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    selfPubKey,
    rawAesKey
  );
  const encKeySelfB64 = arrayBufferToBase64(encKeySelfBuffer);

  // 6. Encrypt AES key for recipient
  const encKeyRecipientBuffer = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    recipientPubKey,
    rawAesKey
  );
  const encKeyRecipientB64 = arrayBufferToBase64(encKeyRecipientBuffer);

  // 7. Structure the encrypted keys dictionary
  const keysDict: Record<string, string> = {
    [String(selfId)]: encKeySelfB64,
    [String(recipientId)]: encKeyRecipientB64
  };

  return {
    ciphertext: ciphertextB64,
    iv: ivB64,
    encryptedKeys: JSON.stringify(keysDict)
  };
}

/**
 * Decrypts envelope encrypted message using recipient's private key.
 */
export async function decryptMessage(
  ciphertext: string,
  iv: string,
  encryptedKeyForSelfB64: string,
  privateKeyJson: string
): Promise<string> {
  // 1. Import RSA private key
  const jwkObj = JSON.parse(privateKeyJson);
  const privateKey = await window.crypto.subtle.importKey(
    'jwk',
    jwkObj,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt']
  );

  // 2. Decrypt AES key using private key
  const encKeyBuffer = base64ToArrayBuffer(encryptedKeyForSelfB64);
  const rawAesKey = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    encKeyBuffer
  );

  // 3. Import AES key
  const aesKey = await window.crypto.subtle.importKey(
    'raw',
    rawAesKey,
    { name: 'AES-GCM' },
    true,
    ['decrypt']
  );

  // 4. Decrypt content using AES
  const cipherBuffer = base64ToArrayBuffer(ciphertext);
  const ivBuffer = base64ToArrayBuffer(iv);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    aesKey,
    cipherBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
