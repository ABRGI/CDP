import dayjs from "dayjs"
import { BigQuerySimple } from "./bigquery"
import { activeCampaignApiToken, activeCampaignBaseUrl, datasetId, googleProjectId } from "./env"
import { ActiveCampaignContact, ActiveCampaignContactCreateResponse, ActiveCampaignCustomFieldsResponse, ActiveCampaignCustomer, ActiveCampaignFieldMap } from "./acTypes"
import { arrayToMap } from "./utils"
import fetch from "node-fetch"
const bq = new BigQuerySimple(googleProjectId)

const acHeaders = {
  'Api-Token': activeCampaignApiToken,
  'accept': 'application/json'
}


export const getActiveCampaignCustomFields = async (): Promise<ActiveCampaignFieldMap> => {
  const response = await fetch(`${activeCampaignBaseUrl}/api/3/fields`, {
    method: 'GET',
    headers: acHeaders
  })
  const responseJson: ActiveCampaignCustomFieldsResponse = await response.json()
  const fieldMap: ActiveCampaignFieldMap = {}
  for (const field of responseJson.fields) {
    fieldMap[field.title] = field.id
  }
  return fieldMap
}

const getCustomerActiveCampaignContactValue = (fields: ActiveCampaignFieldMap, customer: ActiveCampaignCustomer): any => {
  return {
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    fieldValues: [{
      field: fields["level"],
      value: customer.level
    }]
  }
}

const createActiveCampaignContact = async (fields: ActiveCampaignFieldMap, customer: ActiveCampaignCustomer): Promise<void> => {
  const contact = getCustomerActiveCampaignContactValue(fields, customer)
  const response = await fetch(`${activeCampaignBaseUrl}/api/3/contacts`, {
    method: 'POST',
    headers: acHeaders,
    body: JSON.stringify({ contact })
  })
  if (response.status >= 300) {
    throw Error(`Failed to create contact with status: ${response.status}`)
  }
  const responseJson: ActiveCampaignContactCreateResponse = await response.json()
  await bq.insertOne(datasetId, 'acContacts', {
    contactId: responseJson.contact.id,
    customerId: customer.id,
    value: JSON.stringify(contact),
    updated: customer.updated
  })
}

const updateActiveCampaignContact = async (fields: ActiveCampaignFieldMap, contact: ActiveCampaignContact, customer: ActiveCampaignCustomer): Promise<void> => {
  const contactValue = getCustomerActiveCampaignContactValue(fields, customer)
  const response = await fetch(`${activeCampaignBaseUrl}/api/3/contacts/${contact.contactId}`, {
    method: 'PUT',
    headers: acHeaders,
    body: JSON.stringify({ contact: contactValue })
  })
  if (response.status >= 300) {
    throw Error(`Failed to update contact ${contact.contactId} with status: ${response.status}`)
  }
  await bq.delete(datasetId, `DELETE FROM acContacts WHERE contactId='${contact.contactId}'`)
  await bq.insertOne(datasetId, 'acContacts', {
    contactId: contact.contactId,
    customerId: customer.id,
    value: JSON.stringify(getCustomerActiveCampaignContactValue(fields, customer)),
    updated: customer.updated
  })
}

const removeActiveCampaignContact = async (contact: ActiveCampaignContact): Promise<void> => {
  const response = await fetch(`${activeCampaignBaseUrl}/api/3/contacts/${contact.contactId}`, {
    method: 'DELETE',
    headers: acHeaders,
  })
  if (response.status === 404) {
    console.warn(`Tried to remove non-existing contact with id ${contact.contactId}`)
  }
  else if (response.status >= 300) {
    throw Error(`Failed to remove contact with status: ${response.status}`)
  }
  await bq.delete(datasetId, `DELETE FROM acContacts WHERE contactId='${contact.contactId}'`)
}


const fetchActiveCampaignCustomerProfiles = async (latestUpdateMonths: number): Promise<{ [id: string]: ActiveCampaignCustomer }> => {
  const updated = dayjs().subtract(latestUpdateMonths, "months").format()
  const query = `SELECT * FROM customers WHERE updated>='${updated}' AND email IS NOT NULL AND latestCreated >= '${updated}'`
  const customers = await bq.query<ActiveCampaignCustomer>(datasetId, query)
  return arrayToMap("id", customers)
}

const fetchSynchronizedActiveCampaignContacts = async (): Promise<{ [customerId: string]: ActiveCampaignContact }> => {
  return arrayToMap("customerId", await bq.query<ActiveCampaignContact>(datasetId, 'SELECT * FROM acContacts'))
}


export const syncUpdatedCustomerProfilesToActiveCampaign = async (dryRun: boolean, latestUpdateMonths: number): Promise<void> => {
  const acFields = await getActiveCampaignCustomFields()
  const startTime = new Date().getTime()
  const customers = await fetchActiveCampaignCustomerProfiles(latestUpdateMonths)
  const acContacts = await fetchSynchronizedActiveCampaignContacts()

  const removed = Object.values(acContacts).filter(acc => !customers[acc.customerId])
  const added = Object.values(customers).filter(c => !acContacts[c.id])
  const updated = Object.values(customers).filter(c => {
    return acContacts[c.id] && acContacts[c.id].updated <= c.updated &&
      JSON.stringify(getCustomerActiveCampaignContactValue(acFields, c)) !== acContacts[c.id].value
  })

  console.log(`Found ${removed.length} Active Campaign contacts to removed.`)
  for (const remove of removed) {
    if (!dryRun) { await removeActiveCampaignContact(remove) }
    if (new Date().getTime() - startTime > 500000) break;
  }
  console.log(`Found ${added.length} customer profiles to add to Active Campaign`)
  for (const add of added) {
    if (!dryRun) { await createActiveCampaignContact(acFields, add) }
    if (new Date().getTime() - startTime > 500000) break;
  }
  console.log(`Found ${updated.length} customer profile to update to Active Campaign`)
  for (const update of updated) {
    if (!dryRun) { await updateActiveCampaignContact(acFields, acContacts[update.id], update) }
    if (new Date().getTime() - startTime > 500000) break;
  }
}