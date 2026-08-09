const PBKDF2_ITERATIONS = 600000
const SALT_LENGTH = 16
const IV_LENGTH = 12
const STEGANO_SALT_CONTEXT = 'cavenote-stegano-v1'

function base64Encode(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64Decode(str) {
  if (typeof str !== 'string' || str.length === 0) {
    throw new Error('Invalid encrypted data')
  }
  let binary
  try {
    binary = atob(str)
  } catch {
    throw new Error('Invalid encrypted data')
  }
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function deriveKey(password, salt) {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encrypt(plaintext, password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(password, salt)
  const encoder = new TextEncoder()
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  )
  return {
    ciphertext: base64Encode(encrypted),
    iv: base64Encode(iv),
    salt: base64Encode(salt),
  }
}

export async function decrypt(ciphertext, iv, salt, password) {
  const key = await deriveKey(password, base64Decode(salt))
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64Decode(iv) },
    key,
    base64Decode(ciphertext)
  )
  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

async function deriveSteganoKey(password) {
  const encoder = new TextEncoder()
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(STEGANO_SALT_CONTEXT + password))
  const salt = new Uint8Array(hash, 0, SALT_LENGTH)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptStegano(plaintext, password) {
  if (!password || !password.trim()) {
    throw new Error('A password is required to hide a note.')
  }
  const key = await deriveSteganoKey(password)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  )
  const combined = new Uint8Array(IV_LENGTH + encrypted.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encrypted), IV_LENGTH)
  return base64Encode(combined)
}

export async function decryptStegano(ciphertext, password) {
  const combined = base64Decode(ciphertext)
  if (combined.length <= IV_LENGTH) {
    throw new Error('Invalid stegano ciphertext')
  }
  const key = await deriveSteganoKey(password)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: combined.slice(0, IV_LENGTH) },
    key,
    combined.slice(IV_LENGTH)
  )
  return new TextDecoder().decode(decrypted)
}
