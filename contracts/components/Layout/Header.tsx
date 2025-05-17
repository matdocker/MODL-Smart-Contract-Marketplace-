export default function Header() {
    return (
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
        <h1 className="text-2xl font-semibold text-[#1D6DA6]">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden md:inline">Connected:</span>
          <button className="bg-[#00B2FF] text-white px-4 py-1 rounded hover:bg-[#1D6DA6] text-sm">
            0x52F7...06D5
          </button>
        </div>
      </header>
    );
  }
  