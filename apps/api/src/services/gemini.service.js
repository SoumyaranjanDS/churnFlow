const { env } = require("../config/env");
const { ApiError } = require("../utils/ApiError");

const GEMINI_ENDPOINT_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const ALLOWED_CONFIDENCE = ["high", "medium", "low"];

const extractJsonPayload = (rawText) => {
  if (!rawText || typeof rawText !== "string") {
    throw new ApiError(502, "Gemini returned an empty response");
  }

  const trimmed = rawText.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }

  const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)```/i) || trimmed.match(/```([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return JSON.parse(fencedMatch[1].trim());
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }

  throw new ApiError(502, "Gemini response did not contain valid JSON");
};

const normalizeConfidence = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return ALLOWED_CONFIDENCE.includes(normalized) ? normalized : "medium";
};

const findColumnMatch = (columns, value) => {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) {
    return "";
  }

  const exactMatch = columns.find((column) => String(column).trim() === cleanValue);
  if (exactMatch) {
    return exactMatch;
  }

  const caseInsensitiveMatch = columns.find(
    (column) => String(column).trim().toLowerCase() === cleanValue.toLowerCase()
  );

  return caseInsensitiveMatch || "";
};

const normalizeAiMappings = (suggestions, columns, allowedTargetFields) => {
  if (!Array.isArray(suggestions)) {
    return [];
  }

  const deduped = new Map();

  suggestions.forEach((item) => {
    const sourceColumn = findColumnMatch(columns, item?.sourceColumn);
    const targetField = String(item?.targetField || "").trim();

    if (!sourceColumn || !allowedTargetFields.includes(targetField)) {
      return;
    }

    deduped.set(sourceColumn, {
      sourceColumn,
      targetField,
      confidence: normalizeConfidence(item?.confidence),
      reason: String(item?.reason || "").trim(),
      source: "ai"
    });
  });

  return Array.from(deduped.values());
};

const buildDatasetPrompt = ({
  fileName,
  columns,
  sampleRows,
  suggestedIndustry,
  mappingSuggestions,
  readiness,
  targetCandidates,
  allowedTargetFields,
  allowedIndustries
}) => {
  return [
    "You are helping a B2B churn platform onboard a new client dataset.",
    "Return valid JSON only. No markdown, no code fences, no explanation outside JSON.",
    "Your job is to make onboarding easy for a non-technical business user.",
    "Look at the column names and sample rows, then guess what each important column means.",
    "",
    `file_name: ${fileName}`,
    `suggested_industry_from_rules: ${suggestedIndustry}`,
    `readiness_score_from_rules: ${readiness.score}`,
    `telecom_ready_from_rules: ${readiness.readyForTelecomPrediction}`,
    `custom_training_ready_from_rules: ${readiness.readyForCustomTraining}`,
    `columns: ${JSON.stringify(columns)}`,
    `mapping_suggestions_from_rules: ${JSON.stringify(mappingSuggestions)}`,
    `target_candidates_from_rules: ${JSON.stringify(targetCandidates)}`,
    `allowed_target_fields: ${JSON.stringify(allowedTargetFields)}`,
    `allowed_industries: ${JSON.stringify(allowedIndustries)}`,
    `sample_rows: ${JSON.stringify(sampleRows)}`,
    "",
    "Return this JSON shape:",
    JSON.stringify({
      suggestedIndustry: "telecom|subscription_like|custom_unknown",
      suggestedMappings: [
        {
          sourceColumn: "string from uploaded columns",
          targetField: "one of allowed_target_fields",
          confidence: "high|medium|low",
          reason: "short explanation"
        }
      ],
      suggestedTargetColumn: "string from uploaded columns or empty string",
      executiveSummary: "string",
      businessQuestions: ["string"],
      churnDefinitionOptions: ["string"],
      missingFieldExplanations: [{ field: "string", reason: "string" }],
      normalizationSuggestions: ["string"],
      customModelRecommendation: "string",
      confidence: "high|medium|low"
    }, null, 2),
    "",
    "Rules:",
    "- suggestedMappings should be your best first-pass guess, one mapping per source column at most.",
    "- Only use sourceColumn values that exist in the uploaded columns list.",
    "- Only use targetField values that exist in allowed_target_fields.",
    "- suggestedTargetColumn must be one of the uploaded columns, or an empty string if unclear.",
    "- If you map a column to target_label, suggestedTargetColumn should usually be that same source column.",
    "- Keep businessQuestions practical and short.",
    "- churnDefinitionOptions should be realistic for the uploaded data.",
    "- missingFieldExplanations should mention fields that would improve churn modeling.",
    "- normalizationSuggestions should focus on columns, value cleanup, and target preparation.",
    "- executiveSummary should be concise and product-friendly."
  ].join("\n");
};

const requestGeminiJson = async (prompt) => {
  if (!env.geminiApiKey) {
    throw new ApiError(500, "Gemini API key is not configured");
  }

  const endpoint = `${GEMINI_ENDPOINT_BASE}/${env.geminiModel}:generateContent`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.geminiApiKey
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    })
  });

  const body = await response.json();
  if (!response.ok) {
    const message = body?.error?.message || "Gemini request failed";
    throw new ApiError(response.status, message);
  }

  const text = body?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "";
  return extractJsonPayload(text);
};

const getDatasetAiInsights = async (payload) => {
  const columns = Array.isArray(payload?.columns) ? payload.columns : [];
  const allowedTargetFields = Array.isArray(payload?.allowedTargetFields) ? payload.allowedTargetFields : [];
  const allowedIndustries = Array.isArray(payload?.allowedIndustries) ? payload.allowedIndustries : [];
  const prompt = buildDatasetPrompt({ ...payload, columns, allowedTargetFields, allowedIndustries });
  const result = await requestGeminiJson(prompt);
  const suggestedMappings = normalizeAiMappings(result.suggestedMappings, columns, allowedTargetFields);
  const suggestedTargetColumn =
    findColumnMatch(columns, result.suggestedTargetColumn) ||
    suggestedMappings.find((item) => item.targetField === "target_label")?.sourceColumn ||
    "";
  const suggestedIndustry = allowedIndustries.includes(result.suggestedIndustry)
    ? result.suggestedIndustry
    : payload?.suggestedIndustry || "custom_unknown";

  return {
    suggestedIndustry,
    suggestedMappings,
    suggestedTargetColumn,
    executiveSummary: result.executiveSummary || "",
    businessQuestions: Array.isArray(result.businessQuestions) ? result.businessQuestions.slice(0, 6) : [],
    churnDefinitionOptions: Array.isArray(result.churnDefinitionOptions) ? result.churnDefinitionOptions.slice(0, 6) : [],
    missingFieldExplanations: Array.isArray(result.missingFieldExplanations) ? result.missingFieldExplanations.slice(0, 8) : [],
    normalizationSuggestions: Array.isArray(result.normalizationSuggestions) ? result.normalizationSuggestions.slice(0, 8) : [],
    customModelRecommendation: result.customModelRecommendation || "",
    confidence: normalizeConfidence(result.confidence),
    model: env.geminiModel
  };
};

module.exports = {
  getDatasetAiInsights
};
