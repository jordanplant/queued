const BASE_URL = 'https://api.themeparks.wiki/v1'

// --- Types ---

export type LiveAttraction = {
  id: string
  name: string
  status: 'OPERATING' | 'DOWN' | 'CLOSED'
  waitTime: number | null
}

export type ShowType = 'SHOW' | 'CHARACTER_MEET'

export type LiveShow = {
  id: string
  name: string
  status: 'OPERATING' | 'DOWN' | 'CLOSED'
  showtimes: string[]
  showType: ShowType
}

export type LiveCharacterMeet = {
  id: string
  name: string
  status: 'OPERATING' | 'DOWN' | 'CLOSED'
  meetType: 'QUEUE' | 'SHOWTIME'
  waitTime: number | null
  showtimes: string[]
}

export type ParkHours = {
  date: string
  openingTime: string
  closingTime: string
  earlyEntry: { openingTime: string; closingTime: string } | null
  specialEvent: { description: string; openingTime: string; closingTime: string } | null
}

// --- Classification ---

/**
 * Determines whether a SHOW entity is a character meet or a regular show/parade.
 *
 * Rules by park type:
 * - HKDL / Shanghai: externalId starts with "char" = CHARACTER_MEET, "ent" = SHOW
 * - WDW / Disneyland (US) / EPCOT / DL Paris / Tokyo: name starts with "Meet " = CHARACTER_MEET
 * - Universal parks: no character meets, always SHOW
 * - DLP: no character meets visible in API, always SHOW
 */
function classifyShow(name: string, externalId: string): ShowType {
  if (externalId.includes('destination=hkdl') || externalId.includes('destination=shdr')) {
    const key = externalId.split(';')[0]
    return key.startsWith('char') ? 'CHARACTER_MEET' : 'SHOW'
  }

  if (name.startsWith('Meet ')) {
    return 'CHARACTER_MEET'
  }

  return 'SHOW'
}

// --- Helpers ---

/**
 * USJ API returns showtimes in UTC despite including a +09:00 offset.
 * All other parks return the correct local time in the string.
 * This function corrects USJ times by applying the offset to the raw hour.
 * Add other park externalId prefixes here if the same issue is found elsewhere.
 */
function normalizeShowtime(startTime: string, externalId: string): string {
  if (!externalId.startsWith('usj.')) return startTime

  const offsetMatch = startTime.match(/([+-])(\d{2}):(\d{2})$/)
  if (!offsetMatch) return startTime

  const sign = offsetMatch[1] === '+' ? 1 : -1
  const offsetHours = parseInt(offsetMatch[2], 10)
  const offsetMinutes = parseInt(offsetMatch[3], 10)

  const timePart = startTime.split('T')[1].replace(/[+-]\d{2}:\d{2}$/, '')
  const [hourStr, minuteStr] = timePart.split(':')

  let hour = parseInt(hourStr, 10) + sign * offsetHours
  let minute = parseInt(minuteStr, 10) + sign * offsetMinutes

  if (minute >= 60) { hour += 1; minute -= 60 }
  if (minute < 0) { hour -= 1; minute += 60 }
  hour = ((hour % 24) + 24) % 24

  const datePart = startTime.split('T')[0]
  const offset = offsetMatch[0]
  return `${datePart}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00${offset}`
}

function isParkTimeUpcoming(isoString: string, gracePeriodMs: number = 5 * 60 * 1000): boolean {
  const showTime = new Date(isoString).getTime()
  if (isNaN(showTime)) return true
  return showTime + gracePeriodMs > Date.now()
}

// --- Functions ---

export async function fetchLiveWaitTimes(entityId: string): Promise<LiveAttraction[]> {
  const response = await fetch(`${BASE_URL}/entity/${entityId}/live`)

  if (!response.ok) {
    throw new Error(`Failed to fetch wait times for ${entityId}`)
  }

  const data = await response.json()

  return data.liveData
    .filter((item: any) => item.entityType === 'ATTRACTION')
    .map((item: any) => ({
      id: item.id,
      name: item.name,
      status: item.status,
      waitTime: item.queue?.STANDBY?.waitTime ?? null,
    }))
    .sort((a: LiveAttraction, b: LiveAttraction) => {
      if (a.status === 'OPERATING' && b.status !== 'OPERATING') return -1
      if (a.status !== 'OPERATING' && b.status === 'OPERATING') return 1
      return (b.waitTime ?? -1) - (a.waitTime ?? -1)
    })
}

