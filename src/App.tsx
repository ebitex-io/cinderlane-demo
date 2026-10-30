import { createContentClient } from '@ebitex/content-sdk'
import { ContentProvider, Experience, PreviewBridge } from '@ebitex/content-sdk/react'
import { EbitexMarkdown, EbitexProvider, ebitexRenderers } from '@ebitex/starter-kit-react/react'
import { VenueSection } from './components/VenueSection'

const content = createContentClient({ apiKey: import.meta.env.VITE_CONTENT_DELIVERY_KEY })
export const renderers = { ...ebitexRenderers(), 'venue-template': VenueSection }

export default function App() {
  return (
    <EbitexProvider client={content}>
      <ContentProvider client={content} renderers={renderers} markdown={EbitexMarkdown}>
        <PreviewBridge origins={['https://content.ebitex.io']} path={window.location.pathname}>
          <Experience path={window.location.pathname} />
        </PreviewBridge>
      </ContentProvider>
    </EbitexProvider>
  )
}
