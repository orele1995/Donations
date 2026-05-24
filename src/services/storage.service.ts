import { ref, uploadBytes, getDownloadURL, type FirebaseStorage } from 'firebase/storage'

export async function uploadReceipt(
  storage: FirebaseStorage,
  householdId: string,
  reportId: string,
  donationId: string,
  file: File,
): Promise<string> {
  const path = `receipts/${householdId}/${reportId}/${donationId}-${Date.now()}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
