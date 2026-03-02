import React, { useState, useEffect } from 'react';
import { Training, User, Analytics } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Calendar, MapPin, Clock, Users, BookOpen, BarChart3, List } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'trainings' | 'analytics'>('trainings');
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [trainers, setTrainers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newTraining, setNewTraining] = useState({
    title: '',
    topic: '',
    date: '',
    time: '',
    venue: '',
    trainer_id: '',
    max_seats: 20
  });

  useEffect(() => {
    fetchTrainings();
    fetchTrainers();
    fetchAnalytics();
  }, []);

  const fetchTrainings = () => {
    fetch('/api/trainings')
      .then(res => res.json())
      .then(data => setTrainings(data));
  };

  const fetchTrainers = () => {
    fetch('/api/users/role/ADMIN') // Assuming ADMIN can also be trainer based on seed
      .then(res => res.json())
      .then(data => setTrainers(data));
  };

  const fetchAnalytics = () => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(data => setAnalytics(data));
  };

  const handleCreateTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/trainings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTraining)
    });
    setIsCreating(false);
    fetchTrainings();
    fetchAnalytics();
    setNewTraining({ title: '', topic: '', date: '', time: '', venue: '', trainer_id: '', max_seats: 20 });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Training Management</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('trainings')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'trainings' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            <List className="w-4 h-4" />
            Trainings
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'analytics' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
        </div>
      </div>

      {activeTab === 'trainings' && (
        <>
          <div className="flex justify-end">
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Plan New Training
            </button>
          </div>

          {isCreating && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Plan New Training</h2>
              <form onSubmit={handleCreateTraining} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-lg p-2" value={newTraining.title} onChange={e => setNewTraining({...newTraining, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-lg p-2" value={newTraining.topic} onChange={e => setNewTraining({...newTraining, topic: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input required type="date" className="w-full border border-gray-300 rounded-lg p-2" value={newTraining.date} onChange={e => setNewTraining({...newTraining, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time (e.g., 10:00 AM - 12:00 PM)</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-lg p-2" value={newTraining.time} onChange={e => setNewTraining({...newTraining, time: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-lg p-2" value={newTraining.venue} onChange={e => setNewTraining({...newTraining, venue: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trainer</label>
                  <select required className="w-full border border-gray-300 rounded-lg p-2" value={newTraining.trainer_id} onChange={e => setNewTraining({...newTraining, trainer_id: e.target.value})}>
                    <option value="">Select Trainer</option>
                    {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Training</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.map(training => (
              <div key={training.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{training.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      training.status === 'PLANNED' ? 'bg-blue-100 text-blue-800' :
                      training.status === 'ONGOING' ? 'bg-yellow-100 text-yellow-800' :
                      training.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {training.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2.5 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <span>{training.topic}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{format(new Date(training.date), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{training.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{training.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>Trainer: {training.trainer_name}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                   <span className="text-xs text-gray-500 font-medium">Max Seats: {training.max_seats}</span>
                   <button className="text-indigo-600 text-sm font-medium hover:text-indigo-800">View Details</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Status Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.statusCounts}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                    >
                      {analytics.statusCounts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Most Requested Topics */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Requested Topics (Nominations)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.popularTopics} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="topic" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="nomination_count" fill="#6366f1" name="Nominations" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Average Scores by Topic */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Feedback Scores by Topic</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topicScores} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="topic" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg_topic_score" fill="#8b5cf6" name="Topic Relevance" />
                    <Bar dataKey="avg_usefulness_score" fill="#10b981" name="Usefulness" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Average Scores by Trainer */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Trainer Effectiveness Scores</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.trainerScores} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="trainer_name" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg_trainer_score" fill="#f59e0b" name="Trainer Effectiveness" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
