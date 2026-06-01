import { useAuth } from '@/context/AuthContext'
import {
  ItineraryItem,
  createItineraryItem,
  deleteItineraryItem,
  getItineraryItems,
  updateItineraryItem,
} from '@/services/itinerary'
import { Trip, getTrips } from '@/services/trips'
import { useEffect, useRef, useState } from 'react'

export type GroupedItinerary = {
  [date: string]: ItineraryItem[]
}

export const useItinerary = () => {
  const { user } = useAuth()
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null)
  const [items, setItems] = useState<ItineraryItem[]>([])
  const itemsRef = useRef<ItineraryItem[]>([])
  const [grouped, setGrouped] = useState<GroupedItinerary>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const findActiveTrip = (trips: Trip[]): Trip | null => {
    const active = trips.find(t => t.status === 'active')
    if (active) return active

    const upcoming = trips
      .filter(t => t.status === 'upcoming')
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

    return upcoming[0] ?? null
  }

  const groupByDate = (items: ItineraryItem[]): GroupedItinerary => {
    return items.reduce((acc, item) => {
      if (!acc[item.date]) acc[item.date] = []
      acc[item.date].push(item)
      return acc
    }, {} as GroupedItinerary)
  }

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const trips = await getTrips(user.$id)
        const trip = findActiveTrip(trips)
        setActiveTrip(trip)

        if (trip) {
          const data = await getItineraryItems(trip.$id)
          itemsRef.current = data
          setItems(data)
          setGrouped(groupByDate(data))
        }
      } catch (e) {
        setError('Failed to load itinerary')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const addItem = async (item: Omit<ItineraryItem, '$id' | '$createdAt'>) => {
    const created = await createItineraryItem(item)
    const newItem = created as unknown as ItineraryItem
    const updated = [...itemsRef.current, newItem].sort((a, b) => a.time - b.time)
    itemsRef.current = updated
    setItems(updated)
    setGrouped(groupByDate(updated))
  }

  const updateItem = async (id: string, data: Partial<ItineraryItem>) => {
    await updateItineraryItem(id, data)
    const updated = itemsRef.current
      .map(i => i.$id === id ? { ...i, ...data } : i)
      .sort((a, b) => a.time - b.time)
    itemsRef.current = updated
    setItems(updated)
    setGrouped(groupByDate(updated))
  }

  const removeItem = async (id: string) => {
    await deleteItineraryItem(id)
    const updated = itemsRef.current.filter(i => i.$id !== id)
    itemsRef.current = updated
    setItems(updated)
    setGrouped(groupByDate(updated))
  }

  const updateAndAddItem = async (
    updateId: string,
    updateData: Partial<ItineraryItem>,
    newItem: Omit<ItineraryItem, '$id' | '$createdAt'>
  ) => {
    await updateItineraryItem(updateId, updateData)
    const created = await createItineraryItem(newItem)
    const createdItem = created as unknown as ItineraryItem

    const updated = [
      ...itemsRef.current.map(i => i.$id === updateId ? { ...i, ...updateData } : i),
      createdItem,
    ].sort((a, b) => a.time - b.time)

    itemsRef.current = updated
    setItems(updated)
    setGrouped(groupByDate(updated))
  }

  const removeAndAddItem = async (
    removeId: string,
    newItem: Omit<ItineraryItem, '$id' | '$createdAt'>
  ) => {
    await deleteItineraryItem(removeId)
    const created = await createItineraryItem(newItem)
    const createdItem = created as unknown as ItineraryItem

    const updated = [
      ...itemsRef.current.filter(i => i.$id !== removeId),
      createdItem,
    ].sort((a, b) => a.time - b.time)

    itemsRef.current = updated
    setItems(updated)
    setGrouped(groupByDate(updated))
  }

  return {
    activeTrip,
    grouped,
    loading,
    error,
    addItem,
    updateItem,
    updateAndAddItem,
    removeAndAddItem,
    removeItem,
  }
}