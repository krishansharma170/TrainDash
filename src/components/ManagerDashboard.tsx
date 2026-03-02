import { useState, useEffect } from 'react';
import { Training, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, MapPin, Clock, Users, BookOpen, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export function ManagerDashboard() {
  const { currentUser } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [nominations, setNominations] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser) {
      fetchTrainings();
      fetchTeam();
    }
  }, [currentUser]);

  const fetchTrainings = () => {
    fetch('/api/trainings')
      .then(res => res.json())
      .then(data => setTrainings(data.filter((t: Training) => t.status === 'PLANNED')));
  };

  const fetchTeam = () => {
    fetch(`/api/managers/${currentUser?.id}/team`)
      .then(res => res.json())
      .then(data => setTeam(data));
  };

  const loadNominations = (trainingId: number) => {
    fetch(`/api/trainings/${trainingId}/nominations`)
      .then(res => res.json())
      .then(data => setNominations(data));
  };

  const handleNominate = async (traineeId: number) => {
    if (!selectedTraining || !currentUser) return;
    
    try {
      const res = await fetch('/api/nominations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          training_id: selectedTraining.id,
          trainee_id: traineeId,
          manager_id: currentUser.id
        })
      });
      
      if (res.ok) {
        loadNominations(selectedTraining.id);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to nominate');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Team Nominations</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Available Trainings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trainings.map(training => (
              <div 
                key={training.id} 
                onClick={() => {
                  setSelectedTraining(training);
                  loadNominations(training.id);
                }}
                className={`bg-white rounded-xl shadow-sm border p-5 cursor-pointer transition-all ${
                  selectedTraining?.id === training.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{training.title}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{format(new Date(training.date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{training.time}</span>
                  </div>
                </div>
              </div>
            ))}
            {trainings.length === 0 && (
              <div className="col-span-2 text-center py-8 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                No upcoming trainings available.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Nominate Team Members</h2>
            
            {!selectedTraining ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Select a training from the list to nominate team members.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 mb-4">
                  <h4 className="font-medium text-indigo-900 text-sm">{selectedTraining.title}</h4>
                  <p className="text-xs text-indigo-700 mt-1">{format(new Date(selectedTraining.date), 'MMM dd, yyyy')}</p>
                </div>
                
                <div className="space-y-2">
                  {team.map(member => {
                    const isNominated = nominations.some(n => n.trainee_id === member.id);
                    return (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm">
                            {member.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{member.name}</span>
                        </div>
                        {isNominated ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Nominated
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleNominate(member.id)}
                            className="text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-600 px-3 py-1 rounded-full transition-colors"
                          >
                            Nominate
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {team.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4">No team members found.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
