resource "google_bigquery_dataset" "cdp_dataset" {
  project     = var.project_id
  dataset_id  = "omena_customers"
  description = "Omena Customer Data Platform"
  location    = "EU"
}

module "data_transfer_sa" {
  source             = "../data-transfer-sa"
  target_project_id  = var.project_id
  source_project_id  = var.project_id
  source_dataset_ids = [google_bigquery_dataset.cdp_dataset.dataset_id]
  target_dataset_id  = google_bigquery_dataset.cdp_dataset.dataset_id
  service_account_id = "cdp-data-transfer"
}


resource "google_bigquery_table" "reservations_table" {
  project    = var.project_id
  dataset_id = google_bigquery_dataset.cdp_dataset.dataset_id
  table_id   = "reservations"

  deletion_protection = false
  schema = jsonencode(
    [
      {
        "name" : "id",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Reservation ID"
      },
      {
        "name" : "version",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Version number"
      },
      {
        "name" : "reservationCode",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Reservation code"
      },
      {
        "name" : "uuid",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "UUID of the reservation"
      },
      {
        "name" : "hotelId",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Id of the hotel"
      },
      {
        "name" : "lang",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "Language of the customer, e.g. 'en', 'fi', ..."
      },
      {
        "name" : "totalPaid",
        "type" : "FLOAT",
        "mode" : "REQUIRED",
        "description" : "Total amount paid"
      },
      {
        "name" : "currency",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "Currency, e.g. EUR"
      },
      {
        "name" : "customerFirstName",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "First name of customer"
      },
      {
        "name" : "customerLastName",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Last name of customer"
      },
      {
        "name" : "customerMobile",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Phonenumber e.g. +35834901238"
      },
      {
        "name" : "customerAddress",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Street address, e.g. Tietie 12"
      },
      {
        "name" : "customerPostalCode",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Postal code, e.g. 00100 may contain also 00100 Helsinki"
      },
      {
        "name" : "customerCity",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "City of customer"
      },
      {
        "name" : "customerSsn",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Encrypted version of customer social security number"
      },
      {
        "name" : "customerDateOfBirth",
        "type" : "DATE",
        "mode" : "NULLABLE",
        "description" : "Customer date of birth"
      },
      {
        "name" : "customerPurposeOfVisit",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "'LEISURE' or 'BUSINESS'"
      },
      {
        "name" : "customerNationality",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Customer nationality, e.g. 'FIN'"
      },
      {
        "name" : "companyName",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Customer company name"
      },
      {
        "name" : "companyReference",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Name of contact in company"
      },
      {
        "name" : "bookingChannel",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "Booking channel: 'BOOKINGCOM' | 'EXPEDIA' | 'NELSON' | 'MOBILEAPP'"
      },
      {
        "name" : "bookingChannelReservationId",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Id through the booking channel"
      },
      {
        "name" : "checkIn",
        "type" : "DATETIME",
        "mode" : "REQUIRED",
        "description" : "Date and time of checkin"
      },
      {
        "name" : "checkOut",
        "type" : "DATETIME",
        "mode" : "REQUIRED",
        "description" : "Date and time of checkout"
      },
      {
        "name" : "created",
        "type" : "DATETIME",
        "mode" : "REQUIRED",
        "description" : "Date of reservation creation"
      },
      {
        "name" : "confirmed",
        "type" : "DATETIME",
        "mode" : "NULLABLE",
        "description" : "Reservation confirmed date"
      },
      {
        "name" : "cancelled",
        "type" : "BOOLEAN",
        "mode" : "NULLABLE",
        "description" : "Is reservation cancelled"
      },
      {
        "name" : "isFullyRefunded",
        "type" : "BOOLEAN",
        "mode" : "REQUIRED",
        "description" : "Is reservation refunded"
      },
      {
        "name" : "pendingConfirmationSince",
        "type" : "DATETIME",
        "mode" : "NULLABLE",
        "description" : "Date and time of pending confirmation"
      },
      {
        "name" : "changeType",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Type of change, e.g. 'EXTEND'"
      },
      {
        "name" : "state",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "'CONFIRMED' | 'CANCELLED' | 'PENDING_CONFIRMATION' | 'BLOCKED'"
      },
      {
        "name" : "notifyCustomer",
        "type" : "BOOLEAN",
        "mode" : "REQUIRED",
        "description" : ""
      },
      {
        "name" : "isOverrided",
        "type" : "BOOLEAN",
        "mode" : "REQUIRED",
        "description" : ""
      },
      {
        "name" : "type",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : ""
      },
      {
        "name" : "modifiedBy",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Email of the modifier"
      },
      {
        "name" : "marketingPermission",
        "type" : "BOOLEAN",
        "mode" : "REQUIRED",
        "description" : "Permission to send marketing messages"
      },
      {
        "name" : "customerEmailReal",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Customer email address"
      },
      {
        "name" : "customerEmailVirtual",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Customer virtual email address, e.g. xxxx@guest.booking.com"
      },
      {
        "name" : "totalPaidExtraForOta",
        "type" : "FLOAT",
        "mode" : "REQUIRED",
        "description" : ""
      },
      {
        "name" : "breakfastsForAll",
        "type" : "BOOLEAN",
        "mode" : "REQUIRED",
        "description" : "Breakfast included for all"
      },
      {
        "name" : "companyYTunnus",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Company Y-tunnus"
      },
      {
        "name" : "customerPassportNumber",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Customer passport number"
      },
      {
        "name" : "memberId",
        "type" : "INTEGER",
        "mode" : "NULLABLE",
        "description" : "Id if one is member"
      },
      {
        "name" : "customerIsoCountryCode",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "'FIN', 'DEU', ..."
      },
      {
        "name" : "cancellationReason",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "'TRIP_GOT_CANCELLED', 'OTHER'"
      },
      {
        "name" : "reservationExtraInfo",
        "type" : "RECORD",
        "mode" : "NULLABLE",
        "description" : "Record of info",
        "fields" : [
          {
            "name" : "payoutType",
            "mode" : "NULLABLE",
            "type" : "STRING"
          },
          {
            "name" : "includeBreakfast",
            "mode" : "NULLABLE",
            "type" : "BOOLEAN"
          }
        ]
      },
      {
        "name" : "customerSignatureId",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Signature ID of the customer, points to an image"
      },
      {
        "name" : "hotel",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "'HKI2', 'TKU1', 'TKU2', 'VSA2', 'HKI3', 'TRE2', 'POR2', 'JYL1', 'VSA1'"
      },
      {
        "name" : "updated",
        "type" : "TIMESTAMP",
        "mode" : "REQUIRED",
        "description" : "Time of row updated"
      },
      {
        "name" : "voucherKeys",
        "mode" : "REPEATED",
        "type" : "STRING"
      }
  ])
}

