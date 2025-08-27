import { existsSync, readFileSync } from 'fs';

/**
 * Apply file-based secrets from environment using the KEY_FILE convention.
 * If an env var named FOO_FILE is present and points to a readable file,
 * this function will set process.env.FOO to the trimmed file contents
 * unless process.env.FOO is already set. This is safe for Docker/K8s secrets.
 */
export function applyFileBasedSecrets() {
  const entries = Object.entries(process.env);
  for (const [key, value] of entries) {
    if (!key.endsWith('_FILE')) continue;
    if (!value) continue;

    try {
      const target = key.slice(0, -5); // drop _FILE
      // Do not override explicit env value
      if (process.env[target]) continue;

      if (existsSync(value)) {
        const fileContent = readFileSync(value, 'utf8');
        // Trim only trailing newline to preserve secrets exactly
        process.env[target] = fileContent.replace(/\r?\n$/, '');
      }
    } catch (err) {
      // Avoid throwing during bootstrap; surface minimal info for ops
       
      console.warn(`[secrets] Failed to read ${key}: ${(err as Error).message}`);
    }
  }
}
