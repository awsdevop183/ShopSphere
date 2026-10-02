import type { Router, Request, Response } from 'express';

// A lab bundles realistic business context, an intentionally vulnerable
// reference handler, a secure reference handler, and instructor-only metadata.
// The framework selects vulnerable vs. secure at request time based on the
// lab instance's secureMode flag (toggled from the instructor console).
export interface LabDefinition {
  id: string;
  title: string;
  category: string;        // OWASP-aligned category
  difficulty: 'intro' | 'easy' | 'medium' | 'hard';
  summary: string;         // student-safe business description (no hints)
  affectedEndpoint: string;
  // Instructor-only fields (never exposed on student/storefront surfaces):
  rootCause: string;
  impact: string;
  remediation: string;
  reproduction: string;
  instructorNotes: string;
  // Registers this lab's routes onto the lab sub-router. Handlers read
  // req.labSecure to branch between vulnerable and secure implementations.
  mount: (router: Router) => void;
  // Optional idempotent reset of the lab's synthetic fixtures.
  reset?: () => Promise<void>;
}

export type LabHandler = (req: Request, res: Response) => unknown;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      labSecure?: boolean;
      labId?: string;
    }
  }
}
