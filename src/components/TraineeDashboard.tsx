import React, { useState, useEffect } from 'react';
import { Nomination, Material } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, MapPin, Clock, BookOpen, Download, FileText, MessageSquare, X } from 'lucide-react';
import { format } from 'date-fns';

export function TraineeDashboard() {
  const { currentUser } = useAuth();
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<Nomination | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    topic_score: 5,
    trainer_score: 5,
    usefulness_score: 5,
    comments: ''
  });

  useEffect(() => {
    if (currentUser) {
      fetchNominations();
    }
  }, [currentUser]);

  const fetchNominations = () => {
    fetch(`/api/users/${currentUser?.id}/nominations`)
      .then(res => res.json())
      .then(data => setNominations(data));
  };

  const loadMaterials = (trainingId: number) => {
    fetch(`/api/trainings/${trainingId}/materials`)
      .then(res => res.json())
      .then(data => setMaterials(data));
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTraining || !currentUser) return;

    try {
      const res = await fetch(`/api/trainings/${selectedTraining.training_id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainee_id: currentUser.id,
          ...feedbackForm
        })
      });

      if (res.ok) {
        setShowFeedbackModal(false);
        alert('Feedback submitted successfully!');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to submit feedback');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Trainings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nominations.map(nom => (
              <div 
                key={nom.id} 
                className={`bg-white rounded-xl shadow-sm border p-5 cursor-pointer transition-all ${
                  selectedTraining?.id === nom.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => {
                  setSelectedTraining(nom);
                  loadMaterials(nom.training_id);
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{nom.title}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    nom.training_status === 'PLANNED' ? 'bg-blue-100 text-blue-800' :
                    nom.training_status === 'ONGOING' ? 'bg-yellow-100 text-yellow-800' :
                    nom.training_status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {nom.training_status}
                  </span>
                </div>
                
                <div className="space-y-2.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{nom.date ? format(new Date(nom.date), 'MMM dd, yyyy') : 'TBD'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{nom.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{nom.venue}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100">
                   <span className="text-sm text-indigo-700 font-medium flex items-center gap-2">
                     Nomination Status: {nom.status}
                   </span>
                </div>
              </div>
            ))}
            
            {nominations.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No Trainings Yet</h3>
                <p className="text-gray-500 mt-1">You haven't been nominated for any trainings yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Training Details</h2>
            
            {!selectedTraining ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Select a training to view materials and provide feedback.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <h4 className="font-medium text-indigo-900 text-sm">{selectedTraining.title}</h4>
                </div>

                {selectedTraining.training_status === 'COMPLETED' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <MessageSquare className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <h5 className="text-sm font-medium text-green-900 mb-1">Training Completed</h5>
                    <p className="text-xs text-green-700 mb-3">Please share your experience to help us improve.</p>
                    <button 
                      onClick={() => setShowFeedbackModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full"
                    >
                      Provide Feedback
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Materials ({materials.length})</h5>
                  {materials.map(mat => (
                    <div key={mat.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700 truncate" title={mat.original_name}>
                          {mat.original_name}
                        </span>
                      </div>
                      <a 
                        href={`/api/materials/${mat.id}/download`}
                        download
                        className="text-gray-500 hover:text-indigo-600 p-1"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                  {materials.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4">No materials available yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedTraining && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold text-gray-900 mb-1">Training Feedback</h2>
            <p className="text-sm text-gray-500 mb-6">{selectedTraining.title}</p>
            
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic Relevance (1-5)</label>
                <input 
                  type="range" min="1" max="5" 
                  className="w-full"
                  value={feedbackForm.topic_score}
                  onChange={e => setFeedbackForm({...feedbackForm, topic_score: Number(e.target.value)})}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor</span><span>Excellent</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trainer Effectiveness (1-5)</label>
                <input 
                  type="range" min="1" max="5" 
                  className="w-full"
                  value={feedbackForm.trainer_score}
                  onChange={e => setFeedbackForm({...feedbackForm, trainer_score: Number(e.target.value)})}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor</span><span>Excellent</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Overall Usefulness (1-5)</label>
                <input 
                  type="range" min="1" max="5" 
                  className="w-full"
                  value={feedbackForm.usefulness_score}
                  onChange={e => setFeedbackForm({...feedbackForm, usefulness_score: Number(e.target.value)})}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor</span><span>Excellent</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Comments</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  rows={3}
                  placeholder="What did you like? What could be improved?"
                  value={feedbackForm.comments}
                  onChange={e => setFeedbackForm({...feedbackForm, comments: e.target.value})}
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
