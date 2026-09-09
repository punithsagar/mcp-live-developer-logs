const SECRET_PATTERNS: RegExp[] = [
  /(["']?password["']?\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,}]+)/gi,
  /(["']?api[_-]?key["']?\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,}]+)/gi,
  /(authorization\s*:\s*bearer\s+)[^\s]+/gi,
  /(bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi,
  /(["']?token["']?\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,}]+)/gi,
  /(["']?secret["']?\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,}]+)/gi,
];

const JWT_PATTERN =
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;

export function sanitizeLogMessage(message: string): string {
  let sanitized = message;

  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(
      pattern,
      "$1[REDACTED]"
    );
  }

  sanitized = sanitized.replace(
    JWT_PATTERN,
    "[REDACTED_JWT]"
  );

  return sanitized;
}