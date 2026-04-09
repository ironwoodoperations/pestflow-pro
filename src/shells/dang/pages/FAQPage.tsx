import Navbar from '../ShellNavbar';
import Footer from '../ShellFooter';

const faqs = [
  { q: 'What is a pest?', a: 'Basically, any unwanted animal or plant that typically has a negative effect on people and the surrounding environment.' },
  { q: 'What is Integrated Pest Management (IPM)?', a: 'Integrated pest management (IPM) is a strategy that uses a variety of techniques to control pests without solely relying on pesticides. These prevention techniques include cultural practices, pesticides, exclusion, natural enemies and host resistance. The goal is to achieve long-term control of target pests with minimal impact on public health, non-target organisms and the environment.' },
  { q: 'Are you required to have a license?', a: 'Absolutely! All pest professionals must be licensed through the Texas Department of Agriculture. Anyone operating without a license is operating illegally.' },
  { q: 'Is pest control kid and pet friendly?', a: 'Yes. Our primary concerns are our clients and the environment. All of our pest control chemicals are EPA approved, and we have been thoroughly trained on industry regulations and guidelines. We only use products according to the product labels that define the amount and locations where the products can be applied. Also, our Integrated Pest Management strategy gives us many ways to combat pests outside of the use of chemical products.' },
  { q: 'How often do you treat my property?', a: 'It depends but general pest treatments are typically every two to three months. Mosquito treatments are generally monthly. Termites, bed bugs, fleas and ticks, rodents, other pests, and infestations typically require an inspection to determine the best treatment plan and frequency.' },
  { q: 'How long does your treatment last?', a: 'It really depends what product is applied and where it is applied. Our custom treatment plans take into consideration the efficacy of the products and our warranty covers your property between treatments.' },
  { q: 'Does weather affect your treatments?', a: 'The weather can definitely affect the exterior treatments but not the interior treatments. We avoid doing many exterior treatments when it is rainy and/or windy. Many pesticides today are formulated with a coating that prevents them from washing away easily in rain, once they dry. We take weather conditions into account daily, prior to servicing our clients.' },
  { q: 'What can the property owner do to combat pests?', a: 'You can actually do a lot! Most importantly, you should keep your property clean of food and clutter (inside and outside). Keep your property clean and store food in sealed containers and remove debris that may be used as nesting material. Also, seal any access points such as gaps around doors and windows, weepholes, gaps around pipes and wires, holes in siding, roofs, etc. Make sure there are no leaking pipes or standing water inside or outside.' },
  { q: 'How much does pest control cost?', a: 'While many services can be quoted over the phone, it depends on the type of pest, severity of infestation and the size of your property. Contact our office for the most accurate treatment and cost of services.' },
  { q: 'What if I see pests between treatments?', a: 'Our warranty for general pest control states we will return and treat again between scheduled treatments…for free!' },
  { q: 'Do you offer a warranty?', a: 'We sure do and EVERY pest control company should as well. Our warranties vary depending on the type of pest and level of infestation and will be described in detail prior to scheduling any service.' },
  { q: 'Why should I hire a pest control professional instead of doing it myself?', a: 'While taking things into your own hands may seem effective in some instances, pest control almost always requires more strategy and attention than the average person can give it. There is no "one size fits all" application and even different types of cockroaches will require different treatment strategies. More often than not, homeowners lack the knowledge and time to accurately devise an effective treatment plan.' },
  { q: 'How long does it take for the insecticide to work?', a: "It really depends on the pest and the treatment. We pick the treatment that will give us the best long-term results while diminishing the pest population as quickly as possible. In the best case we will see pest mortality almost immediately while total control may take as long as several weeks and require a series of more frequent treatments. It is common to see a slight increase in pest activity right after our initial treatment. That means it's working! While some treatments are designed to terminate the pest on contact, some repel them and some disrupt their life cycle so they can't reproduce. A good pest professional should always evaluate the situation and develop the best plan for each job." },
  { q: 'Does the inside or outside of your house smell after pest control treatments?', a: 'Way back in the "old days", you would definitely know your house was treated because of the strong chemical smell. Those days are long gone…thankfully! The products that Dang Pest Control uses have no significant odor or color. This allows for a more discreet application and reduces discomfort for residents in treated areas.' },
  { q: 'How are pests getting in my home?', a: 'There are numerous ways that pests can enter a home. Ants, roaches, other insects, and even mice and rats can enter through impossibly tiny cracks and crevices. They will also seek out the easiest path such as tree limbs, vines, gutters, etc. To decrease the access points, keep all landscaping trimmed away from the building, weatherproof around all windows, doors, weep holes, and other penetrations into the building. To lessen the chances of pests intruding into your home, be sure to keep any branches, shrubs, piles of firewood, decorative rocks, beds, and any other aspect of landscaping well-maintained.' },
  { q: 'Why are pests in my house?', a: 'Primarily because they are attracted to readily available food sources, moisture, and shelter.' },
  { q: 'Will the products damage my floors or furniture?', a: 'No. They are water-based and used only in the correct quantities and locations to minimize any negative effects.' },
  { q: 'Should your pest control company be insured?', a: 'Yes, the pest control company you hire should be insured. Dang Pest Control is licensed and insured, and our technicians are highly trained.' },
  { q: 'Why are ants so bad in East Texas?', a: 'East Texas humidity, pine trees, and long warm seasons create the perfect breeding ground for ants. In Tyler and surrounding communities, we commonly see fire ants, carpenter ants, and odorous house ants thriving almost year-round.' },
  { q: 'Are fire ants dangerous in Tyler yards?', a: 'Yes. Fire ants are extremely common in East Texas lawns and can deliver painful stings, especially to children and pets. Their mounds often appear after rainstorms, which we get plenty of here in the Piney Woods.' },
  { q: 'Why do ants keep coming back inside my home?', a: "Ant colonies live outside but send scouts indoors for moisture and food. Because of our East Texas humidity, ants can stay active most of the year. That's why recurring pest control is the most effective solution." },
  { q: 'When is ant season in East Texas?', a: 'While spring and summer are peak seasons, ants in Tyler can remain active nearly year-round due to mild winters.' },
  { q: 'Are brown recluse spiders common in East Texas?', a: 'Yes. Brown recluse spiders are found throughout East Texas, including Tyler, especially in garages, attics, and storage areas.' },
  { q: 'Why do I have so many spiders around my porch lights?', a: 'Spiders follow their food source. Porch lights attract insects, which attract spiders.' },
  { q: 'Are black widows dangerous?', a: 'Black widows are present in East Texas and can deliver venomous bites. They prefer dark, undisturbed areas.' },
  { q: 'Do spider treatments eliminate webs?', a: 'Professional exterior treatments significantly reduce spider populations and web formation over time.' },
  { q: 'What types of wasps are common in East Texas?', a: 'In Tyler and surrounding East Texas communities, we most commonly see red paper wasps, yellow jackets, and hornets. Our long warm season allows wasp colonies to grow quickly from spring through late fall.' },
  { q: 'Why are red wasps so aggressive around my home?', a: 'Red wasps (very common in East Texas) build nests under eaves, porch ceilings, sheds, and play equipment. They become aggressive when they feel their nest is threatened — especially during late summer when colonies are at peak size.' },
  { q: 'Are yellow jackets different from regular wasps?', a: "Yes. Yellow jackets often build nests underground or inside wall voids. In East Texas yards, they're frequently disturbed during mowing or landscaping, which is when most stings occur." },
  { q: 'When is wasp season in Tyler, TX?', a: 'Wasp activity typically begins in early spring (March/April) and peaks during hot East Texas summers. Because our winters are mild, queens can survive and rebuild nests year after year.' },
  { q: 'Can I remove a wasp nest myself?', a: "We don't recommend it. East Texas wasp species defend their nests aggressively and can sting multiple times. Professional removal ensures safe treatment and reduces the chance of re-nesting." },
  { q: 'Are scorpions common in East Texas?', a: 'While more common in West Texas, scorpions — including Texas bark scorpions — are found in Tyler and surrounding wooded areas, especially near stacked wood and rock beds.' },
  { q: 'When are scorpions most active in Tyler?', a: 'Scorpions are most active during hot summer months but may seek shelter indoors during heavy rains or cooler weather shifts.' },
  { q: 'Are scorpion stings dangerous?', a: 'Most scorpion stings are painful but not life-threatening. However, children and pets may experience stronger reactions.' },
  { q: 'How do scorpions get inside homes?', a: 'They squeeze through small foundation cracks, under doors, and around utility lines — common in older East Texas homes.' },
  { q: 'Are rodents common in East Texas homes?', a: 'Yes. Older homes in Tyler, crawl spaces, and wooded properties provide easy access points for mice and rats.' },
  { q: 'How small of an opening can a mouse fit through?', a: 'A mouse can squeeze through a hole the size of a dime. In East Texas homes with pier-and-beam foundations, this is especially common.' },
  { q: 'When are rodents most active in Tyler?', a: 'Rodents seek shelter during colder months but can remain active year-round here due to mild winters.' },
  { q: 'What attracts rodents in the Piney Woods area?', a: 'Pet food, bird feeders, fallen pecans, and dense landscaping around homes are major attractants.' },
  { q: 'Why are mosquitoes so aggressive in East Texas?', a: 'Our heat, humidity, and frequent rain create ideal breeding conditions. Mosquitoes can lay eggs in as little as a bottle cap of standing water.' },
  { q: 'When does mosquito season start in Tyler?', a: 'Mosquito activity often begins as early as March and can last into November depending on temperatures.' },
  { q: 'Do backyard treatments really work?', a: 'Yes. Targeted treatments significantly reduce adult mosquito populations and breeding areas. Ongoing treatments are especially effective during peak East Texas summer months.' },
  { q: 'Why do mosquitoes seem worse after a mild winter?', a: 'East Texas winters are often not cold enough to significantly reduce mosquito populations, allowing more to survive into spring.' },
  { q: 'Why are fleas so bad in East Texas?', a: 'East Texas humidity creates ideal breeding conditions. Fleas reproduce rapidly in shaded yards and on pets.' },
  { q: 'Are ticks common in Tyler?', a: 'Yes. Ticks thrive in tall grass, wooded areas, and properties near the Piney Woods. They are active most of the year here.' },
  { q: 'Can fleas live in my yard without pets?', a: 'Yes. Wildlife such as raccoons, squirrels, and stray animals can introduce fleas into East Texas yards.' },
  { q: 'When is flea and tick season in Tyler?', a: 'Peak activity runs from spring through fall, but mild winters allow survival year-round.' },
  { q: 'What types of roaches are common in East Texas?', a: 'In Tyler and surrounding East Texas areas, we frequently treat American cockroaches (also called palmetto bugs) and German cockroaches. The warm, humid climate makes it easy for them to survive.' },
  { q: 'Why am I seeing large roaches after rain?', a: 'Heavy East Texas rains drive roaches out of storm drains and into homes. They are moisture-seeking pests and thrive in humid environments.' },
  { q: 'Does seeing one roach mean I have an infestation?', a: 'Not always — but in East Texas, where roach populations are high, it\'s often a sign there are more nearby. German roaches especially multiply quickly indoors.' },
  { q: "How can I prevent roaches in Tyler's humid climate?", a: 'Regular perimeter treatments and moisture control are key. Because our humidity levels stay high most of the year, ongoing service is the best defense.' },
  { q: 'Are bed bugs common in East Texas?', a: 'Yes. Bed bugs are found in homes, apartments, hotels, and student housing throughout Tyler and East Texas.' },
  { q: 'How do bed bugs spread?', a: 'They travel on luggage, clothing, furniture, and through shared walls in apartments.' },
  { q: 'Can I treat bed bugs myself?', a: 'DIY treatments often fail because bed bugs hide in mattress seams, wall voids, and furniture cracks. Professional treatment is strongly recommended.' },
  { q: 'How quickly do bed bugs multiply?', a: 'Bed bugs reproduce quickly and can become a major infestation within weeks if untreated.' },
];

