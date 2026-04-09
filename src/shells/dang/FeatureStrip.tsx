import dangSeal from './assets/dang-seal.png'
import servicesIcon from './assets/services-icon.png'
import expertIcon from './assets/expert-icon.png'

export default function FeatureStrip() {
  return (
    <section className="bg-white py-12 border-b border-orange-100">
      <div className="container mx-auto px-4 grid md:grid-cols-3 gap-6 text-center items-start">
        <div className="flex flex-col items-center gap-4 px-6">
          <img src={dangSeal} alt="100% Super-Powered Guarantee" className="w-36 h-36 object-contain" />
          <p className="text-sm leading-relaxed" style={{ color: 'hsl(20,20%,35%)' }}>
            If our service doesn't provide the results we say it will, we'll treat it again for free! If still not the desired results, we'll refund your money!
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 border-x border-orange-100 px-6">
          <img src={servicesIcon} alt="Super Hero Response Team" className="w-16 h-16 object-contain" />
          <div>
            <h2 className="dang-text-comic text-xl mb-1" style={{ color: 'hsl(20,40%,12%)' }}>Super Hero Response Team!</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(20,20%,35%)' }}>Committed to Excellent Customer Service & Communication!</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4 px-6">
          <img src={expertIcon} alt="Certified Expert" className="w-16 h-16 object-contain" />
          <div>
            <h3 className="dang-text-comic text-xl mb-1" style={{ color: 'hsl(20,40%,12%)' }}>Certified Expert</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(20,20%,35%)' }}>Licensed & Insured.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
