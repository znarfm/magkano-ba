import { PercentileStats, CareerRecord } from './types';
import { ArbitrageComparison } from './economics';

export interface AuditProfile {
  role: string;
  yoe: number;
  monthlyOfferPhp: number;
  workScope: string;
  school: string;
  macroIndustry: string;
}

export interface GroundedPromptPayload {
  systemPrompt: string;
  userPrompt: string;
}

/**
 * Builds deterministic, dataset-grounded prompt payload for the BYOK Gemini auditor.
 */
export function buildGroundedAuditPrompt(
  profile: AuditProfile,
  percentiles: PercentileStats,
  arbitrage: ArbitrageComparison,
  matchedQuotes: CareerRecord[]
): GroundedPromptPayload {
  const systemPrompt = `You are a pragmatic, analytical Filipino career advisor and compensation auditor.
You must strictly base your evaluation and advice ONLY on the provided dataset percentiles, tax breakdown, and verified peer quotes below.
NEVER fabricate or hallucinate salary numbers, tax rates, or market averages.
If the offered compensation is below P25, clearly warn the user of an under-market offer.
If between P25 and P75, evaluate it as competitive market rate.
If above P75, confirm it is top-quartile.
Format your response with clear headings:
1. Executive Offer Benchmark & Quartile Assessment
2. Net Take-Home & Benefits Parity (TRAIN vs. 8% Freelance)
3. Direct Peer Wisdom & Relevant Career Notes
4. Actionable Negotiation Recommendations`;

  const quotesText = matchedQuotes
    .slice(0, 5)
    .map(
      (q, idx) =>
        `[Peer Quote ${idx + 1}] Role: ${q.rawTitle} (${q.yoeYears} YOE) | School: ${q.schoolCanonical ?? 'N/A'}\n"${q.mentorAdviceQuote}"`
    )
    .join('\n\n');

  const userPrompt = `Evaluate this job offer/profile using ONLY these verified Filipino dataset benchmarks:

USER PROFILE:
- Target Role: ${profile.role}
- Experience: ${profile.yoe} YOE
- Offered / Current Monthly Gross: ₱${profile.monthlyOfferPhp.toLocaleString()}
- Work Scope: ${profile.workScope}
- School: ${profile.school || 'Not specified'}
- Macro Industry: ${profile.macroIndustry}

VERIFIED COHORT BENCHMARKS (2026 CPI-Adjusted):
- P25 (Entry Floor): ₱${percentiles.p25.toLocaleString()}/mo
- Median (P50 Benchmark): ₱${percentiles.p50.toLocaleString()}/mo
- P75 (Top Quartile): ₱${percentiles.p75.toLocaleString()}/mo
- Sample Size: ${percentiles.count} reported submissions

TAX & TAKE-HOME PARITY COMPUTATION:
- PH Local Monthly Net (TRAIN + Statutory + 13th Month): ₱${arbitrage.localMonthlyNetEquivalent.toLocaleString()}/mo
- Foreign Remote Break-Even Gross Rate: ₱${arbitrage.remoteBreakEvenMonthlyGross.toLocaleString()}/mo
- Foreign Remote Net Equivalent (8% Flat Tax): ₱${arbitrage.remoteMonthlyNetEquivalent.toLocaleString()}/mo
- Annual Local Statutory & Benefits Value: ₱${arbitrage.benefitsAnnualLocal.toLocaleString()}

MATCHED PEER QUOTES & MENTOR ADVICE:
${quotesText || 'No direct text quotes available for this specific slice.'}

Please generate an objective, grounded audit for this user.`;

  return { systemPrompt, userPrompt };
}

/**
 * Executes direct client-side request to Google Gemini API using BYOK key.
 */
export async function callGeminiAudit(
  apiKey: string,
  payload: GroundedPromptPayload
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: payload.systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: payload.userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.error?.message || `Gemini API request failed with status ${res.status}`
    );
  }

  const data = await res.json();
  const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidateText) {
    throw new Error('Gemini API returned an empty response.');
  }

  return candidateText;
}
