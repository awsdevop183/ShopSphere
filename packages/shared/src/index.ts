// Shared constants used across ShopSphere apps and docs.
export const OWASP_CATEGORIES = [
  'A01:2021 Broken Access Control',
  'A02:2021 Cryptographic Failures',
  'A03:2021 Injection',
  'A04:2021 Insecure Design',
  'A05:2021 Security Misconfiguration',
  'A06:2021 Vulnerable Components',
  'A07:2021 Identification & Auth Failures',
  'A08:2021 Software & Data Integrity Failures',
  'A09:2021 Security Logging & Monitoring Failures',
  'A10:2021 SSRF',
] as const;

export const FINDING_SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'] as const;
export type Severity = (typeof FINDING_SEVERITIES)[number];
