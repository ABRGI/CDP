import dayjs from "dayjs"
import { BigQuerySimple } from "./bigquery"
import { activeCampaignApiToken, activeCampaignBaseUrl, datasetId, googleProjectId } from "./env"
import { ActiveCampaignContact, ActiveCampaignContactCreateResponse, ActiveCampaignCustomer } from "./acTypes"
import { arrayToMap } from "./utils"
import fetch from "node-fetch"
const bq = new BigQuerySimple(googleProjectId)

const acHeaders = {
  'Api-Token': activeCampaignApiToken,
  'accept': 'application/json'
}

const getCustomerActiveCampaignContactValue = (customer: ActiveCampaignCustomer): any => {
  return {
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    fieldValues: [{
      field: "1",
      value: customer.level
    }]
  }
}

const createActiveCampaignContact = async (customer: ActiveCampaignCustomer): Promise<void> => {
  const contact = getCustomerActiveCampaignContactValue(customer)
  const response = await fetch(`${activeCampaignBaseUrl}/contacts`, {
    method: 'POST',
    headers: acHeaders,
    body: JSON.stringify({ contact })
  })
  const responseJson: ActiveCampaignContactCreateResponse = await response.json()
  await bq.insertOne(datasetId, 'acContacts', {
    contactId: responseJson.contact.id,
    customerId: customer.id,
    value: JSON.stringify(contact),
    updated: customer.updated
  })
}

const updateActiveCampaignContact = async (contact: ActiveCampaignContact, customer: ActiveCampaignCustomer): Promise<void> => {
  const contactValue = getCustomerActiveCampaignContactValue(customer)
  await fetch(`${activeCampaignBaseUrl}/contacts/${contact.contactId}`, {
    method: 'PUT',
    headers: acHeaders,
    body: JSON.stringify({ contact: contactValue })
  })
  await bq.delete(datasetId, `DELETE FROM acContacts WHERE contactId='${contact.contactId}'`)
  await bq.insertOne(datasetId, 'acContacts', {
    contactId: contact.contactId,
    customerId: customer.id,
    value: JSON.stringify(getCustomerActiveCampaignContactValue(customer)),
    updated: customer.updated
  })
}

const removeActiveCampaignContact = async (contact: ActiveCampaignContact): Promise<void> => {
  await fetch(`${activeCampaignBaseUrl}/contacts/${contact.contactId}`, {
    method: 'DELETE',
    headers: acHeaders,
  })
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


export const syncUpdatedCustomerProfilesToActiveCampaign = async (latestUpdateMonths: number): Promise<void> => {
  const startTime = new Date().getTime()
  const customers = await fetchActiveCampaignCustomerProfiles(latestUpdateMonths)
  const acContacts = await fetchSynchronizedActiveCampaignContacts()

  const removed = Object.values(acContacts).filter(acc => !customers[acc.customerId])
  const added = Object.values(customers).filter(c => !acContacts[c.id])
  const updated = Object.values(customers).filter(c => {
    return acContacts[c.id] && acContacts[c.id].updated < c.updated &&
      JSON.stringify(getCustomerActiveCampaignContactValue(c)) !== acContacts[c.id].value
  })

  console.log(`Found ${removed.length} Active Campaign contacts to removed.`)
  for (const remove of removed) {
    // await removeActiveCampaignContact(remove)
    if (new Date().getTime() - startTime > 500000) break;
  }
  console.log(`Found ${added.length} customer profiles to add to Active Campaign`)
  for (const add of added) {
    // await createActiveCampaignContact(add)
    if (new Date().getTime() - startTime > 500000) break;
  }
  console.log(`Found ${updated.length} customer profile to update to Active Campaign`)
  for (const update of updated) {
    // await updateActiveCampaignContact(acContacts[update.id], update)
    if (new Date().getTime() - startTime > 500000) break;
  }
}