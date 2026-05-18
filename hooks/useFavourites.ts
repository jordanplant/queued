import {
    FavouriteEntity,
    addFavourite,
    getFavourites,
    removeFavourite,
} from '@/services/favourites'
import { useCallback, useEffect, useState } from 'react'

export function useFavourites(userId: string | undefined, parkId: string | undefined) {
  const [favourites, setFavourites] = useState<FavouriteEntity[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch favourites whenever the user or park changes
  useEffect(() => {
    if (!userId || !parkId) return
    setLoading(true)
    getFavourites(userId, parkId)
      .then(setFavourites)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [userId, parkId])

  // Returns the favourite document if this entity is favourited, otherwise undefined
  const getFavourite = useCallback(
    (entityId: string) => favourites.find(f => f.entityId === entityId),
    [favourites]
  )

  const isFavourite = useCallback(
    (entityId: string) => !!getFavourite(entityId),
    [getFavourite]
  )

  const toggleFavourite = useCallback(
    async (
      entityId: string,
      entityType: FavouriteEntity['entityType'],
      name: string
    ) => {
      if (!userId || !parkId) return
      const existing = getFavourite(entityId)

      if (existing) {
        // Optimistic remove — update UI immediately, then sync
        setFavourites(prev => prev.filter(f => f.$id !== existing.$id))
        await removeFavourite(existing.$id)
      } else {
        // Optimistic add — update UI immediately, then sync
        const newFav = await addFavourite(userId, parkId, entityId, entityType, name)
        setFavourites(prev => [...prev, newFav])
      }
    },
    [userId, parkId, getFavourite]
  )

  return { favourites, loading, isFavourite, toggleFavourite }
}