import React, { useState, useEffect, useRef } from 'react';
import { Training, Material } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Users, BookOpen, Upload, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';

export function TrainerDashboard() {
  const { currentUser } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      fetchTrainings();
    }
  }, [currentUser]);

  const fetchTrainings = () => {
    fetch('/api/trainings')
      .then(res => res.json())
      .then(data => {
        setTrainings(data.filter((t: Training) => t.trainer_id === currentUser?.id));
      });
  };

  const loadMaterials = (trainingId: number) => {
    fetch(`/api/trainings/${trainingId}/materials`)
      .then(res => res.json())
      .then(data => setMaterials(data));
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/trainings/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchTrainings();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTraining || !currentUser) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaded_by', currentUser.id.toString());

    try {
      const res = await fetch(`/api/trainings/${selectedTraining.id}/materials`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        loadMaterials(selectedTraining.id);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Upload failed', err);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Assigned Trainings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trainings.map(training => (
              <div 
                key={training.id} 
                className={`bg-white rounded-xl shadow-sm border p-5 cursor-pointer transition-all ${
                  selectedTraining?.id === training.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => {
                  setSelectedTraining(training);
                  loadMaterials(training.id);
                }}
              >
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
                
                <div className="space-y-2.5 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span>{training.topic}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{format(new Date(training.date), 'MMM dd, yyyy')}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4" onClick={e => e.stopPropagation()}>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Update Status</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2"
                    value={training.status}
                    onChange={(e) => updateStatus(training.id, e.target.value)}
                  >
                    <option value="PLANNED">Planned</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
            
            {trainings.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No Assigned Trainings</h3>
                <p className="text-gray-500 mt-1">You haven't been assigned to conduct any trainings yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Training Materials</h2>
            
            {!selectedTraining ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Select a training to manage materials.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 mb-4">
                  <h4 className="font-medium text-indigo-900 text-sm">{selectedTraining.title}</h4>
                </div>
                
                <div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Material
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">Supported: PDF, PPT, DOCX, MP4</p>
                </div>

                <div className="space-y-2 mt-4">
                  <h5 className="text-sm font-medium text-gray-700">Uploaded Files ({materials.length})</h5>
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
                    <div className="text-sm text-gray-500 text-center py-4">No materials uploaded yet.</div>
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
