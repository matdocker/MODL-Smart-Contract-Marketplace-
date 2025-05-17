export function formatTimestamp(unix: number): string {
    const date = new Date(unix * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
  
    const minutes = Math.floor(diffMs / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
  
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
  
    return date.toLocaleDateString(); // fallback for old timestamps
  }
  