resource "google_bigquery_table" "guests_table" {
  project    = var.project_id
  dataset_id = google_bigquery_dataset.cdp_dataset.dataset_id
  table_id   = "guests"

  deletion_protection = false
  schema = jsonencode(
    [
      {
        "name" : "id",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Guest ID"
      },
      {
        "name" : "reservationId",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Reservation ID"
      },
      {
        "name" : "roomAlias",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Room alias"
      },
      {
        "name" : "guestIndex",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Index of the guest"
      },
      {
        "name" : "firstName",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "First name of guest"
      },
      {
        "name" : "lastName",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Last name of guest"
      },
      {
        "name" : "nationality",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Guest nationality, e.g. 'FIN'"
      },
      {
        "name" : "city",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Guest home city"
      },
      {
        "name" : "postalCode",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Guest postal code"
      },
      {
        "name" : "email",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Guest email"
      },
      {
        "name" : "mobile",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Guest mobile phonenumber"
      },
      {
        "name" : "ssn",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Guest social security number encrypted"
      },
      {
        "name" : "dateOfBirth",
        "type" : "DATE",
        "mode" : "NULLABLE",
        "description" : "Guest date of birth"
      },
      {
        "name" : "purposeOfVisit",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "'LEISURE', 'BUSINESS'"
      },
      {
        "name" : "age",
        "type" : "INTEGER",
        "mode" : "NULLABLE",
        "description" : "Guest age in years"
      },
      {
        "name" : "passportNumber",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Guest passport number"
      },
      {
        "name" : "marketingPermission",
        "type" : "BOOLEAN",
        "mode" : "REQUIRED",
        "description" : "Permission to send marketing messages"
      },
      {
        "name" : "isoCountryCode",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "'FIN', 'DEU', ..."
      },
      {
        "name" : "signatureId",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Signature ID of the customer, points to an image"
      }
  ])
}

