import Greeting from "../components/Greeting";

const Header = () => {
  return (
    <header className="w-full bg-white shadow-md z-10">
      <div className="px-4 py-4 flex items-center justify-between h-20 bg-white/80 backdrop-blur-md shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)]">
        <h1 className="text-2xl font-bold text-gray-800 whitespace-nowrap">
          TaskMasterAI
        </h1>

        {/* Greeting scroll area */}
        <div className="relative flex-1 h-6 overflow-hidden">
          <Greeting />
        </div>

        <nav className="flex space-x-6 whitespace-nowrap">
          <a href="/" className="text-gray-600 hover:text-gray-900 transition">
            Home
          </a>
          <a
            href="/login"
            className="text-gray-600 hover:text-gray-900 transition"
          >
            Login
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
