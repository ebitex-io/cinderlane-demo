/**
 * Opening hours, from the `opening-hours-rule` Contract: which days, and a time of day to open and close. A time of day has no time zone and no date,
 * so everything here works on the venue's own wall clock, and the venue's IANA zone (its own field) is only used to ask "what time is it there".
 */
export interface HoursRule {
  days: string[]
  opens: string
  closes: string
  note?: string
}

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

const minutes = (time: string): number => {
  const [hours, mins] = time.split(':').map(Number)
  return hours! * 60 + mins!
}

/** `16:00` is `4 PM`, `16:30` is `4:30 PM`, `00:00` is `12 AM`. */
export function formatTime(time: string): string {
  const [hours, mins] = time.split(':').map(Number)
  const suffix = hours! < 12 ? 'AM' : 'PM'
  const twelve = hours! % 12 === 0 ? 12 : hours! % 12
  return mins ? `${twelve}:${String(mins).padStart(2, '0')} ${suffix}` : `${twelve} ${suffix}`
}

/** Days in week order, runs of three or more collapsed: Monday to Saturday is `Mon–Sat`, Monday and Wednesday is `Mon, Wed`. */
export function formatDays(days: readonly string[]): string {
  const indexes = [...new Set(days.map((d) => WEEK.indexOf(d as (typeof WEEK)[number])).filter((i) => i >= 0))].sort((a, b) => a - b)
  const runs: number[][] = []
  for (const index of indexes) {
    const last = runs.at(-1)
    if (last && last.at(-1) === index - 1) last.push(index)
    else runs.push([index])
  }
  const short = (i: number) => WEEK[i]!.slice(0, 3)
  return runs.map((run) => (run.length >= 3 ? `${short(run[0]!)}–${short(run.at(-1)!)}` : run.map(short).join(', '))).join(', ')
}

/** A closing time at or before the opening time belongs to the next morning: `16:00` to `02:00` closes after midnight. */
export const closesNextDay = (rule: Pick<HoursRule, 'opens' | 'closes'>): boolean => minutes(rule.closes) <= minutes(rule.opens)

export const describeRule = (rule: HoursRule): string => `${formatDays(rule.days)} ${formatTime(rule.opens)} – ${formatTime(rule.closes)}`

/** Whether the venue is open at an instant, by the clock and the weekday in the venue's own zone, including the tail of yesterday's rule that runs past midnight. */
export function isOpenAt(rules: readonly HoursRule[], when: Date, timeZone: string): boolean {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(when)
  const weekday = parts.find((p) => p.type === 'weekday')!.value
  const now = minutes(`${parts.find((p) => p.type === 'hour')!.value}:${parts.find((p) => p.type === 'minute')!.value}`)
  const yesterday = WEEK[(WEEK.indexOf(weekday as (typeof WEEK)[number]) + 6) % 7]!
  return rules.some((rule) => {
    const opens = minutes(rule.opens)
    const closes = minutes(rule.closes)
    const today = rule.days.includes(weekday) && (closesNextDay(rule) ? now >= opens : now >= opens && now < closes)
    const tail = rule.days.includes(yesterday) && closesNextDay(rule) && now < closes
    return today || tail
  })
}