resource "google_bigquery_table" "customers_table" {
  project    = var.project_id
  dataset_id = google_bigquery_dataset.cdp_dataset.dataset_id
  table_id   = "customers"

  deletion_protection = false
  schema = jsonencode(
    [
      {
        "name" : "id",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "Customer ID"
      },
      {
        "name" : "ssn",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Social security number encrypted"
      },
      {
        "name" : "email",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Email"
      },
      {
        "name" : "firstName",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "First name of customer"
      },
      {
        "name" : "lastName",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Last name of customer"
      },
      {
        "name" : "phoneNumber",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Phonenumber"
      },
      {
        "name" : "dateOfBirth",
        "type" : "DATE",
        "mode" : "NULLABLE",
        "description" : "Customer date of birth"
      },
      {
        "name" : "gender",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Gender"
      },
      {
        "name" : "streetAddress",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Street address of customer"
      },
      {
        "name" : "city",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "City of customer"
      },
      {
        "name" : "postalCode",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Guest postal code"
      },
      {
        "name" : "isoCountryCode",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Country of customer"
      },
      {
        "name" : "includesChildren",
        "type" : "BOOLEAN",
        "mode" : "REQUIRED",
        "description" : "Customer has children in reservations"
      },
      {
        "name" : "level",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "'VIP' | 'Stable' | 'Developing' | 'New' | 'Guest'"
      },
      {
        "name" : "lifetimeSpend",
        "type" : "FLOAT",
        "mode" : "REQUIRED",
        "description" : "Total amount of money spend in EUR"
      },
      {
        "name" : "bookingNightsCounts",
        "mode" : "REPEATED",
        "type" : "INTEGER",
        "description" : "Number of nights in bookings"
      },
      {
        "name" : "bookingPeopleCounts",
        "mode" : "REPEATED",
        "type" : "INTEGER",
        "description" : "Number of nights in bookings"
      },
      {
        "name" : "bookingLeadTimesDays",
        "mode" : "REPEATED",
        "type" : "FLOAT",
        "description" : "Lead time in bookings"
      },
      {
        "name" : "avgBookingsPerYear",
        "type" : "FLOAT",
        "mode" : "REQUIRED",
        "description" : "Average of bookings per year"
      },
      {
        "name" : "avgBookingFrequencyDays",
        "type" : "FLOAT",
        "mode" : "REQUIRED",
        "description" : "Average days between bookings"
      },
      {
        "name" : "avgNightsPerBooking",
        "type" : "FLOAT",
        "mode" : "REQUIRED",
        "description" : "Average nights per booking"
      },
      {
        "name" : "avgPeoplePerBooking",
        "type" : "FLOAT",
        "mode" : "REQUIRED",
        "description" : "Average people per booking"
      },
      {
        "name" : "avgLeadTimeDays",
        "type" : "FLOAT",
        "mode" : "REQUIRED",
        "description" : "Average lead time of bookings"
      },
      {
        "name" : "firstCheckInDate",
        "type" : "DATETIME",
        "mode" : "REQUIRED",
        "description" : "First check in date and time"
      },
      {
        "name" : "latestCheckInDate",
        "type" : "DATETIME",
        "mode" : "REQUIRED",
        "description" : "Latest checkin date and time"
      },
      {
        "name" : "latestCheckOutDate",
        "type" : "DATETIME",
        "mode" : "REQUIRED",
        "description" : "Latest checkout date and time"
      },
      {
        "name" : "latestHotel",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Latest hotel"
      },
      {
        "name" : "totalBookingComBookings",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Total booking.com bookings"
      },
      {
        "name" : "totalExpediaBookings",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Total expedia bookings"
      },
      {
        "name" : "totalNelsonBookings",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Total nelson bookings"
      },
      {
        "name" : "totalMobileAppBookings",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Total mobile app bookings"
      },
      {
        "name" : "totalLeisureBookings",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Total leisure bookings"
      },
      {
        "name" : "totalBusinessBookings",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Total business bookings"
      },
      {
        "name" : "totalBookingsAsGuest",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Total bookings as guest"
      },
      {
        "name" : "totalBookings",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Total bookings"
      },
      {
        "name" : "totalContractBookings",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Total contract bookings"
      },
      {
        "name" : "totalBookingCancellations",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "How many bookings were cancelled"
      },
      {
        "name" : "totalBookingsPending",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "How many bookings are pending"
      },
      {
        "name" : "totalGroupBookings",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Total group bookings"
      },
      {
        "name" : "totalChildrenBookings",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Total of bookings with children"
      },
      {
        "name" : "memberId",
        "type" : "INTEGER",
        "mode" : "NULLABLE",
        "description" : "Id if one is member"
      },
      {
        "name" : "blocked",
        "type" : "BOOLEAN",
        "mode" : "REQUIRED",
        "description" : "Indicates if customer is blocked or not"
      },
      {
        "name" : "totalWeekDays",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Number of nights stayed during week"
      },
      {
        "name" : "totalWeekendDays",
        "type" : "INTEGER",
        "mode" : "REQUIRED",
        "description" : "Number of nights stayed during weekend"
      },
      {
        "name" : "totalHotelBookingCounts",
        "mode" : "REPEATED",
        "type" : "RECORD",
        "fields" : [
          {
            "name" : "hotel",
            "mode" : "REQUIRED",
            "type" : "STRING"
          },
          {
            "name" : "count",
            "mode" : "REQUIRED",
            "type" : "INTEGER"
          }
        ],
        "description" : "Total count of bookings the customer has made"
      },
      {
        "name" : "marketingPermission",
        "type" : "BOOLEAN",
        "mode" : "REQUIRED",
        "description" : "Permission to send marketing messages"
      },
      {
        "name" : "profileIds",
        "mode" : "REPEATED",
        "type" : "RECORD",
        "description" : "Ids of the customer reservations",
        "fields" : [
          {
            "name" : "id",
            "mode" : "REQUIRED",
            "type" : "INTEGER"
            "description" : "Id of the item"
          },
          {
            "name" : "type",
            "mode" : "REQUIRED",
            "type" : "STRING",
            "description" : "Reservation | Guest | ReservationGuest"
          }
        ]
      },
      {
        "name" : "created",
        "type" : "TIMESTAMP",
        "mode" : "NULLABLE",
        "description" : "Time of profile created (taken from reservation)"
      },
      {
        "name" : "updated",
        "type" : "TIMESTAMP",
        "mode" : "REQUIRED",
        "description" : "Time of row updated"
      },
      {
        "name" : "voucherKeys",
        "mode" : "REPEATED",
        "type" : "RECORD",
        "fields" : [
          {
            "name" : "reservationId",
            "mode" : "REQUIRED",
            "type" : "INTEGER"
          },
          {
            "name" : "key",
            "mode" : "REQUIRED",
            "type" : "STRING"
          }
        ],
        "description" : "Vouchers the customer has used"
      },
      {
        "name" : "latestCreated",
        "type" : "TIMESTAMP",
        "mode" : "NULLABLE",
        "description" : "Time of latest reservation (taken from reservation)"
      },
      {
        "name" : "levelHistory",
        "mode" : "REPEATED",
        "type" : "RECORD",
        "fields" : [
          {
            "name" : "timestamp",
            "mode" : "REQUIRED",
            "type" : "TIMESTAMP"
          },
          {
            "name" : "level",
            "mode" : "REQUIRED",
            "type" : "STRING"
          }
        ],
        "description" : "Level history of customer ('VIP' | 'Stable' | 'Developing' | 'New' | 'Guest')"
      },
  ])
}

