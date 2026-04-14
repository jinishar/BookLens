export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center">
      <div className={`${sizes[size]} rounded-full border-2 animate-spin`}
        style={{ borderColor: 'rgba(99,102,241,0.2)', borderTopColor: '#6366f1' }} />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="h-48 shimmer" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 shimmer w-3/4" />
        <div className="h-3 shimmer w-1/2" />
        <div className="h-3 shimmer w-1/4" />
        <div className="h-8 shimmer mt-2" />
      </div>
    </div>
  );
}
