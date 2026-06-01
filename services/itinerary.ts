import { databases } from '@/lib/appwrite'
import { ID, Query } from 'react-native-appwrite'

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!
const ITINERARY_ID = process.env.EXPO_PUBLIC_APPWRITE_ITINERARY_COLLECTION_ID!


export type ItineraryItem = {
  $id: string
  userId: string
  tripId: string
  date: string
  name: string
  time: number
  parkId: string
  notes?: string
  itemType: 'block' | 'event'
  endTime?: number
  blockDuration?: 'full' | 'am' | 'pm' | 'specific'
  $createdAt: string
}
  
  export const getItineraryItems = async (tripId: string) => {
    const response = await databases.listDocuments(DATABASE_ID, ITINERARY_ID, [
      Query.equal('tripId', tripId),
      Query.orderAsc('time'),
    ])
    return response.documents as unknown as ItineraryItem[]
  }
  
  export const createItineraryItem = async (
    item: Omit<ItineraryItem, '$id' | '$createdAt'>
  ) => {
    return databases.createDocument(DATABASE_ID, ITINERARY_ID, ID.unique(), item)
  }
  
  export const updateItineraryItem = async (
    id: string,
    data: Partial<ItineraryItem>
  ) => {
    return databases.updateDocument(DATABASE_ID, ITINERARY_ID, id, data)
  }
  
  export const deleteItineraryItem = async (id: string) => {
    return databases.deleteDocument(DATABASE_ID, ITINERARY_ID, id)
  }