resource "google_storage_bucket" "javascript_bucket" {
  project  = var.project_id
  name     = "${var.project_id}-bigquery-functions"
  location = "EU"
}

resource "google_storage_bucket_object" "udf_bigquery_object" {
  name   = "bigquery.js"
  source = "${path.module}/bigquery.js"
  bucket = google_storage_bucket.javascript_bucket.name
}

resource "google_bigquery_routine" "levenshtein_distance_routine" {
  project            = var.project_id
  dataset_id         = google_bigquery_dataset.cdp_dataset.dataset_id
  routine_id         = "levenshtein_distance_routine"
  routine_type       = "SCALAR_FUNCTION"
  language           = "JAVASCRIPT"
  imported_libraries = ["gs://${google_storage_bucket.javascript_bucket.name}/bigquery.js"]
  definition_body    = "return levenshteinDistance(s1, s2, s3)"
  determinism_level  = "DETERMINISTIC"

  arguments {
    name      = "s1"
    data_type = "{\"typeKind\" : \"STRING\"}"
  }
  arguments {
    name      = "s2"
    data_type = "{\"typeKind\" : \"STRING\"}"
  }
  arguments {
    name      = "s3"
    data_type = "{\"typeKind\" : \"INT64\"}"
  }

  return_type = "{\"typeKind\" : \"FLOAT64\"}"
}

