interface Props { foundedYear?: string | number; city?: string }

export function RusticRuggedStatsBanner({ foundedYear, city }: Props) {
  const years = foundedYear ? new Date().getFullYear() - Number(foundedYear) : null;
  const cityName = city || 'Your Community';

  return (
    <div className="py-4 px-4 text-center" style={{ backgroundColor: '#1a1a1a' }}>
      <p className="text-white font-bold text-lg tracking-wide">
        {years
          ? `${years}+ Years Serving ${cityName}`
          : `Trusted Local Pest Control Experts — Call Today`}
      </p>
    </div>
  );
}
