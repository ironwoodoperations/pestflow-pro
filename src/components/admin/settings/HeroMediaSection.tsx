import BrandingHeroMedia from './BrandingHeroMedia'
import PageHelpBanner from '../PageHelpBanner'

export default function HeroMediaSection() {
  return (
    <div className="space-y-4">
      <PageHelpBanner tab="settings" title="🖼 Master Hero Image"
        body="Set the master image or video shown at the top of your homepage. Image mode shows a static photo; Video mode lets you link a YouTube video or upload your own." />
      <BrandingHeroMedia />
    </div>
  )
}