resource "google_bigquery_routine" "map_voucher_category_routine" {
  project            = var.project_id
  dataset_id         = google_bigquery_dataset.cdp_dataset.dataset_id
  routine_id         = "map_voucher_category_routine"
  routine_type       = "SCALAR_FUNCTION"
  language           = "JAVASCRIPT"
  imported_libraries = ["gs://${google_storage_bucket.javascript_bucket.name}/bigquery.js"]
  definition_body    = "return mapVoucherCategory(keys)"
  determinism_level  = "DETERMINISTIC"

  arguments {
    name = "keys"
    data_type = jsonencode({
      typeKind : "ARRAY",
      arrayElementType : {
        typeKind : "STRUCT",
        structType : {
          fields : [
            {
              name : "reservationId",
              type : {
                typeKind : "INT64"
              }
            },
            {
              name : "key",
              type : {
                typeKind : "STRING",
              }
            }
          ]
        }
      }
    })
  }
  return_type = jsonencode({ typeKind : "STRING" })
}

resource "google_bigquery_table" "customer_hotels_table" {
  project             = var.project_id
  dataset_id          = google_bigquery_dataset.cdp_dataset.dataset_id
  table_id            = "customerHotels"
  deletion_protection = false
  view {
    query          = <<EOF
SELECT id, ARRAY_AGG(hotel) as hotels FROM `${var.project_id}.${google_bigquery_dataset.cdp_dataset.dataset_id}.customers` as customers
  CROSS JOIN UNNEST(customers.totalHotelBookingCounts) GROUP BY id
EOF
    use_legacy_sql = false
  }
}

