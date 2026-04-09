import HeroSection from './HeroSection'
import FeatureStrip from './FeatureStrip'
import ExpertSection from './ExpertSection'
import ServicesSection from './ServicesSection'
import WhyChooseUs from './WhyChooseUs'
import MidPageVideo from './MidPageVideo'
import PestExterminationSection from './PestExterminationSection'
import TestimonialsSection from './TestimonialsSection'
import CTASection from './CTASection'
import { useSiteConfig } from './hooks/useSiteConfig'

export default function ShellHomeSections() {
  const { heroVideoUrl, heroVideoType, heroVideoStart, heroVideoEnd } = useSiteConfig()
  return (
    <>
      <HeroSection dynamicVideoUrl={heroVideoUrl} dynamicVideoType={heroVideoType} videoStart={heroVideoStart} videoEnd={heroVideoEnd} />
      <FeatureStrip />
      <ExpertSection />
      <ServicesSection />
      <WhyChooseUs />
      <MidPageVideo />
      <PestExterminationSection />
      <TestimonialsSection />
      <CTASection />
    </>
  )
}
