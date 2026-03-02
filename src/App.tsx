import { useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/AdminDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { TraineeDashboard } from './components/TraineeDashboard';
import { TrainerDashboard } from './components/TrainerDashboard';

function DashboardRouter() {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to TrainDash</h2>
          <p className="text-gray-600 mb-6">Please select a user from the top navigation to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {currentUser.role === 'ADMIN' && <AdminDashboard />}
        {currentUser.role === 'TRAINER' && <TrainerDashboard />}
        {currentUser.role === 'MANAGER' && <ManagerDashboard />}
        {currentUser.role === 'TRAINEE' && <TraineeDashboard />}
      </main>
    </div>
  );
}

export default function App() {
  return <DashboardRouter />;
}
