export const googleProjectId = process.env.GCP_PROJECT_ID || "undefined"
export const datasetId = process.env.GCP_DATASET_ID || "undefined"

if (googleProjectId === "undefined") {
  throw Error("GCP_PROJECT_ID environment variable not defined")
}

if (datasetId === "undefined") {
  throw Error("GCP_DATASET_ID environment variable not defined")
}