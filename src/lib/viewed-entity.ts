const KEY = 'ars_viewed_entity'

export interface ViewedEntity {
  id: string
  name: string
}

export function getViewedEntity(): ViewedEntity | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setViewedEntity(entity: ViewedEntity) {
  sessionStorage.setItem(KEY, JSON.stringify(entity))
}

export function clearViewedEntity() {
  sessionStorage.removeItem(KEY)
}
