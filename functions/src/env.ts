export const googleProjectId = process.env.GCP_PROJECT_ID || "undefined"
export const reservationTopicId = process.env.GCP_RESERVATION_TOPIC_ID || "undefined"

if (googleProjectId === "undefined") {
  throw Error("GCP_PROJECT_ID environment variable not defined")
}

if (reservationTopicId === "undefined") {
  throw Error("GCP_RESERVATION_TOPIC_ID environment variable not defined")
}