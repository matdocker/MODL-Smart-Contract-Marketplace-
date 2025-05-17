// components/PageContainer.tsx
export default function PageContainer({ children }: { children: React.ReactNode }) {
    return (
      <div className="w-full max-w-screen-xl mx-auto space-y-6">
        {children}
      </div>
    );
  }
  