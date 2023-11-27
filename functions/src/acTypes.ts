
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

export type ActiveCampaignCustomer = {
  id: string
  email?: string
  firstName?: string
  lastName?: string
  level: 'VIP' | 'Stable' | 'Developing' | 'New' | 'Guest'
  updated: string
}

export type ActiveCampaignFieldMap = { [name: string]: string }