resource "google_bigquery_table" "levels_table" {
  depends_on = [
    google_bigquery_routine.map_voucher_category_reservations_routine,
    google_bigquery_routine.map_voucher_category_routine,
    google_bigquery_table.customer_hotels_table
  ]
  project             = var.project_id
  dataset_id          = google_bigquery_dataset.cdp_dataset.dataset_id
  table_id            = "levels"
  deletion_protection = false
  view {
    query          = <<EOF
WITH segments AS (
  SELECT id, email, DATE_DIFF(CURRENT_DATE(), dateOfBirth, YEAR) as age,
  ROUND(avgLeadTimeDays) as leadTimeDays,
  lifetimeSpend,
  totalBookings,
  totalBookingsAsGuest,
  latestCheckInDate,
  voucherKeys,
  `${var.project_id}.${google_bigquery_dataset.cdp_dataset.dataset_id}`.map_voucher_category_routine(voucherKeys) as voucherCategory,
  IF(avgPeoplePerBooking <= 1, 'Yes', 'No') as single,
  IF(totalGroupBookings > 0, 'Yes', 'No') as includesGroups,
  IF(includesChildren, 'Yes', 'No') as includesChildren,
  IF(marketingPermission, 'Yes', 'No') as marketingPermission,
  IF(dateOfBirth IS NULL, 'No', 'Yes') as hasDateOfBirth,
  IF(ssn IS NULL, 'No', 'Yes') as hasSsn,
  IF(memberId IS NULL, 'No', 'Yes') as isMember,
  avgBookingFrequencyDays,
  isoCountryCode,
  avgNightsPerBooking,
  totalBusinessBookings,
  bookingNightsCounts,
  created,
  latestCreated,
  level,
  latestHotel,
  DATE_DIFF(CURRENT_DATE(), latestCheckInDate, DAY) as daysSinceCheckIn,
  DATE_DIFF(CURRENT_DATE(), EXTRACT(DATE FROM latestCreated), MONTH) as monthsSinceReservation,
  ROUND(IF(totalBookings = 0, 0 ,totalBookingCancellations / totalBookings) * 10) * 10 as cancellationPercentage
  FROM `${var.project_id}.${google_bigquery_dataset.cdp_dataset.dataset_id}.customers`)
SELECT id, segments.email as email,
  CASE
    WHEN avgNightsPerBooking >= 1 AND avgNightsPerBooking <= 5 THEN CAST(ROUND(avgNightsPerBooking) as STRING)
    WHEN avgNightsPerBooking <= 10 THEN '6-10'
    ELSE '10+'
    END
    as avgNightPerBookingClass,
  CASE
    WHEN age >= 18 AND age <= 24 THEN '18-24'
    WHEN age > 24 AND age <= 29 THEN '24-29'
    WHEN age > 29 AND age <= 39 THEN '30-39'
    WHEN age > 39 AND age <= 49 THEN '40-49'
    WHEN age > 49 AND age <= 59 THEN '50-59'
    WHEN age > 59 THEN '60+'
    ELSE 'Missing'
    END
    AS ageClass,
  CASE
    WHEN leadTimeDays < 8 THEN CAST(leadTimeDays as STRING)
    WHEN leadTimeDays < 15 THEN '8-14'
    WHEN leadTimeDays < 29 THEN '15-28'
    ELSE '29+'
    END
    AS leadTimeClass,
  CASE
    WHEN lifetimeSpend <= 0 THEN '0€'
    WHEN lifetimeSpend <= 100 THEN '1-100€'
    WHEN lifetimeSpend <= 200 THEN '101-200€'
    WHEN lifetimeSpend <= 500 THEN '201-500€'
    WHEN lifetimeSpend <= 1000 THEN '501-1000€'
    ELSE '>1000€'
    END
    AS spendClass,
  CASE
    WHEN totalBookings < 3 THEN CAST(totalBookings AS STRING)
    WHEN totalBookings <= 5 THEN '3-5'
    WHEN totalBookings <= 9 THEN '6-9'
    ELSE '10+'
    END
    AS buyClass,
  CASE
    WHEN totalBookings <= 0 AND totalBookingsAsGuest > 0 THEN 'Guest only'
    WHEN totalBookings > 0 AND totalBookingsAsGuest > 0 THEN 'Guest and Booker'
    WHEN totalBookings > 0 AND totalBookingsAsGuest <= 0 THEN 'Booker only'
    ELSE 'Unknown'
    END
    AS typeOfCustomer,
  latestCheckInDate,
  hasDateOfBirth,
  hasSsn,
  isMember,
  CASE
    WHEN daysSinceCheckIn > 730 THEN 'Passive'
    WHEN daysSinceCheckIn > 365 THEN 'Passive Risk'
    ELSE level
    END
    AS level,
  CASE
    WHEN daysSinceCheckIn < 90 THEN 'Yes'
    ELSE 'No'
    END
    AS active,
  marketingPermission,
  includesChildren,
  includesGroups,
  single,
  created,
  latestCreated,
  age,
  totalBookings,
  leadTimeDays,
  lifetimeSpend,
  IF(totalBusinessBookings > 0 OR voucherCategory = 'NSN', 'Yes', 'No') as includesBusiness,
  avgBookingFrequencyDays,
  isoCountryCode,
  bookingNightsCounts,
  IFNULL(voucherKeys[SAFE_OFFSET(0)].key, 'None') as primaryVoucherKey,
  voucherCategory,
  cancellationPercentage,
  CAST(monthsSinceReservation AS NUMERIC) as monthsSinceReservation,
  i.happenings as happeningInterests,
  i.hotelServices as hotelServiceInterests,
  i.places as placeInterests,
  i.values as valueInterests,
  latestHotel,
  (SELECT hotels FROM `${var.project_id}.${google_bigquery_dataset.cdp_dataset.dataset_id}.customerHotels` WHERE id=segments.id) as hotels
  FROM segments LEFT OUTER JOIN `${var.project_id}.${google_bigquery_dataset.cdp_dataset.dataset_id}.customerInterests` as i ON segments.email = i.email
EOF
    use_legacy_sql = false
  }
}

