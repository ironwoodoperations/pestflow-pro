import React from 'react'
import { useTemplate } from '../../context/TemplateContext'

const DangAbout             = React.lazy(() => import('./pages/DangAbout'))
const DangPestControl       = React.lazy(() => import('./pages/DangPestControl'))
const DangTermiteControl    = React.lazy(() => import('./pages/DangTermiteControl'))
const DangTermiteInspections = React.lazy(() => import('./pages/DangTermiteInspections'))
const DangRoachControl      = React.lazy(() => import('./pages/DangRoachControl'))
const DangAntControl        = React.lazy(() => import('./pages/DangAntControl'))
const DangMosquitoControl   = React.lazy(() => import('./pages/DangMosquitoControl'))
const DangBedBugControl     = React.lazy(() => import('./pages/DangBedBugControl'))
const DangFleaTickControl   = React.lazy(() => import('./pages/DangFleaTickControl'))
const DangRodentControl     = React.lazy(() => import('./pages/DangRodentControl'))
const DangScorpionControl   = React.lazy(() => import('./pages/DangScorpionControl'))
const DangSpiderControl     = React.lazy(() => import('./pages/DangSpiderControl'))
const DangWaspHornetControl = React.lazy(() => import('./pages/DangWaspHornetControl'))
const DangContact           = React.lazy(() => import('./pages/DangContact'))
const DangFaq               = React.lazy(() => import('./pages/DangFaq'))
const DangQuote             = React.lazy(() => import('./pages/DangQuote'))

const DANG_PAGES: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'about':               DangAbout,
  'pest-control':        DangPestControl,
  'termite-control':     DangTermiteControl,
  'termite-inspections': DangTermiteInspections,
  'roach-control':       DangRoachControl,
  'ant-control':         DangAntControl,
  'mosquito-control':    DangMosquitoControl,
  'bed-bug-control':     DangBedBugControl,
  'flea-tick-control':   DangFleaTickControl,
  'rodent-control':      DangRodentControl,
  'scorpion-control':    DangScorpionControl,
  'spider-control':      DangSpiderControl,
  'wasp-hornet-control': DangWaspHornetControl,
  'contact':             DangContact,
  'faq':                 DangFaq,
  'quote':               DangQuote,
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
    <React.Suspense fallback={<div />}>
      <DangPage />
    </React.Suspense>
  )
}
