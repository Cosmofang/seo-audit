type Environment = 'staging' | 'production';

const PRIVATE_RULES = `Disallow: /admin/
Disallow: /api/`;

export function renderRobots(environment: Environment, origin: string): string {
  if (environment !== 'production') {
    return `User-agent: *
Disallow: /
`;
  }

  return `User-agent: *
Allow: /
${PRIVATE_RULES}

# AI search/indexing policy
User-agent: OAI-SearchBot
Allow: /
${PRIVATE_RULES}

User-agent: Claude-SearchBot
Allow: /
${PRIVATE_RULES}

User-agent: PerplexityBot
Allow: /
${PRIVATE_RULES}

# Training policy is an independent legal/business decision.
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

Sitemap: ${origin}/sitemap.xml
`;
}
