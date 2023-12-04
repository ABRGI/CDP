
export type ActiveCampaignLevel = 'None' | 'VIP' | 'Stable' | 'Developing' | 'New' | 'Guest'
export type ActiveCampaignBoolean = 'Yes' | 'No'

export type ActiveCampaignContact = {
  contactId: number
  customerId: string
  value: string
  updated: string
}

export type ActiveCampaignContactCreateResponse = {
  contact: {
    id: string
  }
}

export type ActiveCampaignField = {
  title: string,
  id: string
}

export type ActiveCampaignCustomFieldsResponse = {
  fieldOptions: any[],
  fieldRels: any[],
  fields: ActiveCampaignField[]
}

export type ActiveCampaignCustomer = any & {
  id: string,
  email: string,
  firstName?: string,
  lastName?: string,
  updated: string
}

export type ActiveCampaignFieldMap = { [name: string]: string }