// Address and hours parsers for JSON-LD generation.
// Return undefined on any parse failure — callers omit the sub-block entirely.

export interface OpeningHoursSpecification {
  '@type': 'OpeningHoursSpecification'
  dayOfWeek: string[]
  opens: string
  closes: string
}

export interface PostalAddressComponents {
  streetAddress: string
  addressLocality: string
  addressRegion: string
  postalCode: string
}

const DAY_MAP: Record<string, string> = {
  monday: 'Monday', mon: 'Monday', mo: 'Monday',
  tuesday: 'Tuesday', tue: 'Tuesday', tu: 'Tuesday',
  wednesday: 'Wednesday', wed: 'Wednesday', we: 'Wednesday',
  thursday: 'Thursday', thu: 'Thursday', th: 'Thursday',
  friday: 'Friday', fri: 'Friday', fr: 'Friday',
  saturday: 'Saturday', sat: 'Saturday', sa: 'Saturday',
  sunday: 'Sunday', sun: 'Sunday', su: 'Sunday',
}
const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function parseTime(t: string): string | undefined {
  const s = t.trim().toLowerCase()
  const m12 = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/)
  if (m12) {
    let h = parseInt(m12[1])
    const min = m12[2] ? parseInt(m12[2]) : 0
    if (m12[3] === 'pm' && h !== 12) h += 12
    if (m12[3] === 'am' && h === 12) h = 0
    if (h < 0 || h > 23 || min < 0 || min > 59) return undefined
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  }
  const m24 = s.match(/^(\d{1,2}):(\d{2})$/)
  if (m24) {
    const h = parseInt(m24[1])
    const min = parseInt(m24[2])
    if (h < 0 || h > 23 || min < 0 || min > 59) return undefined
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  }
  return undefined
}

function parseDayRange(d: string): string[] | undefined {
  const s = d.trim().toLowerCase()
  const throughMatch = s.match(/^(\w+)\s+through\s+(\w+)$/)
  const rangeMatch = s.match(/^(\w+)\s*[-–—]\s*(\w+)$/)
  const m = throughMatch || rangeMatch
  if (m) {
    const start = DAY_MAP[m[1]]
    const end = DAY_MAP[m[2]]
    if (!start || !end) return undefined
    const si = DAY_ORDER.indexOf(start)
    const ei = DAY_ORDER.indexOf(end)
    if (si < 0 || ei < 0 || si > ei) return undefined
    return DAY_ORDER.slice(si, ei + 1)
  }
  const single = DAY_MAP[s]
  return single ? [single] : undefined
}

export function parseHours(raw: string): OpeningHoursSpecification[] | undefined {
  if (!raw?.trim()) {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn('[seoSchema.parseHours] empty input:', raw)
    }
    return undefined
  }
  const segments = raw.split(/[,|;]/).map(s => s.trim()).filter(Boolean)
  const result: OpeningHoursSpecification[] = []

  for (const seg of segments) {
    // Split segment into day-part and time-part
    // e.g. "Mon-Fri 7am-7pm" or "Monday through Friday 8:00 AM to 5:00 PM"
    const timeRangeMatch = seg.match(/(.+?)\s+([\d:]+\s*(?:am|pm)?)\s*(?:to|-|–|—)\s*([\d:]+\s*(?:am|pm)?)\s*$/i)
    if (!timeRangeMatch) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.warn('[seoSchema.parseHours] skipping unparseable segment:', seg)
      }
      continue
    }
    const dayPart = timeRangeMatch[1].trim()
    const openRaw = timeRangeMatch[2].trim()
    const closeRaw = timeRangeMatch[3].trim()

    const days = parseDayRange(dayPart)
    const opens = parseTime(openRaw)
    const closes = parseTime(closeRaw)

    if (!days || !opens || !closes) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.warn('[seoSchema.parseHours] skipping unparseable segment:', seg)
      }
      continue
    }
    result.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: days, opens, closes })
  }

  if (result.length === 0) {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn('[seoSchema.parseHours] all segments failed:', raw)
    }
    return undefined
  }
  return result
}

const US_STATES = new Set(['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'])

export function parseAddress(raw: string): PostalAddressComponents | undefined {
  if (!raw?.trim()) {
    console.warn('[seo2] parseAddress returned undefined:', raw)
    return undefined
  }
  const parts = raw.split(',').map(p => p.trim()).filter(Boolean)
  if (parts.length < 2) {
    console.warn('[seo2] parseAddress returned undefined:', raw)
    return undefined
  }

  // Find ZIP in last 3 parts
  let zip = ''
  let zipIdx = -1
  for (let i = parts.length - 1; i >= Math.max(0, parts.length - 3); i--) {
    const m = parts[i].match(/\b(\d{5}(?:-\d{4})?)\b/)
    if (m) { zip = m[1]; zipIdx = i; break }
  }
  if (!zip) {
    console.warn('[seo2] parseAddress returned undefined:', raw)
    return undefined
  }

  // State may be in same part as ZIP ("TX 75206") or the part just before
  const zipPart = parts[zipIdx]
  const remainder = zipPart.replace(zip, '').trim()
  const stateInPart = remainder.match(/^([A-Z]{2})$/)
  let state = ''
  let stateIdx = zipIdx

  if (stateInPart && US_STATES.has(stateInPart[1])) {
    state = stateInPart[1]
  } else if (zipIdx > 0) {
    const prev = parts[zipIdx - 1]
    if (US_STATES.has(prev.toUpperCase())) {
      state = prev.toUpperCase()
      stateIdx = zipIdx - 1
    }
  }

  const cityIdx = stateIdx - 1
  if (cityIdx < 0) {
    console.warn('[seo2] parseAddress returned undefined:', raw)
    return undefined
  }

  const city = parts[cityIdx]
  const streetAddress = parts.slice(0, cityIdx).join(', ')
  if (!streetAddress) {
    console.warn('[seo2] parseAddress returned undefined:', raw)
    return undefined
  }

  return { streetAddress, addressLocality: city, addressRegion: state, postalCode: zip }
}
