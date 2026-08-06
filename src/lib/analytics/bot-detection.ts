// Search engines, AI crawlers, and social-card unfurlers almost always
// self-identify with "bot"/"spider"/"crawl" somewhere in their UA string —
// that one check catches the vast majority. The explicit list below is only
// for the notable exceptions that don't (curl, headless browsers, HTTP
// client libraries, link-preview bots).
const GENERIC_BOT_PATTERN = /bot|spider|crawl|slurp/i;

const NAMED_NON_MATCHING_AGENTS = [
  /facebookexternalhit/i,
  /whatsapp/i,
  /telegrambot/i,
  /discordbot/i,
  /skypeuripreview/i,
  /headlesschrome/i,
  /phantomjs/i,
  /playwright/i,
  /puppeteer/i,
  /selenium/i,
  /lighthouse/i,
  /pingdom/i,
  /uptimerobot/i,
  /python-requests/i,
  /curl\//i,
  /wget\//i,
  /okhttp/i,
  /go-http-client/i,
  /axios\//i,
  /node-fetch/i,
  /postmanruntime/i,
];

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.trim() === "") return true;
  return GENERIC_BOT_PATTERN.test(userAgent) || NAMED_NON_MATCHING_AGENTS.some((p) => p.test(userAgent));
}
