import { databases } from '@/lib/appwrite'
import { ID, Query } from 'react-native-appwrite'

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!
const SNACKS_ID = process.env.EXPO_PUBLIC_APPWRITE_SNACKS_COLLECTION_ID!

export type Snack = {
  $id: string
  userId: string
  itemTitle: string
  itemPrice: number | null
  restaurantName: string | null
  restaurantLocation: string | null  // park
  subLocation: string | null         // land
  itemDescription: string | null
  completed: boolean
  rating: number | null              // 1-5
  completedAt: string | null         // ISO date string
  $createdAt: string
}

export const getSnacks = async (userId: string) => {
  const response = await databases.listDocuments(DATABASE_ID, SNACKS_ID, [
    Query.equal('userId', userId),
    Query.orderDesc('$createdAt'),
  ])
  return response.documents as unknown as Snack[]
}

export const createSnack = async (snack: Omit<Snack, '$id' | '$createdAt'>) => {
  return databases.createDocument(DATABASE_ID, SNACKS_ID, ID.unique(), snack)
}

export const updateSnack = async (id: string, data: Partial<Snack>) => {
  return databases.updateDocument(DATABASE_ID, SNACKS_ID, id, data)
}

export const deleteSnack = async (id: string) => {
  return databases.deleteDocument(DATABASE_ID, SNACKS_ID, id)
}