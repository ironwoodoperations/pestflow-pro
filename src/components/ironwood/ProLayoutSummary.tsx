interface Props {
  layoutConfig: Record<string, any>
}

function ColorSwatch({ hex }: { hex: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-4 h-4 rounded border border-gray-600 flex-shrink-0"
        style={{ background: hex }}
        title={hex}
      />
      <span className="text-xs text-gray-400 font-mono">{hex}</span>
    </span>
  )
}

export default function ProLayoutSummary({ layoutConfig }: Props) {
  const nav      = layoutConfig.nav      || {}
  const footer   = layoutConfig.footer   || {}
  const colors   = layoutConfig.colors   || {}
  const sections: any[] = layoutConfig.sections || []

  const hero       = sections.find((s: any) => s.type === 'hero')
  const sectionFlow = sections
    .map((s: any) => (s.type || s.id || '?').replace(/-/g, ' '))
    .join(' → ')

  const navLabel    = (nav.style    || '—').replace(/-/g, ' ')
  const footerLabel = (footer.style || '—').replace(/-/g, ' ')
  const heroVariant = hero ? (hero.variant || '—').replace(/-/g, ' ') : null

  return (
    <div className="bg-gray-900 border border-violet-700/30 rounded-lg p-4 space-y-3">
      <h5 className="text-violet-300 font-semibold text-xs uppercase tracking-wider">Layout Summary</h5>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
        <div>
          <p className="text-gray-500 mb-0.5">Nav</p>
          <p className="text-gray-200 capitalize">{navLabel}</p>
        </div>
        <div>
          <p className="text-gray-500 mb-0.5">Footer</p>
          <p className="text-gray-200 capitalize">{footerLabel}</p>
        </div>
        {heroVariant && (
          <div>
            <p className="text-gray-500 mb-0.5">Hero variant</p>
            <p className="text-gray-200 capitalize">{heroVariant}</p>
          </div>
        )}
        <div>
          <p className="text-gray-500 mb-0.5">Sections</p>
          <p className="text-gray-200">{sections.length}</p>
        </div>
      </div>

      {sectionFlow && (
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Flow</p>
          <p className="text-xs text-gray-300 break-all capitalize">{sectionFlow}</p>
        </div>
      )}

      {(colors.primary || colors.accent) && (
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Colors</p>
          <div className="flex flex-wrap gap-4">
            {colors.primary && <ColorSwatch hex={colors.primary} />}
            {colors.accent  && <ColorSwatch hex={colors.accent}  />}
          </div>
        </div>
      )}
    </div>
  )
}
