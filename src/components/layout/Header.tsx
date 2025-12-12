import { useUser } from '../../context/UserContext'

export default function Header() {
  const { user } = useUser()

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-navy-900 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">U</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">ump.ai</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-6">
          {/* System Status */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="w-2 h-2 bg-green-accent rounded-full" />
            <span className="uppercase tracking-wider text-xs">System Operational</span>
          </div>

          {/* User Avatar */}
          <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">{user.initials}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

