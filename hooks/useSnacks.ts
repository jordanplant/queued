import { useAuth } from '@/context/AuthContext'
import {
  Snack,
  createSnack,
  deleteSnack,
  getSnacks,
  updateSnack,
} from '@/services/snacks'
import { useEffect, useState } from 'react'

export function useSnacks() {
  const { user } = useAuth()
  const [snacks, setSnacks] = useState<Snack[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchSnacks()
  }, [user])

  const fetchSnacks = async () => {
    try {
      const data = await getSnacks(user!.$id)
      setSnacks(data)
    } catch (error) {
      console.error('Failed to fetch snacks:', error)
    } finally {
      setLoading(false)
    }
  }

  const addSnack = async (item: {
    itemTitle: string
    itemPrice: number | null
    restaurantName: string | null
    restaurantLocation: string | null
    subLocation: string | null
    itemDescription: string | null
  }) => {
    if (!user) return

    const newSnack: Omit<Snack, '$id' | '$createdAt'> = {
      ...item,
      userId: user.$id,
      completed: false,
      rating: null,
      completedAt: null,
    }

    const tempId = `temp-${Date.now()}`
    const optimistic = { ...newSnack, $id: tempId, $createdAt: new Date().toISOString() }
    setSnacks(prev => [optimistic, ...prev])

    try {
      const created = await createSnack(newSnack)
      setSnacks(prev => prev.map(s => s.$id === tempId ? created as unknown as Snack : s))
    } catch (error) {
      console.error('Failed to add snack:', error)
      setSnacks(prev => prev.filter(s => s.$id !== tempId))
    }
  }

  const updateSnackDetails = async (id: string, data: {
    itemTitle: string
    itemPrice: number | null
    restaurantName: string | null
    restaurantLocation: string | null
  }) => {
    setSnacks(prev => prev.map(s => s.$id === id ? { ...s, ...data } : s))
  
    try {
      await updateSnack(id, data)
    } catch (error) {
      console.error('Failed to update snack:', error)
      fetchSnacks()
    }
  }

  const markEaten = async (id: string, rating: number | null) => {
    const completedAt = new Date().toISOString()

    setSnacks(prev => prev.map(s =>
      s.$id === id ? { ...s, completed: true, rating, completedAt } : s
    ))

    try {
      await updateSnack(id, { completed: true, rating, completedAt })
    } catch (error) {
      console.error('Failed to mark snack as eaten:', error)
      setSnacks(prev => prev.map(s =>
        s.$id === id ? { ...s, completed: false, rating: null, completedAt: null } : s
      ))
    }
  }

  const unmarkEaten = async (id: string) => {
    setSnacks(prev => prev.map(s =>
      s.$id === id ? { ...s, completed: false, rating: null, completedAt: null } : s
    ))

    try {
      await updateSnack(id, { completed: false, rating: null, completedAt: null })
    } catch (error) {
      console.error('Failed to unmark snack:', error)
      fetchSnacks()
    }
  }

  const removeSnack = async (id: string) => {
    setSnacks(prev => prev.filter(s => s.$id !== id))

    try {
      await deleteSnack(id)
    } catch (error) {
      console.error('Failed to delete snack:', error)
      fetchSnacks()
    }
  }

  const rateSnack = async (id: string, rating: number) => {
    setSnacks(prev => prev.map(s =>
      s.$id === id ? { ...s, rating } : s
    ))

    try {
      await updateSnack(id, { rating })
    } catch (error) {
      console.error('Failed to rate snack:', error)
      fetchSnacks()
    }
  }

  return {
    snacks,
    loading,
    addSnack,
    updateSnackDetails,
    markEaten,
    unmarkEaten,
    removeSnack,
    rateSnack,
  }
}