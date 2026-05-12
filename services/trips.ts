import { databases } from '@/lib/appwrite'
import { ID, Query } from 'react-native-appwrite'

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!
const TRIPS_ID = process.env.EXPO_PUBLIC_APPWRITE_TRIPS_COLLECTION_ID!

export type Trip = {
  $id: string
  name: string
  startDate: string
  endDate: string
  parks: string[]
  status: 'upcoming' | 'active' | 'completed'
  userId: string
  $createdAt: string
}

export const getTrips = async (userId: string) => {
  const response = await databases.listDocuments(DATABASE_ID, TRIPS_ID, [
    Query.equal('userId', userId),
    Query.orderDesc('$createdAt'),
  ])
  return response.documents as unknown as Trip[]
}

export const createTrip = async (trip: Omit<Trip, '$id' | '$createdAt'>) => {
  return databases.createDocument(DATABASE_ID, TRIPS_ID, ID.unique(), trip)
}

export const updateTrip = async (id: string, data: Partial<Trip>) => {
  return databases.updateDocument(DATABASE_ID, TRIPS_ID, id, data)
}

export const deleteTrip = async (id: string) => {
  return databases.deleteDocument(DATABASE_ID, TRIPS_ID, id)
}