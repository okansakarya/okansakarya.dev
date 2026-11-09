import fastapiLogo from '../assets/tech/fastapi.svg'
import firebaseLogo from '../assets/tech/firebase.svg'
import flutterLogo from '../assets/tech/flutter.svg'
import githubLogo from '../assets/tech/github.svg'
import postgresqlLogo from '../assets/tech/postgresql.svg'
import pythonLogo from '../assets/tech/python.svg'
import reactLogo from '../assets/tech/react.svg'
import supabaseLogo from '../assets/tech/supabase.svg'
import tailwindLogo from '../assets/tech/tailwindcss.svg'

/** Static portfolio copy taken from the Stitch design; projects come from the API. */
export const profile = {
  name: 'Okan Sakarya',
  availability: 'Yeni Fırsatlara ve Projelere Açık',
  headline: ['Kullanıcı Odaklı & Performanslı', 'Mobil & Web', 'Deneyimleri.'],
  intro:
    '2 yıllık yazılım mühendisliği deneyimimle Flutter ve modern web teknolojileri üzerinde temiz kod mimarisiyle çalışıyorum.',
  highlights: [
    { icon: 'verified', label: '2+ Yıl Profesyonel Deneyim' },
    { icon: 'smartphone', label: 'Android & Cross-Platform Mobil' },
    { icon: 'code', label: 'Clean Architecture & Modüler Kod' },
  ],
  technologies: [
    { name: 'Flutter', logo: flutterLogo },
    { name: 'React', logo: reactLogo },
    { name: 'Python', logo: pythonLogo },
    { name: 'FastAPI', logo: fastapiLogo },
    { name: 'PostgreSQL', logo: postgresqlLogo },
    { name: 'Supabase', logo: supabaseLogo },
    { name: 'Firebase', logo: firebaseLogo },
    { name: 'Tailwind CSS', logo: tailwindLogo },
    { name: 'GitHub', logo: githubLogo },
  ],
  email: 'okansakarya79@gmail.com',
  location: 'Edirne / Remote',
  githubUrl: 'https://github.com/okansakarya',
  linkedinUrl: 'https://www.linkedin.com/in/okan-sakarya-2104a718b/',
  about: [
    {
      question: 'Ben kimim?',
      answer:
        'Okan Sakarya. Yazılım mühendisiyim; Flutter ile mobil, React ve FastAPI ile web tarafında çalışıyorum. Edirne’den remote çalışıyorum.',
    },
    {
      question: 'Ne üzerine çalışıyorum?',
      answer:
        'Kullanıcı odaklı mobil ve web uygulamaları. Android ve cross-platform tarafta Flutter, sunucu tarafında Python ve FastAPI kullanıyorum.',
    },
    {
      question: 'Nasıl çalışıyorum?',
      answer:
        'Temiz kod, modüler yapı ve clean architecture. İki yılı aşkın süredir bu yaklaşımla ürün çıkarıyorum.',
    },
    {
      question: 'Birlikte nasıl çalışabiliriz?',
      answer:
        'Yeni projelere açığım. okansakarya79@gmail.com adresinden ya da LinkedIn üzerinden yazabilirsiniz.',
    },
  ],
}
