import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

const userQuery = (name, uid) => query(collection(db, name), where('uid', '==', uid))

export async function listUserData(name, uid) {
  const snapshot = await getDocs(userQuery(name, uid))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

export async function createUserData(name, uid, data) {
  const reference = await addDoc(collection(db, name), { ...data, uid })
  return { id: reference.id, ...data, uid }
}

export function updateUserData(name, id, data) {
  return updateDoc(doc(db, name, id), data)
}

export function deleteUserData(name, id) {
  return deleteDoc(doc(db, name, id))
}
