// components/Skeleton.tsx
export default function Skeleton({ height = 'h-4', width = 'w-full' }) {
    return <div className={`animate-pulse rounded bg-gray-300 ${height} ${width}`}></div>;
  }
  