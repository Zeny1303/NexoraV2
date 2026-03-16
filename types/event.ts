export interface EventMarker {
  _id?: string
  id?: string
  title: string

  latitude?: number
  longitude?: number

  coordinates?: {
    lat: number
    lng: number
  }

  category?: string | {
    _id: string
    name: string
  }
}