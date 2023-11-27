
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

export type ActiveCampaignCustomer = {
  id: string
  email?: string
  firstName?: string
  lastName?: string
  level: 'VIP' | 'Stable' | 'Developing' | 'New' | 'Guest'
  updated: string
}