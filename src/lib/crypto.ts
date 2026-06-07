import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

const getEncryptionKey = (): Buffer => {
  // Derive a 32-byte key from the environment key or fallback
  const secret = process.env.ENCRYPTION_KEY || 'synapse-task-ai-default-fallback-key-32-chars'
  return crypto.scryptSync(secret, 'synapse-salt', 32)
}

/**
 * Encrypts clear text using AES-256-GCM.
 * Returns a colon-separated string in the format iv:ciphertext:tag
 */
export function encrypt(text: string): string {
  if (!text) return ''
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = getEncryptionKey()
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const tag = cipher.getAuthTag().toString('hex')
  
  return `${iv.toString('hex')}:${encrypted}:${tag}`
}

/**
 * Decrypts a colon-separated ciphertext string (iv:ciphertext:tag).
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''
  
  const parts = encryptedText.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format')
  }
  
  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]
  const tag = Buffer.from(parts[2], 'hex')
  
  const key = getEncryptionKey()
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
