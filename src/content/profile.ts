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
    'Edirne’de yazılım geliştirme alanında çalışmalar yürüten, Flutter ve modern web teknolojilerine odaklanan bir yazılım geliştiriciyim. 2 yıllık profesyonel deneyimimle mobil uygulamalar, web çözümleri ve ölçeklenebilir yazılım mimarileri geliştiriyorum.',
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
        'Okan Sakarya. Edirne’de yazılım geliştirme alanında çalışıyorum; Flutter ile mobil, React ve FastAPI ile web tarafında çözüm üretiyorum.',
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
