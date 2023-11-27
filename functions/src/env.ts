export const googleProjectId = process.env.GCP_PROJECT_ID || "undefined"
export const datasetId = process.env.GCP_DATASET_ID || "undefined"
export const nelsonApiRoot = process.env.NELSON_API_ROOT || "undefined"
export const nelsonApiKey = process.env.NELSON_API_KEY || "undefined"

export const activeCampaignBaseUrl = process.env.ACTIVE_CAMPAIGN_BASE_URL || "undefined"
export const activeCampaignApiToken = process.env.ACTIVE_CAMPAIGN_API_TOKEN || "undefined"

if (googleProjectId === "undefined") {
  throw Error("GCP_PROJECT_ID environment variable not defined")
}

if (datasetId === "undefined") {
  throw Error("GCP_DATASET_ID environment variable not defined")
}

if (nelsonApiRoot === "undefined") {
  throw Error("NELSON_API_ROOT environment variable not defined")
}

if (nelsonApiKey === "undefined") {
  throw Error("NELSON_API_KEY environment variable not defined")
}

if (nelsonApiKey === "undefined") {
  throw Error("NELSON_API_KEY environment variable not defined")
}

if (activeCampaignBaseUrl === "undefined") {
  throw Error("ACTIVE_CAMPAIGN_BASE_URL environment variable not defined")
}

if (activeCampaignApiToken === "undefined") {
  throw Error("ACTIVE_CAMPAIGN_API_TOKEN environment variable not defined")
}