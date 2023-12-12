
resource "google_bigquery_table" "ac_contacts" {
  project    = var.project_id
  dataset_id = google_bigquery_dataset.cdp_dataset.dataset_id
  table_id   = "acContacts"

  deletion_protection = false
  schema = jsonencode(
    [
      {
        "name" : "contactId",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "Active campaign contact ID"
      },
      {
        "name" : "customerId",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "Identifier of the customer profile"
      },
      {
        "name" : "value",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "Synchronized value (JSON string)"
      },
      {
        "name" : "updated",
        "type" : "TIMESTAMP",
        "mode" : "REQUIRED",
        "description" : "Time of latest synchronization"
      }
  ])
}

resource "google_bigquery_table" "ac_source_table" {
  depends_on          = [google_bigquery_routine.map_voucher_category_reservations_routine, google_bigquery_routine.map_voucher_category_routine]
  project             = var.project_id
  dataset_id          = google_bigquery_dataset.cdp_dataset.dataset_id
  table_id            = "acSource"
  deletion_protection = false
  view {
    query          = <<EOF
WITH segments AS (
  SELECT
    id,
    email,
    firstName,
    lastName,
    ROUND(IF(totalBookings = 0, 0 ,totalBookingCancellations / totalBookings) * 10) * 10 as cancellationPercentage,
    city as City,
    latestHotel as hotel1,
    IF(includesChildren, 'Yes', 'No') as includesChildren,
    IF(avgPeoplePerBooking <= 1, 'Yes', 'No') as single,
    level,
    DATE_DIFF(CURRENT_DATE(), latestCheckInDate, DAY) as daysSinceCheckIn,
    CASE
      WHEN totalLeisureBookings < 1 THEN 'None'
      WHEN totalLeisureBookings < 2 THEN 'New'
      WHEN totalLeisureBookings < 3 THEN 'Developing'
      WHEN totalLeisureBookings < 5 THEN 'Stable'
      ELSE 'VIP'
      END
      as privateLevel,
    CASE
      WHEN totalGroupBookings < 1 THEN 'None'
      WHEN totalGroupBookings < 2 THEN 'New'
      WHEN totalGroupBookings < 3 THEN 'Developing'
      WHEN totalGroupBookings < 5 THEN 'Stable'
      ELSE 'VIP'
      END
      as groupLevel,
    IF(totalBookingComBookings > 0, 'Yes', 'No') as channelBookingCom,
    IF(totalNelsonBookings > 0, 'Yes', 'No') as channelOmenaHotelsCom,
    IF(totalExpediaBookings > 0, 'Yes', 'No') as channelExpedia,
    IF(totalMobileAppBookings > 0, 'Yes', 'No') as channelApp,
    `${var.project_id}.${google_bigquery_dataset.cdp_dataset.dataset_id}`.map_voucher_category_routine(voucherKeys) as voucherCategory,
    updated
    FROM `${var.project_id}.${google_bigquery_dataset.cdp_dataset.dataset_id}.customers` WHERE (marketingPermission = TRUE OR memberId IS NOT NULL) and isoCountryCode = 'FIN')
  SELECT id, segments.email as email,
    segments.firstName as firstName,
    lastName,
    cancellationPercentage,
    city as City,
    hotel1,
    includesChildren,
    single,
    level,
    privateLevel,
    groupLevel,
    CASE
      WHEN daysSinceCheckIn > 730 THEN 'Yes'
      ELSE 'No'
      END
      AS passive,
    CASE
      WHEN daysSinceCheckIn > 365 THEN 'Yes'
      ELSE 'No'
      END
      AS passiveRisk,
    channelBookingCom,
    channelOmenaHotelsCom,
    channelExpedia,
    channelApp,
    voucherCategory,

    IF((SELECT 'festarit ja keikat' IN UNNEST(i.happenings)), 'Yes', 'No') as interestPartiesAndGigs,
    IF((SELECT 'urheilutapahtumat' IN UNNEST(i.happenings)), 'Yes', 'No') as interestSportEvents,
    IF((SELECT 'taide' IN UNNEST(i.happenings)), 'Yes', 'No') as interestArts,
    IF((SELECT 'teatteri' IN UNNEST(i.happenings)), 'Yes', 'No') as interestTheater,
    IF((SELECT 'korkeakulttuuri (baletti/ooppera)' IN UNNEST(i.happenings)), 'Yes', 'No') as interestBalletAndOpera,
    IF((SELECT 'messut' IN UNNEST(i.happenings)), 'Yes', 'No') as interestFair,
    IF((SELECT 'lasten tapahtumat' IN UNNEST(i.happenings)), 'Yes', 'No') as interestEventsForChildren,

    IF((SELECT 'kestävä matkailu / ympäristö' IN UNNEST(i.values)), 'Yes', 'No') as interestEnvironment,
    IF((SELECT 'kotimaisuus' IN UNNEST(i.values)), 'Yes', 'No') as interestDomesticity,
    IF((SELECT 'terveys' IN UNNEST(i.values)), 'Yes', 'No') as interestHealth,
    IF((SELECT 'työmatkustus' IN UNNEST(i.values)), 'Yes', 'No') as interestBusinessTravel,
    IF((SELECT 'tarjoukset' IN UNNEST(i.values)), 'Yes', 'No') as interestOffers,
    IF((SELECT 'viihde' IN UNNEST(i.values)), 'Yes', 'No') as interestEntertainment,
    IF((SELECT 'shoppailu' IN UNNEST(i.values)), 'Yes', 'No') as interestShopping,

    IF((SELECT 'joustavammat tulo- ja lähtöajat' IN UNNEST(i.hotelServices)), 'Yes', 'No') as interestFlexibleCheckAndCheckOut,
    IF((SELECT 'kylpylä ja sauna' IN UNNEST(i.hotelServices)), 'Yes', 'No') as interestSpaAndSauna,
    IF((SELECT 'kuntosali' IN UNNEST(i.hotelServices)), 'Yes', 'No') as interestGym,
    IF((SELECT 'parkkipaikat' IN UNNEST(i.hotelServices)), 'Yes', 'No') as interestParkingSlots,
    IF((SELECT 'aamiainen' IN UNNEST(i.hotelServices)), 'Yes', 'No') as interestBreakfast,

    IF((SELECT 'baarit' IN UNNEST(i.places)), 'Yes', 'No') as interestBars,
    IF((SELECT 'turistinähtävyydet' IN UNNEST(i.places)), 'Yes', 'No') as interestTouristAttractions,
    IF((SELECT 'ruoka ja ravintolat' IN UNNEST(i.places)), 'Yes', 'No') as interestFoodAndRestaurants,
    IF((SELECT 'museot' IN UNNEST(i.places)), 'Yes', 'No') as interestMuseums,
    IF((SELECT 'luontokohteet' IN UNNEST(i.places)), 'Yes', 'No') as interestNatureDestinations,

    updated
    FROM segments LEFT OUTER JOIN `${var.project_id}.${google_bigquery_dataset.cdp_dataset.dataset_id}.customerInterests` as i ON segments.email = i.email
EOF
    use_legacy_sql = false
  }
}


resource "google_pubsub_topic" "function_trigger_ac_sync_pubsub" {
  name    = "trigger-ac-sync-pubsub"
  project = var.project_id

  message_storage_policy {
    allowed_persistence_regions = [
      "europe-west1",
    ]
  }
}

resource "google_cloud_scheduler_job" "ac_sync_scheduler" {
  project     = var.project_id
  region      = "europe-west1"
  name        = "ac-sync-scheduler-job"
  description = "Run Active Campaign synchronization"
  schedule    = "0 0,4,8,12,16,20 * * *"

  pubsub_target {
    topic_name = google_pubsub_topic.function_trigger_ac_sync_pubsub.id
    data       = base64encode("notused")
  }
}
