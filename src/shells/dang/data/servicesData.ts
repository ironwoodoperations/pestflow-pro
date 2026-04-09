// Service page images
import pestControlHero from "../assets/services/pest-control-hero.jpg";
import antHero from "../assets/services/ant-hero.jpg";
import termiteHero from "../assets/services/termite-hero.jpg";
import spiderHero from "../assets/services/spider-hero.jpg";
import waspHero from "../assets/services/wasp-hero.jpg";
import scorpionHero from "../assets/services/scorpion-hero.jpg";
import rodentHero from "../assets/services/rodent-hero.jpg";
import fleaTickHero from "../assets/services/flea-tick-hero.jpg";
import roachHero from "../assets/services/roach-hero.jpg";
import bedBugHero from "../assets/services/bed-bug-hero.jpg";
// Secondary images
import fireAntsImg from "../assets/services/fire-ants.jpg";
import brownRecluseImg from "../assets/services/brown-recluse.jpg";
import houseMouseImg from "../assets/services/house-mouse.jpg";
import petsFleaImg from "../assets/services/pets-flea.jpg";
import antsVsTermitesImg from "../assets/services/ants-vs-termites.png";
// Process icons
import processStep1 from "../assets/services/process-step1.png";
import processStep2 from "../assets/services/process-step2.png";
import processStep3 from "../assets/services/process-step3.png";
import processStep4 from "../assets/services/process-step4.png";
import processTreatment from "../assets/services/process-treatment.png";
// Why choose us icons
import provenResults from "../assets/services/proven-results.png";
import comprehensive from "../assets/services/comprehensive.png";
import safety from "../assets/services/safety.png";
import guarantee from "../assets/services/guarantee.png";
import superPowered from "../assets/services/super-powered.png";
import localExperts from "../assets/services/local-experts.png";
import customPlans from "../assets/services/custom-plans.png";

export interface ProcessStep {
  title: string;
  subtitle?: string;
  icon: string;
  description: string;
}

