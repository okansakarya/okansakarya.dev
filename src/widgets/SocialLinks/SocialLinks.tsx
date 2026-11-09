import githubLogo from '../../assets/tech/github.svg'
import linkedinLogo from '../../assets/tech/linkedin.svg'
import { profile } from '../../content/profile'
import { Button } from '../Button/Button'
import './SocialLinks.css'

type SocialLinksProps = {
  size?: 'md' | 'sm'
}

export function SocialLinks({ size = 'md' }: SocialLinksProps) {
  return (
    <div className="social-links">
      <Button href={profile.githubUrl} variant="ghost" size={size}>
        <img src={githubLogo} alt="" width={18} height={18} />
        GitHub
      </Button>
      <Button href={profile.linkedinUrl} variant="ghost" size={size}>
        <img src={linkedinLogo} alt="" width={18} height={18} />
        LinkedIn
      </Button>
    </div>
  )
}
