const entries: string[] = [];
const MAX_ENTRIES = 120;

export function recordRenderDiagnostic(label: string, data: Record<string, unknown>) {
  entries.push(`${new Date().toISOString()} ${label} ${JSON.stringify(data)}`);
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
}

export async function copyRenderDiagnostics() {
  const text = entries.length ? entries.join('\n') : 'No hay muestras de render todavía.';
  await navigator.clipboard.writeText(text);
}
