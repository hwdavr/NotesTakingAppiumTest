export async function withCleanup(
  action: () => Promise<void>,
  cleanup: () => Promise<void>,
): Promise<void> {
  let failure: { error: unknown } | undefined;
  try {
    await action();
  } catch (error) {
    failure = { error };
  }
  try {
    await cleanup();
  } catch (error) {
    if (!failure) throw error;
    console.error('UI cleanup also failed; the original test failure is retained.');
  }
  if (failure) throw failure.error;
}
