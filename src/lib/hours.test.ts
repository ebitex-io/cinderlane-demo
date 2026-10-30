import { describe, expect, it } from 'vitest'
import { closesNextDay, describeRule, formatDays, formatTime, isOpenAt, type HoursRule } from './hours'

const MON_SAT: HoursRule = { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '16:00', closes: '02:00' }
const SUNDAY: HoursRule = { days: ['Sunday'], opens: '12:00', closes: '02:00', note: 'Sunday opens at noon' }
const RULES = [MON_SAT, SUNDAY]
const CHICAGO = 'America/Chicago'

describe('formatting', () => {
  it('writes times the way a person says them', () => {
    expect(formatTime('16:00')).toBe('4 PM')
    expect(formatTime('16:30')).toBe('4:30 PM')
    expect(formatTime('00:00')).toBe('12 AM')
    expect(formatTime('12:00')).toBe('12 PM')
    expect(formatTime('02:00:00'.slice(0, 5))).toBe('2 AM')
  })

  it('collapses a run of days and keeps week order', () => {
    expect(formatDays(MON_SAT.days)).toBe('Mon–Sat')
    expect(formatDays(['Saturday', 'Monday', 'Tuesday'])).toBe('Mon, Tue, Sat')
    expect(formatDays(['Monday', 'Wednesday', 'Friday'])).toBe('Mon, Wed, Fri')
    expect(formatDays(['Sunday'])).toBe('Sun')
    expect(formatDays(['Friday', 'Saturday', 'Sunday'])).toBe('Fri–Sun')
  })

  it('describes a rule', () => {
    expect(describeRule(MON_SAT)).toBe('Mon–Sat 4 PM – 2 AM')
    expect(describeRule(SUNDAY)).toBe('Sun 12 PM – 2 AM')
  })

  it('knows a closing time at or before the opening time is the next morning', () => {
    expect(closesNextDay(MON_SAT)).toBe(true)
    expect(closesNextDay({ opens: '09:00', closes: '17:00' })).toBe(false)
    expect(closesNextDay({ opens: '10:00', closes: '10:00' })).toBe(true)
  })
})

describe('open now, in the venue’s own time zone', () => {
  // 2026-10-30 is a Friday and Chicago is on daylight time (UTC-5) until 1 November.
  it('is open on a weekday evening and closed in the afternoon before opening', () => {
    expect(isOpenAt(RULES, new Date('2026-10-30T22:00:00Z'), CHICAGO)).toBe(true) // Fri 5 PM
    expect(isOpenAt(RULES, new Date('2026-10-30T19:00:00Z'), CHICAGO)).toBe(false) // Fri 2 PM
  })

  it('is still open after midnight from the previous night’s rule, and closed once it closes', () => {
    expect(isOpenAt(RULES, new Date('2026-10-31T06:00:00Z'), CHICAGO)).toBe(true) // Sat 1 AM, Friday's rule
    expect(isOpenAt(RULES, new Date('2026-10-31T07:30:00Z'), CHICAGO)).toBe(false) // Sat 2:30 AM
  })

  it('opens Sunday at noon, not at four', () => {
    expect(isOpenAt(RULES, new Date('2026-11-01T18:00:00Z'), CHICAGO)).toBe(true) // Sun 12 PM CST (daylight time ended that morning)
    expect(isOpenAt(RULES, new Date('2026-11-01T16:00:00Z'), CHICAGO)).toBe(false) // Sun 10 AM
  })

  it('judges the weekday in the venue’s zone, not the viewer’s', () => {
    // 03:00Z on Saturday is still Friday 10 PM in Chicago: open. In Tokyo (UTC+9) it is Saturday noon, where the same rules say closed (opens 4 PM).
    const instant = new Date('2026-10-31T03:00:00Z')
    expect(isOpenAt(RULES, instant, CHICAGO)).toBe(true)
    expect(isOpenAt(RULES, instant, 'Asia/Tokyo')).toBe(false)
  })

  it('has nothing open with no rules', () => {
    expect(isOpenAt([], new Date('2026-10-30T22:00:00Z'), CHICAGO)).toBe(false)
  })
})