export async function fetchLiveShows(entityId: string): Promise<LiveShow[]> {
  const response = await fetch(`${BASE_URL}/entity/${entityId}/live`)

  if (!response.ok) {
    throw new Error(`Failed to fetch shows for ${entityId}`)
  }

  const data = await response.json()

  return data.liveData
    .filter((item: any) =>
      item.entityType === 'SHOW' &&
      item.status === 'OPERATING' &&
      classifyShow(item.name, item.externalId ?? '') !== 'CHARACTER_MEET' &&
      (item.showtimes ?? []).length > 0
    )
    .map((item: any) => ({
      id: item.id,
      name: item.name,
      status: item.status,
      showtimes: (item.showtimes ?? [])
        .map((s: any) => normalizeShowtime(s.startTime, item.externalId ?? ''))
        .filter((time: string) => isParkTimeUpcoming(time)),
      showType: classifyShow(item.name, item.externalId ?? ''),
    }))
    .filter((show: LiveShow) =>
      !show.name.startsWith('Reserved viewing area')
    )
    .sort((a: LiveShow, b: LiveShow) => {
      if (a.showtimes.length === 0 && b.showtimes.length > 0) return 1
      if (a.showtimes.length > 0 && b.showtimes.length === 0) return -1
      if (a.showtimes.length === 0 && b.showtimes.length === 0) return 0
      return a.showtimes[0].localeCompare(b.showtimes[0])
    })
}

export async function fetchParkSchedule(entityId: string): Promise<ParkHours[]> {
  const response = await fetch(`${BASE_URL}/entity/${entityId}/schedule`)

  if (!response.ok) {
    throw new Error(`Failed to fetch schedule for ${entityId}`)
  }

  const data = await response.json()

  const byDate: Record<string, any[]> = {}
  for (const entry of data.schedule) {
    if (!byDate[entry.date]) byDate[entry.date] = []
    byDate[entry.date].push(entry)
  }

  return Object.entries(byDate).map(([date, entries]) => {
    const operating = entries.find((e) => e.type === 'OPERATING')
    const earlyEntry = entries.find(
      (e) => e.type === 'TICKETED_EVENT' && e.description === 'Early Entry'
    )
    const specialEvent = entries.find(
      (e) => e.type === 'TICKETED_EVENT' && e.description !== 'Early Entry'
    )

    return {
      date,
      openingTime: operating?.openingTime ?? '',
      closingTime: operating?.closingTime ?? '',
      earlyEntry: earlyEntry
        ? { openingTime: earlyEntry.openingTime, closingTime: earlyEntry.closingTime }
        : null,
      specialEvent: specialEvent
        ? {
            description: specialEvent.description,
            openingTime: specialEvent.openingTime,
            closingTime: specialEvent.closingTime,
          }
        : null,
    }
  })
}

export async function fetchLiveCharacterMeets(entityId: string): Promise<LiveCharacterMeet[]> {
  const response = await fetch(`${BASE_URL}/entity/${entityId}/live`)

  if (!response.ok) {
    throw new Error(`Failed to fetch character meets for ${entityId}`)
  }

  const data = await response.json()

  const fromAttractions: LiveCharacterMeet[] = data.liveData
    .filter((item: any) => item.entityType === 'ATTRACTION')
    .filter((item: any) => classifyShow(item.name, item.externalId ?? '') === 'CHARACTER_MEET')
    .map((item: any) => {
      console.log('CHARACTER MEET (attraction):', item.name, '| externalId:', item.externalId)
      return {
        id: item.id,
        name: item.name,
        status: item.status,
        meetType: 'QUEUE' as const,
        waitTime: item.queue?.STANDBY?.waitTime ?? null,
        showtimes: [],
      }
    })

  const fromShows: LiveCharacterMeet[] = data.liveData
    .filter((item: any) => item.entityType === 'SHOW' && item.status === 'OPERATING')
    .filter((item: any) => classifyShow(item.name, item.externalId ?? '') === 'CHARACTER_MEET')
    .map((item: any) => {
      const hasQueue = item.queue?.STANDBY?.waitTime !== undefined
      return {
        id: item.id,
        name: item.name,
        status: item.status,
        meetType: hasQueue ? 'QUEUE' as const : 'SHOWTIME' as const,
        waitTime: item.queue?.STANDBY?.waitTime ?? null,
        showtimes: hasQueue ? [] : (item.showtimes ?? [])
          .map((s: any) => normalizeShowtime(s.startTime, item.externalId ?? ''))
          .filter((time: string) => isParkTimeUpcoming(time)),
      }
    })

  return [...fromAttractions, ...fromShows].sort((a, b) => {
    if (a.status === 'OPERATING' && b.status !== 'OPERATING') return -1
    if (a.status !== 'OPERATING' && b.status === 'OPERATING') return 1
    return 0
  })
}