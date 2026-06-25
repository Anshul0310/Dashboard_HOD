/**
 * Power BI Embed Configuration
 *
 * This module provides the embed URLs needed to display the Power BI report
 * via an iframe. It uses the direct Power BI embed URL with autoAuth, which
 * works when the user is signed into Power BI in their browser.
 *
 * ─── TO USE "PUBLISH TO WEB" (fully public, no sign-in needed) ─────────
 *
 * 1. Open the report in Power BI Service (app.powerbi.com)
 * 2. Go to File → Embed report → Publish to web (public)
 * 3. Copy the embed URL (starts with https://app.powerbi.com/view?r=...)
 * 4. Replace POWERBI_PUBLISH_TO_WEB_URL below with that URL
 *
 * ─── CURRENT SETUP ──────────────────────────────────────────────────────
 *
 * Uses the report embed URL with autoAuth=true. This requires the user
 * viewing the dashboard to be signed into Power BI in their browser.
 */

// ─── Configuration ───────────────────────────────────────────────────────

/** Your Power BI Report ID */
export const POWERBI_REPORT_ID = '8837b572-fd31-4565-8828-4af17c3b0f20';

/**
 * If you have a "Publish to Web" URL, paste it here and set
 * USE_PUBLISH_TO_WEB = true. This makes the embed fully public
 * without needing any Power BI sign-in.
 *
 * Example: 'https://app.powerbi.com/view?r=eyJrIjoiYTEyMz...'
 */
export const POWERBI_PUBLISH_TO_WEB_URL = '';
export const USE_PUBLISH_TO_WEB = false;

/**
 * Direct embed URL — works when the viewer is signed into Power BI.
 * The autoAuth=true parameter auto-authenticates using the browser session.
 */
export const POWERBI_EMBED_URL =
  `https://app.powerbi.com/reportEmbed?reportId=${POWERBI_REPORT_ID}&autoAuth=true`;

// ─── Public API ──────────────────────────────────────────────────────────

export interface PowerBIEmbedInfo {
  reportId: string;
  embedUrl: string;
  mode: 'publish_to_web' | 'auto_auth';
}

/**
 * Returns the Power BI embed info for the KPI report.
 *
 * - If a "Publish to Web" URL is configured, uses that (fully public).
 * - Otherwise, uses the autoAuth embed URL (requires Power BI sign-in).
 */
export function getEmbedInfo(): PowerBIEmbedInfo {
  if (USE_PUBLISH_TO_WEB && POWERBI_PUBLISH_TO_WEB_URL) {
    return {
      reportId: POWERBI_REPORT_ID,
      embedUrl: POWERBI_PUBLISH_TO_WEB_URL,
      mode: 'publish_to_web',
    };
  }

  return {
    reportId: POWERBI_REPORT_ID,
    embedUrl: POWERBI_EMBED_URL,
    mode: 'auto_auth',
  };
}

/**
 * @deprecated Use getEmbedInfo() instead. Kept for backward compatibility.
 * Returns null to trigger the old placeholder state — but the new
 * KpiReportEmbed component no longer calls this function.
 */
export async function getEmbedConfig(): Promise<null> {
  return null;
}
