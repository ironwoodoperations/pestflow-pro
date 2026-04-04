// Pexels pest images — used in service cards and pest page templates
export const PEST_IMG = {
  ants:        'https://images.pexels.com/photos/712573/pexels-photo-712573.jpeg?auto=compress&w=400',
  cockroaches: 'https://images.pexels.com/photos/4518762/pexels-photo-4518762.jpeg?auto=compress&w=400',
  termites:    'https://images.pexels.com/photos/5749134/pexels-photo-5749134.jpeg?auto=compress&w=400',
  mosquitoes:  'https://images.pexels.com/photos/1006806/pexels-photo-1006806.jpeg?auto=compress&w=400',
  rodents:     'https://images.pexels.com/photos/4588052/pexels-photo-4588052.jpeg?auto=compress&w=400',
  spiders:     'https://images.pexels.com/photos/4168985/pexels-photo-4168985.jpeg?auto=compress&w=400',
  bedbugs:     'https://images.pexels.com/photos/7640754/pexels-photo-7640754.jpeg?auto=compress&w=400',
  wasps:       'https://images.pexels.com/photos/1629781/pexels-photo-1629781.jpeg?auto=compress&w=400',
  fleas:       'https://images.pexels.com/photos/8460374/pexels-photo-8460374.jpeg?auto=compress&w=400',
  general:     'https://images.pexels.com/photos/5025639/pexels-photo-5025639.jpeg?auto=compress&w=400',
} as const

// Full-width pest images for page headers/CTA sections
export const PEST_PAGE_IMG: Record<string, string> = {
  'ant-control':         'https://images.pexels.com/photos/712573/pexels-photo-712573.jpeg?auto=compress&w=800',
  'roach-control':       'https://images.pexels.com/photos/4518762/pexels-photo-4518762.jpeg?auto=compress&w=800',
  'termite-control':     'https://images.pexels.com/photos/5749134/pexels-photo-5749134.jpeg?auto=compress&w=800',
  'termite-inspections': 'https://images.pexels.com/photos/5749134/pexels-photo-5749134.jpeg?auto=compress&w=800',
  'mosquito-control':    'https://images.pexels.com/photos/1006806/pexels-photo-1006806.jpeg?auto=compress&w=800',
  'rodent-control':      'https://images.pexels.com/photos/4588052/pexels-photo-4588052.jpeg?auto=compress&w=800',
  'spider-control':      'https://images.pexels.com/photos/4168985/pexels-photo-4168985.jpeg?auto=compress&w=800',
  'bed-bug-control':     'https://images.pexels.com/photos/7640754/pexels-photo-7640754.jpeg?auto=compress&w=800',
  'wasp-hornet-control': 'https://images.pexels.com/photos/1629781/pexels-photo-1629781.jpeg?auto=compress&w=800',
  'flea-tick-control':   'https://images.pexels.com/photos/8460374/pexels-photo-8460374.jpeg?auto=compress&w=800',
  'scorpion-control':    'https://images.pexels.com/photos/5025639/pexels-photo-5025639.jpeg?auto=compress&w=800',
  'pest-control':        'https://images.pexels.com/photos/5025639/pexels-photo-5025639.jpeg?auto=compress&w=800',
}

export const FALLBACK_PEST_IMG = 'https://images.pexels.com/photos/5025639/pexels-photo-5025639.jpeg?auto=compress&w=800'
