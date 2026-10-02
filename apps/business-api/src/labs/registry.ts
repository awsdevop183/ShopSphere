import type { LabDefinition } from './types.js';
import { sqliSearch, sqliLogin } from './modules/injection.js';
import { xssReflected, xssStored } from './modules/xss.js';
import { idorOrders, bolaProfiles, massAssignment, functionLevel } from './modules/access-control.js';
import { jwtWeak } from './modules/auth-tokens.js';
import { openRedirect, ssrfFetch, pathTraversal } from './modules/web-security.js';
import { negativeQty, couponReuse } from './modules/business-logic.js';
import { verboseErrors } from './modules/info-disclosure.js';

// The implemented, tested lab catalog. Each entry ships a vulnerable AND a
// secure reference implementation plus instructor-only metadata.
export const labRegistry: LabDefinition[] = [
  sqliSearch,
  sqliLogin,
  xssReflected,
  xssStored,
  idorOrders,
  bolaProfiles,
  massAssignment,
  functionLevel,
  jwtWeak,
  openRedirect,
  ssrfFetch,
  pathTraversal,
  negativeQty,
  couponReuse,
  verboseErrors,
];
