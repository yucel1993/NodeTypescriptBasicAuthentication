require("dotenv").config();
const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  // Combine IV and encrypted data
  const encryptedCombined = iv.toString("hex") + encrypted;
  return encryptedCombined;
}

function decrypt(encryptedCombined) {
  const iv = Buffer.from(encryptedCombined.slice(0, 32), "hex"); // First 32 characters are IV
  const encryptedData = Buffer.from(encryptedCombined.slice(32), "hex"); // Rest is the encrypted data
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Example usage
const encrypted = encrypt("testpassword");
console.log(encrypted); // Combined IV and encrypted data

const decrypted = decrypt(encrypted);
console.log(decrypted); // 'testpassword'
