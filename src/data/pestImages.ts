// Local pest images — served from public/images/pests/
export const PEST_IMG = {
  ants:        '/images/pests/ant.jpg',
  cockroaches: '/images/pests/roach.jpg',
  termites:    '/images/pests/termite_control.jpg',
  mosquitoes:  '/images/pests/Mosquito.jpg',
  rodents:     '/images/pests/rodent.jpg',
  spiders:     '/images/pests/spider.jpg',
  bedbugs:     '/images/pests/bed_bug.jpg',
  wasps:       '/images/pests/wasp_hornet.jpg',
  fleas:       '/images/pests/flea_tik.jpg',
  general:     '/images/pests/pest_control.jpg',
} as const

// Full-width pest images for page headers/CTA sections
export const PEST_PAGE_IMG: Record<string, string> = {
  'ant-control':         '/images/pests/ant.jpg',
  'roach-control':       '/images/pests/roach.jpg',
  'termite-control':     '/images/pests/termite_control.jpg',
  'termite-inspections': '/images/pests/termite_inspection.jpg',
  'mosquito-control':    '/images/pests/Mosquito.jpg',
  'rodent-control':      '/images/pests/rodent.jpg',
  'spider-control':      '/images/pests/spider.jpg',
  'bed-bug-control':     '/images/pests/bed_bug.jpg',
  'wasp-hornet-control': '/images/pests/wasp_hornet.jpg',
  'flea-tick-control':   '/images/pests/flea_tik.jpg',
  'scorpion-control':    '/images/pests/scorpion.jpg',
  'pest-control':        '/images/pests/pest_control.jpg',
}

export const FALLBACK_PEST_IMG = '/images/pests/pest_control.jpg'
