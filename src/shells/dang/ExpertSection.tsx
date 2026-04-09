import { Link } from 'react-router-dom'
import { Phone } from 'lucide-react'
import interiorService from './assets/interior-service.jpg'

export default function ExpertSection() {
  return (
    <section
      className="py-16"
      style={{ background: '#ffffff', backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)', backgroundSize: '24px 24px' }}
    >
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <img src={interiorService} alt="Pest Control Service Technician Spraying in Kitchen" width="644" height="418"
            className="w-full rounded-2xl object-cover" style={{ border: '6px solid hsl(28,100%,50%)' }} />
        </div>
        <div>
          <h2 className="dang-text-comic text-3xl md:text-4xl mb-4" style={{ color: 'hsl(20,40%,12%)' }}>
            Expert Pest Control & Management Services around Tyler, TX
          </h2>
          <p className="text-base leading-relaxed mb-4" style={{ color: 'hsl(20,20%,30%)' }}>
            At Dang Pest Control, we know pest problems can seriously disrupt your life. That's why we offer a wide array of reliable pest control services tailored to meet your specific needs. Whether it's a small nuisance or a full-blown infestation, our licensed and experienced technicians provide professional solutions that eliminate issues and prevent their return.
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <a href="tel:9038710550" className="inline-flex items-center gap-2 font-bold rounded-full px-7 py-2.5 text-sm border-2 transition-all hover:bg-foreground hover:text-white"
              style={{ borderColor: 'hsl(20,40%,12%)', color: 'hsl(20,40%,12%)' }}>
              <Phone className="w-4 h-4" /> (903) 871-0550
            </a>
            <Link to="/quote" className="inline-flex items-center justify-center font-bold rounded-full px-7 py-2.5 text-white transition-all hover:brightness-110"
              style={{ background: 'hsl(28,100%,50%)', fontSize: '1rem' }}>
              Get Your Quote
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
