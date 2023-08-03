resource "google_bigquery_dataset" "cdp_dataset" {
  project     = var.project_id
  dataset_id  = "omena_customers"
  description = "Omena Customer Data Platform"
  location    = "EU"
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
        "type" : "INT64",
        "mode" : "REQUIRED",
        "description" : "Reservation ID"
      },
      {
        "name" : "version",
        "type" : "INT64",
        "mode" : "REQUIRED",
        "description" : "Version number"
      },
      {
        "name" : "reservationCode",
        "type" : "INT64",
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
        "type" : "INT64",
        "mode" : "REQUIRED",
        "description" : "Id of the hotel"
      },
      {
        "name" : "lang",
        "type" : "string",
        "mode" : "REQUIRED",
        "description" : "Language of the customer, e.g. 'en', 'fi', ..."
      },
      {
        "name" : "totalPaid",
        "type" : "NUMERIC",
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
        "mode" : "REQUIRED",
        "description" : "First name of customer"
      },
      {
        "name" : "customerLastName",
        "type" : "STRING",
        "mode" : "REQUIRED",
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
        "type" : "DATE",
        "mode" : "REQUIRED",
        "description" : "Date of reservation creation"
      },
      {
        "name" : "confirmed",
        "type" : "DATE",
        "mode" : "NULLABLE",
        "description" : "Reservation confirmed date"
      },
      {
        "name" : "cancelled",
        "type" : "BOOL",
        "mode" : "NULLABLE",
        "description" : "Is reservation cancelled"
      },
      {
        "name" : "isFullyRefunded",
        "type" : "BOOL",
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
        "type" : "BOOL",
        "mode" : "REQUIRED",
        "description" : ""
      },
      {
        "name" : "isOverrided",
        "type" : "BOOL",
        "mode" : "REQUIRED",
        "description" : ""
      },
      {
        "name" : "type",
        "type" : "INT64",
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
        "type" : "BOOL",
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
        "type" : "INT64",
        "mode" : "REQUIRED",
        "description" : ""
      },
      {
        "name" : "breakfastsForAll",
        "type" : "BOOL",
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
        "type" : "INT64",
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
            "type" : "BOOL"
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
        "type" : "INT64",
        "mode" : "REQUIRED",
        "description" : "Guest ID"
      },
      {
        "name" : "reservationId",
        "type" : "INT64",
        "mode" : "REQUIRED",
        "description" : "Reservation ID"
      },
      {
        "name" : "roomAlias",
        "type" : "INT64",
        "mode" : "REQUIRED",
        "description" : "Room alias"
      },
      {
        "name" : "guestIndex",
        "type" : "INT64",
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
        "type" : "INT64",
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
        "type" : "BOOL",
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
        "name" : "isoCountryCode",
        "type" : "STRING",
        "mode" : "NULLABLE",
        "description" : "Country of customer"
      },
      {
        "name" : "includesChildren",
        "type" : "BOOL",
        "mode" : "REQUIRED",
        "description" : "Customer has children in reservations"
      },
      {
        "name" : "level",
        "type" : "STRING",
        "mode" : "REQUIRED",
        "description" : "'VIP' | 'Loyal' | 'Passive' | 'Risk' | 'New' | 'Guest'"
      },
      {
        "name" : "lifetimeSpend",
        "type" : "NUMERIC",
        "mode" : "REQUIRED",
        "description" : "Total amount of money spend in EUR"
      },
      {
        "name" : "bookingNightsCounts",
        "mode" : "REPEATED",
        "type" : "INT64",
        "description" : "Number of nights in bookings"
      },
      {
        "name" : "bookingPeopleCounts",
        "mode" : "REPEATED",
        "type" : "INT64",
        "description" : "Number of nights in bookings"
      },
      {
        "name" : "bookingLeadTimesDays",
        "mode" : "REPEATED",
        "type" : "NUMERIC",
        "description" : "Lead time in bookings"
      },
      {
        "name" : "avgBookingsPerYear",
        "type" : "NUMERIC",
        "mode" : "REQUIRED",
        "description" : "Average of bookings per year"
      },
      {
        "name" : "avgBookingFrequencyDays",
        "type" : "NUMERIC",
        "mode" : "REQUIRED",
        "description" : "Average days between bookings"
      },
      {
        "name" : "avgNightsPerBooking",
        "type" : "NUMERIC",
        "mode" : "REQUIRED",
        "description" : "Average nights per booking"
      },
      {
        "name" : "avgPeoplePerBooking",
        "type" : "NUMERIC",
        "mode" : "REQUIRED",
        "description" : "Average people per booking"
      },
      {
        "name" : "avgLeadTimeDays",
        "type" : "NUMERIC",
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
        "type" : "INT64",
        "mode" : "REQUIRED",
        "description" : "Total booking.com bookings"
      },
      {
        "name" : "totalExpediaBookings",
        "type" : "INT64",
        "mode" : "REQUIRED",
        "description" : "Total expedia bookings"
      },
      {
        "name" : "totalNelsonBookings",
        "type" : "INT64",
        "mode" : "REQUIRED",
        "description" : "Total nelson bookings"
      },
      {
        "name" : "totalMobileAppBookings",
        "type" : "INT64",
        "mode" : "REQUIRED",
        "description" : "Total mobile app bookings"
      },
      {
        "name" : "totalLeisureBookings",
        "type" : "INT64",
        "mode" : "REQUIRED",
        "description" : "Total leisure bookings"
      },
      {
        "name" : "totalBusinessBookings",
        "type" : "INT64",
        "mode" : "REQUIRED",
        "description" : "Total business bookings"
      },
      {
        "name" : "totalBookingsAsGuest",
        "type" : "INT64",
        "mode" : "REQUIRED",
        "description" : "Total bookings as guest"
      },
      {
        "name" : "totalBookings",
        "type" : "INT64",
        "mode" : "REQUIRED",
        "description" : "Total bookings"
      },
      {
        "name" : "totalBookingCancellations",
        "type" : "INT64",
        "mode" : "REQUIRED",
        "description" : "How many bookings were cancelled"
      },
      {
        "name" : "blocked",
        "type" : "BOOL",
        "mode" : "REQUIRED",
        "description" : "Indicates if customer is blocked or not"
      },
      {
        "name" : "totalWeekdays",
        "type" : "INT64",
        "mode" : "REQUIRED",
        "description" : "Number of nights stayed during week"
      },
      {
        "name" : "totalWeekendDays",
        "type" : "INT64",
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
            "type" : "INT64"
          }
        ]
      },
      {
        "name" : "marketingPermission",
        "type" : "BOOL",
        "mode" : "REQUIRED",
        "description" : "Permission to send marketing messages"
      }
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
  definition_body    = "return levenshteinDistance(s1, s2)"
  determinism_level  = "DETERMINISTIC"

  arguments {
    name      = "s1"
    data_type = "{\"typeKind\" : \"STRING\"}"
  }
  arguments {
    name      = "s2"
    data_type = "{\"typeKind\" : \"STRING\"}"
  }

  return_type = "{\"typeKind\" : \"NUMERIC\"}"
}
