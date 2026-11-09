import './TechMarquee.css'

export type Technology = {
  name: string
  logo: string
}

type TechMarqueeProps = {
  items: Technology[]
  label: string
}

// The track holds four identical copies and slides by half its width, so the
// loop is seamless even on screens wider than two copies of a short list.
const COPIES = 4

export function TechMarquee({ items, label }: TechMarqueeProps) {
  return (
    <div className="tech-marquee" role="region" aria-label={label} tabIndex={0}>
      <div className="tech-marquee__track">
        {Array.from({ length: COPIES }, (_, copy) => (
          <ul
            key={copy}
            className="tech-marquee__group"
            aria-hidden={copy > 0 ? true : undefined}
          >
            {items.map((item) => (
              <li key={item.name} className="tech-marquee__item">
                <img src={item.logo} alt="" width={18} height={18} draggable={false} />
                {item.name}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}
