import Image from 'next/image'

export function BrandLogo({ size = 40 }: { size?: number }) {
  return (
    <Image
      src="/brand/pacemate-logo.png"
      width={size}
      height={size}
      alt="PaceMate logo"
      className="shrink-0 object-contain"
    />
  )
}
