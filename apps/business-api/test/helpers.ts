import { prisma } from '../src/db.js';

export async function setLabMode(labId: string, secure: boolean) {
  await prisma.labInstance.upsert({
    where: { id: `${labId}-default` },
    create: { id: `${labId}-default`, labId, secureMode: secure },
    update: { secureMode: secure },
  });
}
