import HeroSection        from './sections/HeroSection'
import TrustBarSection    from './sections/TrustBarSection'
import ServicesGridSection from './sections/ServicesGridSection'
import AboutStripSection  from './sections/AboutStripSection'
import WhyChooseUsSection from './sections/WhyChooseUsSection'
import CtaBannerSection   from './sections/CtaBannerSection'

interface SectionConfig { id?: string; type: string; [key: string]: any }
interface Props { sections: SectionConfig[] }

export default function SectionRenderer({ sections }: Props) {
  return (
    <>
      {sections.map((section, i) => {
        const key = section.id || `${section.type}-${i}`
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = section as any
        switch (section.type) {
          case 'hero':            return <HeroSection        key={key} section={s} />
          case 'trust-bar':       return <TrustBarSection    key={key} section={s} />
          case 'services-grid':   return <ServicesGridSection key={key} section={s} />
          case 'about-strip':     return <AboutStripSection  key={key} section={s} />
          case 'why-choose-us':   return <WhyChooseUsSection key={key} section={s} />
          case 'cta-banner':      return <CtaBannerSection   key={key} section={s} />
          default:                return null
        }
      })}
    </>
  )
}
