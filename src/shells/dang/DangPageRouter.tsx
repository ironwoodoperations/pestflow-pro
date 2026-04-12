import React from 'react'
import { useTemplate } from '../../context/TemplateContext'
import PublicShell from '../../components/PublicShell'

const DangAbout            = React.lazy(() => import('./pages/About'))
const DangFAQ              = React.lazy(() => import('./pages/FAQPage'))
const DangContact          = React.lazy(() => import('./pages/ContactPage'))
const DangQuote            = React.lazy(() => import('./pages/QuotePage'))
const DangMosquito         = React.lazy(() => import('./pages/MosquitoControl'))
const DangSpider           = React.lazy(() => import('./pages/SpiderControl'))
const DangAnt              = React.lazy(() => import('./pages/AntControl'))
const DangWaspHornet       = React.lazy(() => import('./pages/WaspHornetControl'))
const DangRoach            = React.lazy(() => import('./pages/RoachControl'))
const DangFleaTick         = React.lazy(() => import('./pages/FleaTickControl'))
const DangRodent           = React.lazy(() => import('./pages/RodentControl'))
const DangScorpion         = React.lazy(() => import('./pages/ScorpionControl'))
const DangBedBug           = React.lazy(() => import('./pages/BedBugControl'))
const DangPestControl      = React.lazy(() => import('./pages/PestControlPage'))
const DangTermiteControl   = React.lazy(() => import('./pages/TermiteControl'))
const DangTermiteInspect   = React.lazy(() => import('./pages/TermiteInspections'))
const DangReviews          = React.lazy(() => import('./pages/DangReviews'))
const DangCity             = React.lazy(() => import('./pages/DangCityPage'))

const DANG_PAGES: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'about':               DangAbout,
  'faq':                 DangFAQ,
  'contact':             DangContact,
  'quote':               DangQuote,
  'mosquito-control':    DangMosquito,
  'spider-control':      DangSpider,
  'ant-control':         DangAnt,
  'wasp-hornet-control': DangWaspHornet,
  'roach-control':       DangRoach,
  'flea-tick-control':   DangFleaTick,
  'rodent-control':      DangRodent,
  'scorpion-control':    DangScorpion,
  'bed-bug-control':     DangBedBug,
  'pest-control':        DangPestControl,
  'termite-control':     DangTermiteControl,
  'termite-inspections': DangTermiteInspect,
  'reviews':             DangReviews,
  'lindale-tx':          DangCity,
  'bullard-tx':          DangCity,
  'whitehouse-tx':       DangCity,
  'jacksonville-tx':     DangCity,
  'longview-tx':         DangCity,
  'kilgore-tx':          DangCity,
  'henderson-tx':        DangCity,
}

interface Props {
  slug: string
  fallback: React.ReactElement
}

export default function DangPageRouter({ slug, fallback }: Props) {
  const { template } = useTemplate()
  if (template !== 'dang') return fallback
  const DangPage = DANG_PAGES[slug]
  if (!DangPage) return fallback
  return (
    <PublicShell>
      <React.Suspense fallback={<div />}>
        <DangPage />
      </React.Suspense>
    </PublicShell>
  )
}
