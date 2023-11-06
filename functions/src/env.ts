export const googleProjectId = process.env.GCP_PROJECT_ID || "undefined"
export const datasetId = process.env.GCP_DATASET_ID || "undefined"
export const nelsonApiRoot = process.env.NELSON_API_ROOT || "undefined"
export const nelsonApiKey = process.env.NELSON_API_KEY || "undefined"

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