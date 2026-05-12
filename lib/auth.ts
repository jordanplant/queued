import { ID } from 'react-native-appwrite'
import { account } from './appwrite'

export const register = async (email: string, password: string, name: string) => {
  await account.create(ID.unique(), email, password, name)
  return login(email, password)
}

export const login = async (email: string, password: string) => {
  return account.createEmailPasswordSession(email, password)
}

export const logout = async () => {
  return account.deleteSession('current')
}

export const getCurrentUser = async () => {
  return account.get()
}