resource "google_bigquery_routine" "map_voucher_category_reservations_routine" {
  project            = var.project_id
  dataset_id         = google_bigquery_dataset.cdp_dataset.dataset_id
  routine_id         = "map_voucher_category_reservations_routine"
  routine_type       = "SCALAR_FUNCTION"
  language           = "JAVASCRIPT"
  imported_libraries = ["gs://${google_storage_bucket.javascript_bucket.name}/bigquery.js"]
  definition_body    = "return mapVoucherCategoryFromReservation(keys)"
  determinism_level  = "DETERMINISTIC"

  arguments {
    name = "keys"
    data_type = jsonencode({
      typeKind : "ARRAY",
      arrayElementType : {
        typeKind : "STRING"
      }
    })
  }
  return_type = jsonencode({ typeKind : "STRING" })
}

resource "google_bigquery_table" "reservation_categories_table" {
  depends_on          = [google_bigquery_routine.map_voucher_category_reservations_routine]
  project             = var.project_id
  dataset_id          = google_bigquery_dataset.cdp_dataset.dataset_id
  table_id            = "reservationCategories"
  deletion_protection = false
  view {
    query          = <<EOF
WITH segments AS (
  SELECT FORMAT_DATE('%A', checkIn) as checkInWeekday,
  FORMAT_DATE('%A', created) as creationWeekday,
  checkIn,
  bookingChannel,
  totalPaid,
  hotel,
  state,
  voucherKeys,
  DATE_DIFF(EXTRACT(DATE FROM checkOut), EXTRACT(DATE FROM checkIn), DAY) as nights,
  `${var.project_id}.${google_bigquery_dataset.cdp_dataset.dataset_id}`.map_voucher_category_reservations_routine(voucherKeys) as voucherCategory,
  created
  FROM `${var.project_id}.${google_bigquery_dataset.cdp_dataset.dataset_id}.reservations`)
SELECT
  checkInWeekday,
  creationWeekday,
  checkIn,
  CASE
    WHEN bookingChannel = 'BOOKINGCOM' THEN 'booking.com'
    WHEN bookingChannel = 'LEGACY' THEN 'Legacy'
    WHEN bookingChannel = 'EXPEDIA' THEN 'Expedia'
    WHEN bookingChannel = 'NELSON' THEN 'omenahotels.com'
    WHEN bookingChannel = 'MOBILEAPP' Then 'Mobile App'
    ELSE 'Unknown'
    END
    AS bookingChannel,
  totalPaid,
  hotel,
  state,
  voucherKeys[SAFE_OFFSET(0)] as voucherKey,
  nights,
  voucherCategory,
  CASE
    WHEN nights >= 1 AND nights <= 5 THEN CAST(ROUND(nights) as STRING)
    WHEN nights <= 10 THEN '6-10'
    ELSE '10+'
    END
    as nightsClass,
  created
  FROM segments
EOF
    use_legacy_sql = false
  }
}


resource "google_bigquery_table" "allocations_table" {
  depends_on          = [google_bigquery_routine.map_voucher_category_reservations_routine, google_bigquery_routine.map_voucher_category_routine]
  project             = var.project_id
  dataset_id          = google_bigquery_dataset.cdp_dataset.dataset_id
  table_id            = "allocations"
  deletion_protection = false
  view {
    query          = <<EOF
SELECT r.id as id, ANY_VALUE(r.hotel) as hotel, ANY_VALUE(r.totalPaid) / DATETIME_DIFF(MIN(r.checkOut), MAX(r.checkIn), DAY) as totalPaid,
  ANY_VALUE(r.created) as created,
  ANY_VALUE(r.checkIn) as checkIn, ANY_VALUE(r.checkOut) as checkOut,
  IFNULL(MAX(roomAlias), 1) as rooms, DATETIME_DIFF(MIN(r.checkOut), MAX(r.checkIn), DAY) as days,
  CASE
    WHEN ANY_VALUE(type) = 2 THEN 'Group'
    WHEN STARTS_WITH(ANY_VALUE(voucherKeys[SAFE_OFFSET(0)]),'NSN') THEN 'Business'
    ELSE 'Normal'
  END as type
  FROM `${var.project_id}.${google_bigquery_dataset.cdp_dataset.dataset_id}.guests` as g RIGHT OUTER JOIN
      `${var.project_id}.${google_bigquery_dataset.cdp_dataset.dataset_id}.reservations` as r ON r.id = g.reservationId
  WHERE r.state = 'CONFIRMED' GROUP BY r.id ORDER BY r.id DESC
EOF
    use_legacy_sql = false
  }
}
