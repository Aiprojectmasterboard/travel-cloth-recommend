import Image from 'next/image'

export interface ImageCardProps {
  src: string
  alt: string
  caption?: string
  blurred?: boolean
  blurLabel?: string
  className?: string
  priority?: boolean
}

export default function ImageCard({
  src,
  alt,
  caption,
  blurred = false,
  blurLabel,
  className = '',
  priority = false,
}: ImageCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-[#F5EFE6] ${className}`}
      style={{ aspectRatio: '3/4' }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
          blurred ? 'blur-md brightness-75' : ''
        }`}
        priority={priority}
      />

      {blurred && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1410]/20 backdrop-blur-sm">
          {blurLabel && (
            <p className="text-white text-sm font-medium text-center px-4 drop-shadow">
              {blurLabel}
            </p>
          )}
        </div>
      )}

      {caption && !blurred && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-3 pt-8">
          <p className="text-white text-xs tracking-wide">{caption}</p>
        </div>
      )}
    </div>
  )
}