const FAQPage = () => {
  return (
    <div style={{ fontFamily: "'Open Sans', sans-serif", color: 'hsl(20, 40%, 12%)', overflowX: 'hidden' }}>
      <Navbar />
      <main>

      {/* HERO */}
      <section style={{
        position: 'relative',
        background: `url(/moblie_banner.webp) center/cover no-repeat, hsl(28, 100%, 50%)`,
        paddingTop: '80px',
        paddingBottom: '200px',
        minHeight: '420px',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.18) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '0 20px 30px' }}>
          <h1 style={{
            fontFamily: '"Bangers", cursive',
            fontSize: 'clamp(42px, 7vw, 88px)',
            color: 'hsl(45, 95%, 60%)',
            fontStyle: 'italic',
            letterSpacing: '0.05em',
            WebkitTextStroke: '3px #000000',
            textShadow: '3px 3px 0 #000000',
            margin: 0,
            lineHeight: 1.05,
          }}>
            FREQUENTLY ASKED<br />QUESTIONS
          </h1>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 1 }}>
          <img fetchPriority="high" width={1200} height={50} src="/banner-img.png" alt="" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>

      {/* FAQ LIST */}
      <section style={{ padding: '60px 40px 80px', maxWidth: '1000px', margin: '0 auto' }}>
        {faqs.map((faq, i) => (
          <div key={i} style={{ marginBottom: '28px' }}>
            <h2 style={{ fontWeight: '700', fontSize: '18px', marginBottom: '8px', marginTop: 0 }}>
              {i + 1}. {faq.q}
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#444', margin: 0 }}>{faq.a}</p>
          </div>
        ))}
      </section>

      </main>
      <Footer />
    </div>
  );
};

export default FAQPage;
