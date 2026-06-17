export function isMissingColumnError(error: unknown, column?: string) {
  const message = String((error as { message?: string } | null)?.message ?? error ?? "");
  const code = String((error as { code?: string } | null)?.code ?? "");

  return (
    code === "PGRST204" ||
    message.toLowerCase().includes("schema cache") ||
    (column ? message.includes(column) : message.toLowerCase().includes("could not find"))
  );
}

export function stripProductionTrackingFields<T extends Record<string, unknown>>(payload: T) {
  const { assigned_to, current_activity, progress, last_progress_at, ...safePayload } = payload;
  void assigned_to;
  void current_activity;
  void progress;
  void last_progress_at;
  return safePayload;
}
