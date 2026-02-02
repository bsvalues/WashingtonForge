// lib/pilot/pii.ts
// Spec: never log raw PII in TerraTrace

const SSN = /\b\d{3}-\d{2}-\d{4}\b/g;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

export function sanitizeText(input: string): string {
  return input
    .replace(SSN, "[REDACTED_SSN]")
    .replace(EMAIL, "[REDACTED_EMAIL]")
    .replace(PHONE, "[REDACTED_PHONE]");
}
