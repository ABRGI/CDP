import { BigQuerySimple } from "./bigquery"
import { activeCampaignApiToken, activeCampaignBaseUrl, datasetId, googleProjectId } from "./env"
import { ActiveCampaignContact, ActiveCampaignContactCreateResponse, ActiveCampaignCustomFieldsResponse, ActiveCampaignCustomer, ActiveCampaignFieldMap } from "./acTypes"
import { arrayToMap, sleep, splitIntoChunks } from "./utils"
import fetch from "node-fetch"
import { writeFileSync } from 'fs'
const bq = new BigQuerySimple(googleProjectId)

const acHeaders = {
  'Api-Token': activeCampaignApiToken,
  'accept': 'application/json'
}


export const getActiveCampaignCustomFields = async (): Promise<ActiveCampaignFieldMap> => {
  const response = await fetch(`${activeCampaignBaseUrl}/api/3/fields?offset=0&limit=200`, {
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
    fieldValues: Object.keys(fields).map(key => ({
      field: fields[key],
      value: customer[key]
    })).filter(fv => typeof fv.value !== "undefined")
  }
}

const getActiveCampaignContactByEmail = async (email: string): Promise<string | undefined> => {
  const response = await fetch(`${activeCampaignBaseUrl}/api/3/contacts?email=${email}`, {
    method: 'GET',
    headers: acHeaders
  })
  if (response.status >= 300) {
    throw Error(`Getting contact by email failed with status ${response.status}`)
  }
  const responseJson = await response.json()
  if (!responseJson.contacts.length) {
    return
  }
  return responseJson.contacts[0].id
}

export const createActiveCampaignContact = async (fields: ActiveCampaignFieldMap, customer: ActiveCampaignCustomer): Promise<number> => {
  const contact = getCustomerActiveCampaignContactValue(fields, customer)
  const response = await fetch(`${activeCampaignBaseUrl}/api/3/contacts`, {
    method: 'POST',
    headers: acHeaders,
    body: JSON.stringify({ contact })
  })
  let contactId: string | undefined = ""
  if (response.status < 300) {
    const responseJson: ActiveCampaignContactCreateResponse = await response.json()
    contactId = responseJson.contact.id
    await bq.insertOne(datasetId, 'acContacts', {
      contactId,
      customerId: customer.id,
      value: JSON.stringify(contact),
      updated: customer.updated
    })
    return 1
  }
  else if (response.status === 422) {
    contactId = await getActiveCampaignContactByEmail(customer.email!)
    if (contactId) {
      contact.contactId = contactId
      try {
        await updateActiveCampaignContact(fields, contact, customer)
      }
      catch {
        console.log(`Update fail: ${contact.email}`)
      }
    } else {
      console.log(`Missing contact with email ${customer.email}`)
    }
    return 3
  }
  else {
    throw Error(`Failed to create contact with status: ${response.status}`)
  }
}

export const overwriteActiveCampaignContact = async (contactId: string, fields: ActiveCampaignFieldMap, customer: ActiveCampaignCustomer): Promise<void> => {
  const contact = getCustomerActiveCampaignContactValue(fields, customer)
  contact.contactId = contactId
  const response = await fetch(`${activeCampaignBaseUrl}/api/3/contacts/${contactId}`, {
    method: 'PUT',
    headers: acHeaders,
    body: JSON.stringify({ contact })
  })
  if (response.status >= 300) {
    throw Error(`Failed to overwrite contact ${contact.contactId} with status: ${response.status}`)
  }
  await bq.insertOne(datasetId, 'acContacts', {
    contactId: contact.contactId,
    customerId: customer.id,
    value: JSON.stringify(getCustomerActiveCampaignContactValue(fields, customer)),
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
  if (response.status === 422) {
    await bq.delete(datasetId, `DELETE FROM acContacts WHERE contactId='${contact.contactId}'`)
  }
  else if (response.status >= 300) {
    throw Error(`Failed to update contact ${contact.contactId} with status: ${response.status}`)
  } else {
    await bq.delete(datasetId, `DELETE FROM acContacts WHERE contactId='${contact.contactId}'`)
    await bq.insertOne(datasetId, 'acContacts', {
      contactId: contact.contactId,
      customerId: customer.id,
      value: JSON.stringify(getCustomerActiveCampaignContactValue(fields, customer)),
      updated: customer.updated
    })
  }

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


const fetchActiveCampaignCustomerProfiles = async (): Promise<{ [id: string]: ActiveCampaignCustomer }> => {
  const customers = await bq.query<ActiveCampaignCustomer>(datasetId, `SELECT * FROM acSource ORDER BY updated DESC`)
  const filtered: ActiveCampaignCustomer[] = []
  const emails = new Set<string>()
  for (const customer of customers) {
    if (!emails.has(customer.email)) {
      emails.add(customer.email)
      filtered.push(customer)
    }
  }
  return arrayToMap("id", filtered)
}

const fetchSynchronizedActiveCampaignContacts = async (): Promise<{ [customerId: string]: ActiveCampaignContact }> => {
  return arrayToMap("customerId", await bq.query<ActiveCampaignContact>(datasetId, 'SELECT * FROM acContacts ORDER BY updated DESC, customerId DESC'))
}


export const syncUpdatedCustomerProfilesToActiveCampaign = async (dryRun: boolean, existing: { [email: string]: string } = {}): Promise<void> => {
  const acFields = await getActiveCampaignCustomFields()
  const startTime = new Date().getTime()
  const customers = await fetchActiveCampaignCustomerProfiles()
  const acContacts = await fetchSynchronizedActiveCampaignContacts()

  const removed = Object.values(acContacts).filter(acc => !customers[acc.customerId])
  const added = Object.values(customers).filter(c => !acContacts[c.id])
  const updated = Object.values(customers).filter(c => {
    return acContacts[c.id] && acContacts[c.id].updated <= c.updated &&
      JSON.stringify(getCustomerActiveCampaignContactValue(acFields, c)) !== acContacts[c.id].value
  })

  console.log(`Found ${removed.length} Active Campaign contacts to removed.`)
  let removeCount = 0
  let addCount = 0
  let updateCount = 0
  const removeChunks: any[] = splitIntoChunks(removed, 1)
  for (const removeChunk of removeChunks) {
    if (!dryRun) {
      await Promise.all(removeChunk.map((remove: any) => {
        return removeActiveCampaignContact(remove)
      }))
    }
    removeCount += removeChunk.length
    if (new Date().getTime() - startTime > 150000) break;
  }

  console.log(`Found ${added.length} customer profiles to add to Active Campaign`)
  const addChunks: any[] = splitIntoChunks(added, 4)
  for (const addChunk of addChunks) {
    if (!dryRun) {
      await Promise.all(addChunk.map((add: any) => {
        if (existing[add.email]) {
          return overwriteActiveCampaignContact(existing[add.email], acFields, add)
        }
        else {
          return createActiveCampaignContact(acFields, add)
        }
      }))
    }
    addCount += addChunk.length
    if (new Date().getTime() - startTime > 300000) break;
  }
  console.log(`Found ${updated.length} customer profile to update to Active Campaign`)
  const updateChunks = splitIntoChunks(updated, 1)
  for (const updateChunk of updateChunks) {
    if (!dryRun) {
      await Promise.all(updateChunk.map((update: any) => updateActiveCampaignContact(acFields, acContacts[update.id], update)))
    }
    updateCount += updateChunk.length
    if (new Date().getTime() - startTime > 450000) break;
  }
  console.log(`Removed ${removeCount}, added ${addCount} and updated ${updateCount} customer profiles.`)
}


const fetchContactsPage = async (offset: number, limit: number): Promise<{ contacts: { id: string, email: string }[], meta: { total: number } }> => {
  const response = await fetch(`${activeCampaignBaseUrl}/api/3/contacts?offset=${offset}&limit=${limit}`, {
    headers: acHeaders
  })
  if (response.status >= 300) {
    throw Error(`Error in loading ${response.status}: ${response.statusText}`)
  }
  return await response.json()
}

export const getAllContacts = async (): Promise<void> => {
  let page = await fetchContactsPage(0, 100)
  let offset = 0

  const allContacts: { id: string, email: string }[] = []
  while (offset < page.meta.total) {
    page = await fetchContactsPage(offset, 100)
    for (const contact of page.contacts) {
      allContacts.push({ id: contact.id, email: contact.email })
    }
    offset += 100
    if (!(offset % 1000)) {
      console.log(`${offset}`)
      writeFileSync("contacts.json", JSON.stringify(allContacts, null, 2))
    }
  }
  writeFileSync("contacts.json", JSON.stringify(allContacts, null, 2))
}