export interface WhyChooseItem {
  icon: string;
  title: string;
  description: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface ServiceData {
  title: string;
  subtitle: string;
  heroImage: string;
  heroAlt: string;
  intro: string;
  processTitle: string;
  processIntro?: string;
  steps: ProcessStep[];
  extraSections?: Array<{
    title: string;
    content: string[];
    image?: string;
    imageAlt?: string;
    bulletPoints?: string[];
  }>;
  whyChooseUs: WhyChooseItem[];
  whyChooseIntro?: string;
  additionalServicesIntro?: string;
  bottomCTA: {
    title: string;
    text: string;
  };
  bottomImage?: string;
  bottomImageAlt?: string;
  faqs?: FAQ[];
}

export const servicesData: Record<string, ServiceData> = {
  "pest-control": {
    title: "Comprehensive General Pest Control Services",
    subtitle: "pest control",
    heroImage: pestControlHero,
    heroAlt: "Technician Providing Pest Control Services in Tyler TX",
    intro: "Your home or property deserves year-round protection from pests. At Dang Pest Control, we deliver general pest control services tailored to the unique challenges of the East Texas environment. Count on our team of skilled technicians to protect your home from unwanted invaders with precision and professionalism. We serve Tyler, TX, and the surrounding areas. Call us today at (903) 871-0550 and get your quote.",
    processTitle: "Our Pest Control Process",
    steps: [
      { title: "Step 1", subtitle: "Phone Quoting Made Easy", icon: processStep1, description: "No inspection is required to get started. Our team will assess your needs by gathering essential details about your property—size, pest issues, and more—over the phone. Using this information, we'll prepare a plan before even stepping onto your property." },
      { title: "Step 2", subtitle: "Thorough Initial Service", icon: processStep2, description: "Our technicians will conduct a comprehensive inspection of your property to identify pests, evidence of activity, entry points, and harborage areas." },
      { title: "", subtitle: "Targeted Treatments", icon: processStep2, description: "We'll provide both interior and exterior treatments to address pests already inside while preventing new ones from entering. This includes spraying in the kitchen, bathrooms, wall penetrations and selected interior areas as well as spraying exterior foundations, around windows and doors, and the eaves (up to 20 feet high)." },
      { title: "", subtitle: "Pest Prevention", icon: processStep2, description: "We treat up to 10 feet out from your foundation in addition to sweeping away spider webs, and treat entry points to fortify your property against a wide range of pests, including cockroaches, ants, scorpions, spiders, silverfish, centipedes, millipedes, and many more." },
      { title: "Step 3", subtitle: "Custom Treatment Plan", icon: processStep3, description: "Based on our findings, we'll discuss a detailed solution tailored to your situation. Our integrated pest management approach doesn't just treat pests temporarily—it gets to the root of the problem to keep them away year-round." },
      { title: "Step 4", subtitle: "Monitoring & Preventative Care", icon: processStep4, description: "To ensure long-lasting protection, our team monitors your property regularly, adjusting treatments as needed to guarantee effectiveness." },
    ],
    whyChooseUs: [
      { icon: provenResults, title: "Focused Expertise", description: "We are proud members of the National Pest Management Association (NPMA) and the Texas Pest Control Association (TPCA), reflecting our commitment to industry best practices and professionalism." },
      { icon: comprehensive, title: "Environmentally Responsible", description: "Our Integrated Pest Management (IPM) approach prioritizes environmentally protective solutions. We don't just spray for a quick fix—we work to eliminate the root causes of your pest problems." },
      { icon: safety, title: "Proven Results", description: "Our technicians leverage years of experience to deliver effective pest control with minimal disruption to your daily life." },
      { icon: guarantee, title: "Customer-Focused Service", description: "From the moment you call until the final treatment, we're dedicated to your satisfaction." },
      { icon: superPowered, title: "Local & Reliable", description: "Based in Tyler, TX, Dang Pest Control proudly serves homeowners and property managers across Longview, Jacksonville, Lindale, Bullard, Whitehouse, and surrounding areas." },
    ],
    bottomCTA: {
      title: "Protect Your Property Today",
      text: "Don't wait for pests to invade your home—act now. With Dang Pest Control, you'll enjoy expert service, tailored solutions, and peace of mind knowing your property is in good hands.",
    },
  },
  "ant-control": {
    title: "Ant Control Services",
    subtitle: "Ants",
    heroImage: antHero,
    heroAlt: "Carpenter Ant Control Services Tyler TX",
    intro: "Ant infestations can disrupt your daily life and damage your property. Don't let them take over your home or yard. At Dang Pest Control, we specialize in identifying, treating, and preventing ant infestations—giving you back your peace of mind.",
    processTitle: "Our Ant Control Process",
    steps: [
      { title: "Step 1", subtitle: "Inspection & Identification", icon: processStep1, description: "Our skilled technicians will assess your property to identify the type of ants and locate their nests and entry points." },
      { title: "Step 2", subtitle: "Customized Treatment Plan", icon: processStep2, description: "We create a tailored Integrated Pest Management Plan to target your specific ant problem." },
      { title: "Step 3", subtitle: "Long-Term Elimination", icon: processStep3, description: "Our treatments don't just stop at the surface. Ants carry the product back to their colony, effectively eliminating the entire population." },
      { title: "Step 4", subtitle: "Ongoing Monitoring & Prevention", icon: processStep4, description: "We monitor the effectiveness of the treatment, evaluate the results, and provide preventative care tips to ensure your property remains ant-free." },
    ],
    extraSections: [
      {
        title: "Fire Ant Treatment & Prevention",
        content: [
          "At Dang Pest Control, we understand the dangers and disruptions fire ants can bring to your home and outdoor spaces. Their bites and stings can cause significant pain, itching, swelling, and even allergic reactions.",
          "Beyond their bites, fire ants can pose serious risks to your home. They are notorious for moving into walls, roofs, and floors, often causing electrical malfunctions by invading air conditioners, telephone wiring, and other machinery.",
          "With Dang Pest Control's professional ant control treatments, you'll regain your home and yard as a safe space, free from fire ants.",
        ],
        image: fireAntsImg,
        imageAlt: "Fire Ants in Tyler TX",
      },
    ],
    whyChooseUs: [
      { icon: provenResults, title: "Proven Results", description: "We deliver results you can count on. Our expert treatments ensure thorough elimination of ants." },
      { icon: comprehensive, title: "Comprehensive Coverage", description: "We treat your entire yard, beds, and indoor spaces to create a no-ant zone." },
      { icon: safety, title: "Family First", description: "Our insecticides are thoroughly regulated and can be used around your home, pets, and children." },
      { icon: guarantee, title: "Ant-Free Guarantee", description: "We stand by our work with an ant-free guarantee." },
    ],
    bottomCTA: {
      title: "Take the First Step Today",
      text: "Don't wait—restore comfort and peace to your home with professional ant control services from Dang Pest Control.",
    },
  },
  "termite-inspections": {
    title: "Professional Termite Inspections",
    subtitle: "Termite Inspections",
    heroImage: termiteHero,
    heroAlt: "Subterranean Termite Inspections in Tyler TX",
    intro: "Termites cause more than $5 billion in property damage every year—don't be their next victim. At Dang Pest Control, our licensed termite inspectors specialize in protecting your home.",
    processTitle: "Comprehensive Termite Inspections",
    processIntro: "Our licensed termite inspectors conduct an in-depth evaluation of your property, including both the interior and exterior areas.",
    steps: [],
    extraSections: [
      {
        title: "Identifying Termites",
        content: [
          "Termites are small, resilient insects that can cause significant structural damage to homes and businesses.",
          "**Antennae:** Termite antennae are straight with bead-like segments, whereas ants have bent, elbow-like antennae.",
          "**Body:** Termites have soft, light-colored bodies and a broadly connected abdomen and thorax.",
          "**Wings:** Winged termites, or swarmers, have front and hind wings that are equal in size.",
        ],
        image: antsVsTermitesImg,
        imageAlt: "Identifying Termites - Ants vs Termites comparison",
      },
      {
        title: "Signs of a Termite Infestation",
        content: [
          "Termites are often called \"silent destroyers\" because they can cause severe damage without immediate detection.",
          "**Mud Tubes:** Termites build mud tubes to travel between their underground colonies and above-ground food sources.",
          "**Hollow Wood:** Termites consume wood from the inside out, leaving a thin outer shell.",
          "**Discarded Wings:** Swarmers shed their wings after flight.",
        ],
      },
    ],
    whyChooseUs: [
      { icon: provenResults, title: "Professional Expertise", description: "Our licensed termite inspectors are well-trained in handling both subterranean termites and drywood termites." },
      { icon: comprehensive, title: "Environmentally Conscious Solutions", description: "Using an Integrated Pest Management Plan approach, we ensure treatments are effective while being environmentally protective." },
      { icon: safety, title: "Broad Pest Control Expertise", description: "Beyond termite inspections, we provide specialized treatments for ants, spiders, mosquitos, roaches, bed bugs, rodents, and more." },
      { icon: guarantee, title: "Local, Reliable Service", description: "We're a locally owned and operated company in Tyler, TX." },
      { icon: superPowered, title: "Customer-Focused Approach", description: "Your satisfaction is our priority." },
    ],
    whyChooseIntro: "When it comes to termite inspection and treatment, experience matters.",
    bottomCTA: {
      title: "Call Us Today & Protect What Matters",
      text: "Don't wait until termites cause irreparable damage to your home or property.",
    },
  },
  "spider-control": {
    title: "Spider Pest Control Services",
    subtitle: "Spiders",
    heroImage: spiderHero,
    heroAlt: "Black Widow Spider Control Services in Tyler TX",
    intro: "At Dang Pest Control, we understand how unsettling a spider infestation can be. Our approach goes beyond just spraying—we deliver a comprehensive solution.",
    processTitle: "Our Spider Control Process",
    processIntro: "Here's what you can expect from our spider pest control services:",
    steps: [
      { title: "Step 1", subtitle: "Identify the Problem", icon: processStep1, description: "Our licensed technicians carefully assess your property to pinpoint the spider species and locate their entry points and favorite hiding spots." },
      { title: "Step 2", subtitle: "Integrated Pest Management Plan", icon: processStep2, description: "We craft a custom Integrated Pest Management (IPM) plan that combines environmentally responsible techniques with proven treatments." },
      { title: "Step 3", subtitle: "Monitor & Evaluate", icon: processStep3, description: "After the treatment, we actively monitor the results and assess the effectiveness of our methods." },
      { title: "Step 4", subtitle: "Continued Prevention", icon: processStep4, description: "We don't just get rid of spiders—we help prevent them from coming back." },
    ],
    whyChooseUs: [
      { icon: provenResults, title: "Trusted Expertise", description: "With experience serving the Tyler, TX area, our technicians are certified experts in spider treatment and pest control." },
      { icon: comprehensive, title: "Customer-Focused Solutions", description: "Every home and property is different, and our service is tailored to your specific needs." },
      { icon: safety, title: "Environmental Responsibility", description: "At Dang Pest Control, we prioritize eco-friendly practices." },
      { icon: guarantee, title: "Comprehensive Approach", description: "We aren't a \"spray and go\" company. Our holistic process ensures quality results that last." },
    ],
    bottomCTA: {
      title: "Spider-Free Living Starts Here",
      text: "Reclaim your home or property with Dang Pest Control's expert spider pest control services.",
    },
    bottomImage: brownRecluseImg,
    bottomImageAlt: "Brown Recluse Spider Control Services in Tyler TX",
  },
  "wasp-hornet-control": {
    title: "Wasp & Hornet Control Services",
    subtitle: "Wasps & Hornets",
    heroImage: waspHero,
    heroAlt: "Red Wasp Control Services in Tyler TX",
    intro: "Don't let wasps or hornets take over your home or property. Dang Pest Control offers expert solutions to eliminate these dangerous pests.",
    processTitle: "Expert Wasp & Hornet Control Service That Works",
    steps: [
      { title: "Step 1", subtitle: "Identification & Assessment", icon: processStep1, description: "Our trained technicians start by identifying the type of wasp or hornet and locating their nest." },
      { title: "Step 2", subtitle: "Integrated Pest Management Plan", icon: processStep2, description: "We don't just treat the symptoms—we tackle the root cause." },
      { title: "Step 3", subtitle: "Long-Term Elimination", icon: processStep3, description: "After treatment, we'll ensure the wasps or hornets are completely eradicated." },
      { title: "Step 4", subtitle: "Ongoing Monitoring & Prevention", icon: processStep4, description: "We monitor the effectiveness of the treatment and provide preventative care tips." },
    ],
    whyChooseUs: [
      { icon: provenResults, title: "Local Expertise", description: "Located in Tyler, TX, we proudly serve our community and surrounding areas." },
      { icon: comprehensive, title: "Certified Specialists", description: "We're proud members of the NPMA and TPCA." },
      { icon: safety, title: "Environmentally Mindful Solutions", description: "We prioritize your family, pets, and the environment." },
      { icon: guarantee, title: "Broad Pest Control Services", description: "More than just a wasp and hornet removal company." },
    ],
    bottomCTA: {
      title: "Call Us Today to Solve Your Pest Problem",
      text: "Wasps and hornets don't belong on your property—protect your family before the problem worsens.",
    },
  },
  "scorpion-control": {
    title: "Scorpion Control Services",
    subtitle: "Scorpions",
    heroImage: scorpionHero,
    heroAlt: "Scorpion Control Services in Tyler TX",
    intro: "When scorpions invade your home or yard, they aren't just a nuisance—they can present a serious hazard. At Dang Pest Control, we specialize in delivering comprehensive scorpion pest control services.",
    processTitle: "Our Scorpion Control Process",
    steps: [
      { title: "Step 1", subtitle: "Inspection & Identification", icon: processStep1, description: "Our experienced technicians will carefully inspect your home and yard, identifying scorpions and uncovering the sources of infestation." },
      { title: "Step 2", subtitle: "Integrated Pest Management Plan", icon: processStep2, description: "Using a science-backed approach, we craft a tailored Integrated Pest Management Plan." },
      { title: "Step 3", subtitle: "Long-Term Elimination", icon: processStep3, description: "We don't stop after treatment. Our team will ensure your home remains free of scorpions." },
      { title: "Step 4", subtitle: "Ongoing Monitoring & Prevention", icon: processStep4, description: "We monitor the effectiveness of the treatment and provide preventative care tips." },
    ],
    whyChooseIntro: "While scorpion control is our specialty, we're proud to offer a range of pest control services.",
    whyChooseUs: [
      { icon: provenResults, title: "Expertise You Can Count On", description: "With experience and membership with the NPMA and TPCA." },
      { icon: comprehensive, title: "Eco-Conscious Methods", description: "Our Integrated Pest Management approach prioritizes environmentally protective strategies." },
      { icon: safety, title: "Reliable Solutions", description: "We don't believe in temporary fixes." },
      { icon: guarantee, title: "Local Expertise, Trusted Results", description: "Based in Tyler, TX, we proudly serve the surrounding communities." },
    ],
    bottomCTA: {
      title: "Don't Wait—Protect Your Home Today!",
      text: "Located in Tyler, TX, Dang Pest Control serves clients across Longview, Jacksonville, Lindale, Bullard, Whitehouse, and neighboring areas.",
    },
  },
  "rodent-control": {
    title: "Rodent Control Services",
    subtitle: "Rodents",
    heroImage: rodentHero,
    heroAlt: "Norway Brown Rat Control Services in Tyler TX",
    intro: "When it comes to pests, few are as concerning as rodents. Whether it's roof rats, Norway rats, or house mice, the damage they cause can be significant.",
    processTitle: "Our Rodent Control Process",
    steps: [
      { title: "Step 1", subtitle: "Thorough Inspection", icon: processStep1, description: "Our technicians carefully inspect your property to identify signs of infestation, entry points, and rodent activity." },
      { title: "Step 2", subtitle: "Integrated Pest Management (IPM) Plan", icon: processStep2, description: "We customize a strategy to address your rodent issue at its root with environmentally protective methods." },
      { title: "Step 3", subtitle: "Effective Treatment", icon: processTreatment, description: "We use a combination of exclusion, baiting, trapping, and other advanced methods." },
      { title: "Step 4", subtitle: "Monitoring & Evaluation", icon: processStep4, description: "Rodent control doesn't stop at eradication. We continuously monitor to ensure successful results." },
      { title: "Step 5", subtitle: "Preventative Care", icon: processStep3, description: "Our comprehensive service includes guidance on maintaining a rodent-free environment." },
    ],
    extraSections: [
      {
        title: "Rodent Habitats & Harborage",
        content: [
          "Mice and rats are experts at finding shelter, especially in human-made structures. These rodents thrive in dark, hidden spaces and can make their homes in attics, crawl spaces, basements, and even within wall voids.",
        ],
      },
      {
        title: "Health Risks Related to Mice & Rats",
        content: [
          "Rodents pose the possibility of severe health threats to humans, often transmitting dangerous diseases.",
          "**Hantavirus:** Spread through contact with droppings or urine, this disease can lead to severe respiratory issues.",
          "**Leptospirosis:** This bacterial infection is transmitted through rat urine.",
          "**Salmonellosis:** Caused by exposure to rodent feces.",
          "**Rat-bite Fever:** Passed through bites or scratches.",
        ],
      },
      {
        title: "Signs of a Rodent Infestation",
        content: ["Think you might have unwanted furry visitors? Keep an eye out for these signs of infestation."],
        bulletPoints: [
          "**Droppings:** Rodent droppings are often shiny black (rats) or small and smooth with pointed ends (mice).",
          "**Chewed Holes:** Look for gnawed holes in walls, floors, wires, or food packaging.",
          "**Noises:** Scampering and scratching behind the walls.",
          "**Urine Odors & Marks:** Foul smells or greasy marks left along walls and baseboards.",
        ],
      },
    ],
    whyChooseUs: [
      { icon: provenResults, title: "Experienced Professionals", description: "We are members of the NPMA and the TPCA." },
      { icon: comprehensive, title: "Comprehensive Rodent Management", description: "We perform a full site evaluation and implement strategies beyond quick fixes." },
      { icon: safety, title: "Local Expertise", description: "Based in Tyler, TX, we know the common rodent threats in our area." },
      { icon: guarantee, title: "Environmentally Responsible Solutions", description: "Our IPM approach prioritizes environmentally friendly solutions." },
      { icon: superPowered, title: "Customer Focused", description: "We're not just about extermination—we're here to provide peace of mind." },
    ],
    bottomCTA: {
      title: "Protect Your Property Today",
      text: "Don't let rodents wreak havoc in your home or business.",
    },
    bottomImage: houseMouseImg,
    bottomImageAlt: "Eastern House Mouse and Rodent Control Services Tyler TX",
  },
  "mosquito-control": {
    title: "Mosquito Control Service",
    subtitle: "Mosquitos",
    heroImage: pestControlHero,
    heroAlt: "Aedes Mosquito Control Service in Tyler TX",
    intro: "At Dang Pest Control, we understand how frustrating mosquitos can be—interrupting your peaceful evenings, ruining family barbecues, and putting your health at risk.",
    processTitle: "Our Mosquito Treatment Process",
    processIntro: "Here's what you can expect from our mosquito treatment process:",
    steps: [
      { title: "Step 1", subtitle: "Property Assessment & Identification", icon: processStep1, description: "Our expert technicians will inspect your property to identify mosquito habitats, breeding sites, and entry points." },
      { title: "Step 2", subtitle: "Customized Mosquito Treatment", icon: processStep2, description: "We implement a multi-step plan to target mosquitos at every stage of their lifecycle." },
      { title: "Step 3", subtitle: "Long-Term Reduction", icon: processStep3, description: "We don't just spray and leave. We actively monitor the effectiveness of our treatments." },
      { title: "Step 4", subtitle: "Ongoing Monitoring & Prevention", icon: processStep4, description: "If mosquitos persist between treatments, we'll come back and retreat for free—guaranteed." },
    ],
    extraSections: [
      {
        title: "In2Care Stations Mosquito Treatments",
        content: [
          "Our In2Care mosquito stations provide an innovative and eco-friendly solution for long-term mosquito control.",
          "The In2Care system also targets adult mosquitos, reducing their ability to spread diseases like West Nile virus and Zika.",
        ],
      },
      {
        title: "Mosquito Fogging/Misting Treatments",
        content: [
          "Using a professional-grade fogger, we disperse a fine mist of EPA-approved insecticide onto foliage, where mosquitos rest during the day.",
        ],
      },
      {
        title: "Protect Your Home & Family from Mosquitos",
        content: [
          "Mosquitos aren't just a nuisance; they're a serious health threat. With 176 mosquito species in the U.S., these pests are responsible for spreading diseases like West Nile virus, encephalitis, dengue, and even malaria.",
        ],
      },
    ],
    whyChooseUs: [
      { icon: provenResults, title: "Expert Knowledge", description: "We're part of the NPMA and the TPCA, ensuring the highest standards." },
      { icon: comprehensive, title: "Environmentally Conscious", description: "We design eco-friendly solutions that target mosquitos while protecting beneficial insects." },
      { icon: safety, title: "Guaranteed Results", description: "We promise a noticeable reduction in mosquitos—or we'll retreat for free." },
      { icon: guarantee, title: "Comprehensive Services", description: "Our technicians are trained to handle all types of pests, not just mosquitos." },
    ],
    bottomCTA: {
      title: "Get Your Quote Today",
      text: "Mosquitos aren't just an annoyance—they're a threat to your health and well-being. Protect your family, pets, and property today.",
    },
  },
  "flea-tick-control": {
    title: "Flea & Tick Control Service",
    subtitle: "Fleas & Ticks",
    heroImage: fleaTickHero,
    heroAlt: "Tick Control Services in Tyler TX",
    intro: "Fleas and ticks are more than just an annoyance—they're a threat to your family's comfort. At Dang Pest Control, we provide professional flea and tick pest control services.",
    processTitle: "Comprehensive Flea & Tick Control Process",
    processIntro: "At Dang Pest Control, our technicians take a thorough, integrated approach:",
    steps: [
      { title: "Step 1", subtitle: "Inspection & Identification", icon: processStep1, description: "We begin by pinpointing the source of your flea or tick problem." },
      { title: "Step 2", subtitle: "Integrated Pest Management Plan", icon: processStep2, description: "Once the issue is assessed, we create a tailored plan using eco-friendly and pet-friendly applications." },
      { title: "Step 3", subtitle: "Treatment & Application", icon: processStep3, description: "Our treatments target problem areas both indoors and outdoors." },
      { title: "Step 4", subtitle: "Monitoring & Evaluation", icon: processStep4, description: "After treatment, we follow up to evaluate the results." },
    ],
    extraSections: [
      {
        title: "Why Flea & Tick Pest Control Is Important",
        content: [],
        bulletPoints: [
          "Fleas are known carriers of diseases like flea-borne typhus and plague.",
          "Ticks can transmit diseases like Lyme disease, anaplasmosis, and Rocky Mountain spotted fever.",
          "Infestations can cause painful itching, allergic reactions, and secondary skin infections.",
        ],
      },
      {
        title: "Signs You Might Have an Infestation",
        content: [],
        bulletPoints: [
          "Excessive scratching in pets",
          "Black or brown specks (flea dirt) on pet fur, skin, or furniture",
          "Sightings of fleas or ticks on your carpet, furniture, or yard",
          "Presence of wildlife near your property, which can carry ticks",
        ],
      },
    ],
    whyChooseUs: [
      { icon: provenResults, title: "Expert Technicians", description: "Our skilled technicians have extensive knowledge of flea and tick behaviors." },
      { icon: comprehensive, title: "Comprehensive Approach", description: "We don't believe in \"quick fixes.\"" },
      { icon: safety, title: "Eco-Friendly Methods", description: "All treatments are specially formulated to be child, pet, and environmentally friendly." },
      { icon: guarantee, title: "Proven Results", description: "Our treatments are designed to keep fleas and ticks away." },
      { icon: superPowered, title: "Locally Owned & Operated", description: "Based in Tyler, TX, we proudly serve surrounding areas." },
    ],
    bottomCTA: {
      title: "Don't Wait—Get Protected Today",
      text: "It's time to protect your family, pets, and property with professional, dependable pest control services.",
    },
    bottomImage: petsFleaImg,
    bottomImageAlt: "Pet and Dog Flea Control Services in Tyler TX",
  },
  "roach-control": {
    title: "Cockroach Pest Control Services",
    subtitle: "Roaches",
    heroImage: roachHero,
    heroAlt: "Cockroach Pest Control Services in Tyler TX",
    intro: "A cockroach infestation can quickly turn into a nightmare. At Dang Pest Control, we're here to provide you with effective, long-term solutions.",
    processTitle: "Our Expert Cockroach Treatment Process",
    processIntro: "We use a proven process to target even the most stubborn infestations.",
    steps: [
      { title: "Step 1", subtitle: "Thorough Inspection", icon: processStep1, description: "Our trained technicians identify the species of cockroaches and determine their entry points." },
      { title: "Step 2", subtitle: "Integrated Pest Management Plan", icon: processStep2, description: "We implement a customized and environmentally conscious treatment plan." },
      { title: "Step 3", subtitle: "Treatment Application", icon: processTreatment, description: "Our treatments are designed to quickly eliminate cockroaches while remaining family and pets friendly." },
      { title: "Step 4", subtitle: "Effectiveness Monitoring", icon: processStep4, description: "Our team monitors the results of the treatment." },
      { title: "Step 5", subtitle: "Preventative Care", icon: processStep3, description: "We identify environmental factors and provide tips to prevent future infestations." },
    ],
    extraSections: [
      {
        title: "About Cockroaches in East Texas",
        content: [
          "Cockroaches are one of the most persistent, resilient, and unsanitary pests in East Texas, thriving in warm, humid environments.",
          "Cockroaches pose serious health risks, as they carry bacteria, viruses, and allergens.",
          "At Dang Pest Control, we specialize in comprehensive cockroach control.",
        ],
      },
    ],
    whyChooseUs: [
      { icon: provenResults, title: "Experienced Professionals", description: "Our skilled technicians have years of expertise." },
      { icon: comprehensive, title: "Environmentally Responsible Solutions", description: "We go beyond quick fixes." },
      { icon: safety, title: "Comprehensive Services", description: "Beyond cockroach pest control, we provide solutions for many pests." },
      { icon: guarantee, title: "Customer-Centered Approach", description: "Your satisfaction and peace of mind are our priority." },
      { icon: superPowered, title: "Local Expertise", description: "We proudly serve Tyler, TX, and nearby areas." },
    ],
    bottomCTA: {
      title: "Get Started With Your Quote",
      text: "Dang Pest Control offers solutions designed to protect your home or property from cockroach infestations effectively.",
    },
  },
  "bed-bug-control": {
    title: "Bed Bug Control Services",
    subtitle: "Bed Bugs",
    heroImage: bedBugHero,
    heroAlt: "Bed Bug Pest Control Service in Tyler TX",
    intro: "When it comes to bed bug infestations, you need a reliable partner to restore your peace of mind—and your home. At Dang Pest Control, we specialize in effective, professional bed bug control services.",
    processTitle: "Our Bed Bug Control Process",
    processIntro: "Our bed bug pest control services follow a proven process.",
    steps: [
      { title: "Step 1", subtitle: "Inspection & Identification", icon: processStep1, description: "Our skilled technicians conduct a comprehensive inspection to identify bed bugs and locate their hiding spots." },
      { title: "Step 2", subtitle: "Integrated Pest Management Plan", icon: processStep2, description: "We design an Integrated Pest Management Plan tailored to your specific needs." },
      { title: "Step 3", subtitle: "Thorough Treatment", icon: processStep3, description: "We use environmentally protective methods to eliminate every stage of the bed bug lifecycle." },
      { title: "Step 4", subtitle: "Monitoring & Follow-Up Care", icon: processStep4, description: "After treatment, we monitor the effectiveness and conduct follow-ups. We protect your space for up to 3 consecutive months post-treatment." },
    ],
    extraSections: [
      {
        title: "Your Solution to Bed Bug Infestations",
        content: [
          "Bed bugs are small, persistent pests that can wreak havoc on your home and peace of mind. Found in bedding, furniture, walls, and even clothing, these bugs spread easily.",
        ],
      },
      {
        title: "Facts About Bed Bugs",
        content: [
          "Bed bugs are a common problem across the United States, impacting approximately 20% of homes and hotels each year.",
          "Our specialized bed bug extermination service includes a thorough inspection followed by a targeted treatment plan.",
        ],
      },
    ],
    whyChooseUs: [
      { icon: provenResults, title: "Comprehensive Bed Bug Control Services", description: "From detailed inspections to thorough treatments, we leave nothing to chance." },
      { icon: comprehensive, title: "Certified & Trusted Technicians", description: "Our team is part of the NPMA and TPCA." },
      { icon: safety, title: "Environmentally Friendly Solutions", description: "We prioritize solutions that are effective yet environmentally protective." },
      { icon: guarantee, title: "Expertise Beyond Bed Bugs", description: "Our services extend to a wide range of pests." },
      { icon: customPlans, title: "Local & Reliable Service", description: "We take pride in serving our neighbors in Tyler and surrounding areas." },
    ],
    whyChooseIntro: "When it comes to bed bug control, experience and expertise matter.",
    faqs: [
      { question: "How common are bed bugs?", answer: "The Southeast region of the U.S. has the highest concentration of bed bugs, accounting for 29% of the country's infestations." },
      { question: "How do bed bugs spread?", answer: "Bed bugs spread quickly by hitching a ride on people's clothing or luggage. They can be found in any environment where people are in large groups." },
      { question: "What are bed bugs like?", answer: "Bed bugs are small, flat, wingless insects that are reddish-brown in color. They are about the size of a Lincoln penny head." },
      { question: "Are bed bugs a sign of poor hygiene?", answer: "No. Bedbugs are attracted to warmth, blood, and carbon dioxide, not dirt." },
      { question: "What are the symptoms of bed bug bites?", answer: "The primary side effect is intense itching at the bite site, often appearing as red bumps in a line or cluster." },
      { question: "What does bed bug extermination include?", answer: "Our treatments include identifying the source, an Integrated Pest Management Plan, and follow-up care." },
      { question: "How much preparation is required?", answer: "Some preparation is required. House cleaning is suggested. Please refrain from vacuuming up bed bug carcasses or droppings." },
    ],
    bottomCTA: {
      title: "Get Your Free Quote",
      text: "Don't allow bed bugs to disrupt your life. Act now with Dang Pest Control's proven bed bug control services.",
    },
  },
  "termite-control": {
    title: "Termite Control & Treatment Services",
    subtitle: "Termite Control",
    heroImage: termiteHero,
    heroAlt: "Termite Control and Treatment Services in Tyler TX",
    intro: "Termites cause billions of dollars in damage every year. At Dang Pest Control, we provide comprehensive termite treatment solutions to protect your home and investment. Our licensed technicians use proven methods to eliminate active infestations and prevent future colonies from taking hold.",
    processTitle: "Our Termite Treatment Process",
    processIntro: "We use a multi-step approach to ensure complete termite elimination and long-term prevention.",
    steps: [
      { title: "Step 1", subtitle: "Comprehensive Inspection", icon: processStep1, description: "Our licensed inspectors conduct a thorough evaluation of your property, identifying signs of termite activity, damage, and conditions conducive to infestation." },
      { title: "Step 2", subtitle: "Customized Treatment Plan", icon: processStep2, description: "Based on our findings, we develop a targeted treatment plan using the most effective methods for your specific termite species and situation." },
      { title: "Step 3", subtitle: "Professional Treatment", icon: processStep3, description: "Our technicians apply professional-grade treatments including liquid barriers, bait systems, or a combination approach to eliminate the colony." },
      { title: "Step 4", subtitle: "Monitoring & Prevention", icon: processStep4, description: "We implement ongoing monitoring to ensure complete elimination and prevent re-infestation. Regular follow-ups keep your home protected year-round." },
    ],
    extraSections: [
      {
        title: "Understanding Termite Damage",
        content: [
          "Termites are often called \"silent destroyers\" because they can cause extensive damage before homeowners even realize they're present.",
          "Subterranean termites are the most common and destructive species in East Texas, building mud tubes to travel between their underground colonies and your home's wood structures.",
          "Without professional treatment, termite colonies can grow to millions of individuals, consuming wood 24 hours a day, 7 days a week.",
        ],
        image: antsVsTermitesImg,
        imageAlt: "Termite damage identification and control",
      },
    ],
    whyChooseUs: [
      { icon: provenResults, title: "Licensed Termite Experts", description: "Our technicians are specifically licensed and trained in termite biology, identification, and treatment methods." },
      { icon: comprehensive, title: "Comprehensive Treatment Options", description: "We offer liquid treatments, bait systems, and combination approaches tailored to your property." },
      { icon: safety, title: "Environmentally Responsible", description: "Our Integrated Pest Management approach ensures effective treatment while minimizing environmental impact." },
      { icon: guarantee, title: "Protection Guarantee", description: "We stand behind our termite treatments with a satisfaction guarantee and follow-up service." },
      { icon: localExperts, title: "Local East Texas Expertise", description: "We understand the specific termite species and conditions in our region." },
    ],
    whyChooseIntro: "Termite control requires specialized knowledge and professional-grade treatment methods.",
    bottomCTA: {
      title: "Protect Your Home from Termites",
      text: "Don't wait until termites cause costly structural damage. Call Dang Pest Control today for a professional termite inspection and treatment plan.",
    },
  },
};

export const serviceKeys = Object.keys(servicesData);
