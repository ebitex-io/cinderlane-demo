import { Frame, type EbitexRendererProps } from '@ebitex/starter-kit-react/react'
import { describeRule, isOpenAt, type HoursRule } from '../lib/hours'

const text = (v: unknown) => (typeof v === 'string' && v.length > 0 ? v : null)

/** The delivered `opening-hours` list: each entry is a rule's own Contract and its content. Anything not shaped like a rule is skipped, never thrown on. */
function rulesOf(value: unknown): HoursRule[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    const rule = (entry as { content?: Record<string, unknown> } | null)?.content
    if (!rule || !Array.isArray(rule.days) || !text(rule.opens) || !text(rule.closes)) return []
    return [{ days: rule.days.filter((d): d is string => typeof d === 'string'), opens: rule.opens as string, closes: rule.closes as string, note: text(rule.note) ?? undefined }]
  })
}

/**
 * Draws the organization's own `venue` Contract through its own Template (`venue-template`). Hours, address and phone are fields an editor changes in Content;
 * nothing about the venue is written in code. Width, background, appearance and anchor are the Template's settings (it extends the kit's section settings), and drawing
 * inside `Frame` is what applies them, so an editor can place the same venue Component on another page with a different width or appearance.
 */
export function VenueSection({ component, settings }: EbitexRendererProps) {
  const content = component.content
  const rules = rulesOf(content['opening-hours'])
  const address = text(content.address)
  const phone = text(content.phone)
  const zone = text(content['time-zone'])
  const open = zone && rules.length > 0 ? isOpenAt(rules, new Date(), zone) : null
  return (
    <Frame settings={settings}>
      <section className="mx-auto max-w-3xl rounded-2xl border border-[var(--ebitex-accent)] p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-3xl font-bold">Visit us</h2>
          {open === null ? null : (
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${open ? 'bg-[var(--ebitex-accent)] text-[var(--ebitex-accent-ink)]' : 'border border-current opacity-70'}`}
            >
              {open ? 'Open now' : 'Closed now'}
            </span>
          )}
        </div>
        {address ? <p className="mt-3 opacity-80">{address}</p> : null}
        {rules.length > 0 ? (
          <ul className="mt-4 space-y-1">
            {rules.map((rule, i) => (
              <li key={i}>
                <span className="font-medium">{describeRule(rule)}</span>
                {rule.note ? <span className="ml-2 text-sm opacity-70">{rule.note}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
        {phone ? (
          <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="mt-6 inline-block rounded-full bg-[var(--ebitex-accent)] px-6 py-3 font-semibold text-[var(--ebitex-accent-ink)]">
            Call {phone}
          </a>
        ) : null}
      </section>
    </Frame>
  )
}
