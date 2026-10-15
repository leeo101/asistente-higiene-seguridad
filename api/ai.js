import aiAdvisor from './_ai-advisor.js';
import aiAtsGenerator from './_ai-ats-generator.js';
import aiChat from './_ai-chat.js';
import aiLegalSummary from './_ai-legal-summary.js';
import aiReportConclusion from './_ai-report-conclusion.js';
import aiStopcard from './_ai-stopcard.js';
import analyzeContractorDoc from './_analyze-contractor-doc.js';
import analyzeExtinguisher from './_analyze-extinguisher.js';
import analyzeGeneralRisks from './_analyze-general-risks.js';
import analyzeImage from './_analyze-image.js';
import analyzeTrainingSheet from './_analyze-training-sheet.js';
import dailyInsight from './_daily-insight.js';
import emergencyChat from './_emergency-chat.js';
import predictAccidents from './_predict-accidents.js';
import visionAts from './_vision-ats.js';

export default async function handler(req, res) {
  const url = req.url || '';
  if (url.includes('ai-ats-generator')) return aiAtsGenerator(req, res);
  if (url.includes('ai-chat')) return aiChat(req, res);
  if (url.includes('ai-legal-summary')) return aiLegalSummary(req, res);
  if (url.includes('ai-report-conclusion')) return aiReportConclusion(req, res);
  if (url.includes('ai-stopcard')) return aiStopcard(req, res);
  if (url.includes('analyze-contractor-doc')) return analyzeContractorDoc(req, res);
  if (url.includes('analyze-extinguisher')) return analyzeExtinguisher(req, res);
  if (url.includes('analyze-general-risks')) return analyzeGeneralRisks(req, res);
  if (url.includes('analyze-training-sheet')) return analyzeTrainingSheet(req, res);
  if (url.includes('analyze-image')) return analyzeImage(req, res);
  if (url.includes('daily-insight')) return dailyInsight(req, res);
  if (url.includes('emergency-chat')) return emergencyChat(req, res);
  if (url.includes('predict-accidents')) return predictAccidents(req, res);
  if (url.includes('vision-ats')) return visionAts(req, res);

  return aiAdvisor(req, res);
}
