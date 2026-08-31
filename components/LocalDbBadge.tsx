// Renders only when the app is pointed at a local Supabase, so it is obvious
// at a glance whether what you are looking at is safe to break. Nothing shows
// in production, where NEXT_PUBLIC_SUPABASE_URL is the hosted project.
const isLocalDb = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return url.includes('localhost') || url.includes('127.0.0.1')
}

const LocalDbBadge = ({ darkMode = false }: { darkMode?: boolean }) => {
  if (!isLocalDb()) return null

  return (
    <div
      title={process.env.NEXT_PUBLIC_SUPABASE_URL}
      className={`flex items-center space-x-1.5 px-2 py-1 rounded-sm border font-bold text-[10px] tracking-wider uppercase whitespace-nowrap ${
        darkMode
          ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
          : 'bg-amber-100 border-amber-400 text-amber-800'
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      <span>Using Local DB</span>
    </div>
  )
}

export default LocalDbBadge
