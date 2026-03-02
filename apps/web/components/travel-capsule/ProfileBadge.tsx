'use client'
import { useAuth } from '@/components/AuthProvider'
import { PlanBadge } from './Badges'

interface ProfileBadgeProps {
  plan?: 'Standard' | 'Pro' | 'Annual'
}
export function ProfileBadge({ plan = 'Standard' }: ProfileBadgeProps) {
  const { user } = useAuth()
  const displayName: string =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    'Traveler'
  const email: string = user?.email ?? ''
  const initials = displayName
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="bg-white border border-[#E8DDD4] p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#C4613A] flex items-center justify-center text-white text-sm font-bold">
          {initials}
        </div>
        <div>
          <p className="text-sm font-bold text-[#1A1410]">{displayName}</p>
          <p className="text-xs text-[#9c8c7e]">{email}</p>
        </div>
      </div>
      <PlanBadge plan={plan} />
    </div>
  )
}
