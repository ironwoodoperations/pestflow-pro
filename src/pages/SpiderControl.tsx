import PestPageTemplate from '../components/PestPageTemplate'
import { PEST_VIDEOS } from '../data/pestVideos'

export default function SpiderControl() {
  return (
    <PestPageTemplate
      pageSlug="spider-control"
      introImage="https://images.pexels.com/photos/8733285/pexels-photo-8733285.jpeg?w=800"
      videoUrl={PEST_VIDEOS.spider[0]?.url}
      heroTitle="Spider Control in East Texas"
      heroHighlight="Spider Control"
      heroSubtitle="Fast, effective spider elimination — guaranteed."
      introHeading="Expert Spider Control You Can Trust"
      introP1="East Texas has multiple spider species including Black Widows and Brown Recluses that pose real risks to your family. These dangerous spiders hide in dark corners, closets, garages, and attics — often going unnoticed until someone gets bitten."
      introP2="Our licensed technicians identify entry points, treat harborage areas, and apply targeted residual treatments that eliminate spiders on contact and keep working for weeks."
      introP3="We offer interior and exterior spider control with quarterly maintenance plans to keep spiders out year-round. Whether you have a few cobwebs or a full infestation, we have the solution."
      steps={[
        { title: 'Inspect', desc: 'Thorough inspection of interior and exterior for webs, egg sacs, and harborage areas.' },
        { title: 'Treat', desc: 'Targeted application of EPA-approved residual treatments to baseboards, corners, and entry points.' },
        { title: 'Seal', desc: 'Identification and sealing of cracks, gaps, and entry points around the structure.' },
        { title: 'Monitor', desc: 'Follow-up inspection and quarterly maintenance to prevent re-infestation.' },
      ]}
      specialSectionTitle="Common East Texas Spiders We Treat"
      specialCards={[
        { title: 'Black Widow', desc: 'Dangerous venomous spider identified by its red hourglass marking. Found in garages, woodpiles, and dark undisturbed areas.' },
        { title: 'Brown Recluse', desc: 'Identified by violin-shaped marking on its back. Bites can cause necrotic tissue damage. Hides in closets, boxes, and bedding.' },
        { title: 'Common House Spider', desc: 'Nuisance spider that creates messy cobwebs in corners, windows, and basements. Not dangerous but unsightly.' },
      ]}
      faqs={[
        { q: 'How do I know if I have a spider infestation?', a: 'Look for webs in corners, around windows, in garages, and undisturbed areas. Seeing multiple spiders regularly is a clear sign of an infestation that needs professional treatment.' },
        { q: 'Are your spider treatments safe for children and pets?', a: 'Yes, all products we use are EPA-approved and applied by licensed technicians. We take extra precautions to ensure the safety of your family and pets.' },
        { q: 'How long does spider treatment take?', a: 'Most treatments take 45-90 minutes depending on the size of your home and severity of the infestation.' },
        { q: 'How soon will I see results?', a: 'You may see spiders for 1-2 weeks as they contact treated areas. This is normal and means the treatment is working. Most infestations are fully resolved within 2-3 weeks.' },
        { q: 'Do you offer a guarantee?', a: 'Yes, we offer a satisfaction guarantee on all spider treatments. If spiders return between scheduled services, we will retreat at no additional cost.' },
        { q: 'How often should I treat for spiders?', a: 'Quarterly treatments are recommended for ongoing protection, especially in East Texas where spider activity is year-round due to the warm climate.' },
      ]}
      eastTexasCTATitle="East Texas Spider Control Experts"
    />
  )
}
