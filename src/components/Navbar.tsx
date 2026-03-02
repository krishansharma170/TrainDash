import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

export function Navbar() {
  const { currentUser, users, login, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5 fixed left-0 right-0 top-0 z-50">
      <div className="flex flex-wrap justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center">
          <span className="self-center text-xl font-semibold whitespace-nowrap text-indigo-600">
            TrainDash
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UserIcon className="w-4 h-4" />
            <select 
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2"
              value={currentUser?.id || ''}
              onChange={(e) => login(Number(e.target.value))}
            >
              <option value="" disabled>Select User to Login</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>
          
          {currentUser && (
            <button 
              onClick={logout}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
