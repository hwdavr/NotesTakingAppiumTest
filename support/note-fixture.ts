import { randomUUID } from 'node:crypto';

export function createNoteFixture(env: NodeJS.ProcessEnv = process.env): { title: string } {
  const base = env.QA_NOTE_TITLE ?? 'QA 4x4 table';
  if (
    !base.trim() ||
    [...base].length > 100 ||
    /[\p{Cc}\p{Cf}]/u.test(base) ||
    /\$\{[^}]*\}/u.test(base)
  ) {
    throw new Error(
      'QA_NOTE_TITLE must be 1–100 characters with no controls or unresolved ${VARIABLE} expressions.',
    );
  }
  return { title: `${base} [appium:${randomUUID()}]` };
}
