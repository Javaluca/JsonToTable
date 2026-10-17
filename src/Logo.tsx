type LogoProps = {
  size?: 'sm' | 'md'
}

export default function Logo({ size = 'sm' }: LogoProps) {
  return (
    <span className={`logo logo-${size}`} title="Json To Table" aria-hidden="true">
      J2T
    </span>
  )
}
