import { databases } from '@/lib/appwrite'
import { ID, Query } from 'react-native-appwrite'

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!
const COLLECTION_ID = 'favourites'

export type FavouriteEntity = {
  $id: string
  userId: string
  parkId: string
  entityId: string
  entityType: 'ATTRACTION' | 'SHOW' | 'CHARACTER_MEET'
  name: string
}

export async function getFavourites(userId: string, parkId: string): Promise<FavouriteEntity[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.equal('userId', userId),
    Query.equal('parkId', parkId),
  ])
  return res.documents as unknown as FavouriteEntity[]
}

export async function addFavourite(
  userId: string,
  parkId: string,
  entityId: string,
  entityType: FavouriteEntity['entityType'],
  name: string
): Promise<FavouriteEntity> {
  const res = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
    userId,
    parkId,
    entityId,
    entityType,
    name,
  })
  return res as unknown as FavouriteEntity
}

export async function removeFavourite(documentId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, documentId)
}