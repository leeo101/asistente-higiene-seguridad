import aiAdvisor from './_ai-advisor.js';
import aiAtsGenerator from './_ai-ats-generator.js';
import aiLegalSummary from './_ai-legal-summary.js';
import aiReportConclusion from './_ai-report-conclusion.js';
import analyzeExtinguisher from './_analyze-extinguisher.js';
import analyzeGeneralRisks from './_analyze-general-risks.js';
import analyzeImage from './_analyze-image.js';
import dailyInsight from './_daily-insight.js';

export default async function handler(req, res) {
  const url = req.url || '';
  if (url.includes('ai-ats-generator')) return aiAtsGenerator(req, res);
  if (url.includes('ai-legal-summary')) return aiLegalSummary(req, res);
  if (url.includes('ai-report-conclusion')) return aiReportConclusion(req, res);
  if (url.includes('analyze-extinguisher')) return analyzeExtinguisher(req, res);
  if (url.includes('analyze-general-risks')) return analyzeGeneralRisks(req, res);
  if (url.includes('analyze-image')) return analyzeImage(req, res);
  if (url.includes('daily-insight')) return dailyInsight(req, res);
  return aiAdvisor(req, res);
}
