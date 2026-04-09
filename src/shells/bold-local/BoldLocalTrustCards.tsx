interface Props {
  foundedYear?: string | number
  tagline?: string
  certifications?: string
}

export default function BoldLocalTrustCards({ foundedYear, tagline, certifications }: Props) {
  const yearsText = foundedYear
    ? `${new Date().getFullYear() - Number(foundedYear)}+ Years`
    : '10+ Years'

  const cards = [
    {
      title: yearsText + ' of Experience',
      body: foundedYear
        ? `Founded in ${foundedYear}, we've been protecting local homes and businesses for over ${new Date().getFullYear() - Number(foundedYear)} years.`
        : 'Decades of experience protecting homes and businesses in the community.',
    },
    {
      title: 'Family Owned & Operated',
      body: tagline || 'We treat every customer like a neighbor — because in our community, they are. Personalized service every time.',
    },
    {
      title: 'Licensed Professionals',
      body: certifications
        ? `Certified and licensed professionals: ${certifications}.`
        : 'All technicians are state-licensed, background-checked, and trained in the latest pest management methods.',
    },
  ]

  return (
    <section className="py-16 px-4" style={{ backgroundColor: 'var(--color-primary)' }}>
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl p-7 flex flex-col">
            <h3 className="text-lg font-bold mb-2" style={{ color: '#1a1a1a' }}>{card.title}</h3>
            <div className="mb-3" style={{ width: '32px', height: '3px', backgroundColor: 'var(--color-primary)' }} />
            <p className="text-sm text-gray-600 leading-relaxed flex-1">{card.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
