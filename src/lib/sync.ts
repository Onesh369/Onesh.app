import type { AppData } from '../types'
import { putData } from './api'
import { saveData } from './storage'

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error'

let latest: AppData | null = null
let timer = 0
let chain = Promise.resolve()
const listeners = new Set<(status: SyncStatus) => void>()
let status: SyncStatus = 'idle'

function emit(next: SyncStatus) {
  status = next
  listeners.forEach((listener) => listener(next))
}

export function getSyncStatus() {
  return status
}

export function subscribeSync(listener: (status: SyncStatus) => void) {
  listeners.add(listener)
  listener(status)
  return () => {
    listeners.delete(listener)
  }
}

export function queueCloudSave(data: AppData) {
  latest = data
  saveData(data)
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    void flushCloudSave()
  }, 400)
}

export function flushCloudSave() {
  window.clearTimeout(timer)
  const data = latest
  if (!data) return chain
  chain = chain.then(async () => {
    const payload = latest
    if (!payload) return
    emit('saving')
    try {
      await putData(payload)
      emit('saved')
    } catch {
      emit('error')
    }
  })
  return chain
}
