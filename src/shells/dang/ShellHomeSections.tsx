import HeroSection from './HeroSection'
import FeatureStrip from './FeatureStrip'
import ExpertSection from './ExpertSection'
import ServicesSection from './ServicesSection'
import WhyChooseUs from './WhyChooseUs'
import MidPageVideo from './MidPageVideo'
import PestExterminationSection from './PestExterminationSection'
import TestimonialsSection from './TestimonialsSection'
import CTASection from './CTASection'
import { usePageContent } from '../../hooks/usePageContent'

export default function ShellHomeSections() {
  const { content } = usePageContent('home')

  return (
    <>
      <HeroSection
        heroTitle={content?.title ?? undefined}
        heroIntro={content?.intro ?? undefined}
      />
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
