'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Intern, InternFormData, InternFilters } from './types';
import InternForm from './components/InternForm';
import InternList from './components/InternList';
import InternFiltersComponent from './components/InternFilters';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, AlertCircle, Edit2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const initialFormData: InternFormData = {
  name: '',
  email: '',
  studentId: '',
  phone: '',
  company: '',
  companyAddress: '',
};

export default function InternPage() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIntern, setEditingIntern] = useState<Intern | null>(null);
  const [formData, setFormData] = useState<InternFormData>(initialFormData);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<InternFilters>({
    search: '',
    company: '',
    activityStatus: 'all',
    sortBy: 'created-newest',
    quickFilter: 'all',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    fetchInterns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.company) params.append('company', filters.company);
      if (filters.activityStatus) params.append('activityStatus', filters.activityStatus);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.quickFilter) params.append('quickFilter', filters.quickFilter);

      const response = await api.get(`/interns?${params.toString()}`);
      setInterns(response.data.interns);
    } catch (error) {
      console.error('Error fetching interns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingIntern) {
        // Update existing intern
        await api.put(`/interns/${editingIntern._id}`, formData);
        setEditingIntern(null);
      } else {
        // Create new intern
        await api.post('/interns', formData);
      }
      setFormData(initialFormData);
      setShowAddForm(false);
      fetchInterns();
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${editingIntern ? 'update' : 'create'} intern`);
    }
  };

  const handleEditClick = (intern: Intern) => {
    setEditingIntern(intern);
    setFormData({
      name: intern.name,
      email: intern.email,
      studentId: intern.studentId,
      phone: intern.phone || '',
      company: intern.company,
      companyAddress: intern.companyAddress,
    });
    setShowAddForm(true);
    setError('');
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingIntern(null);
    setFormData(initialFormData);
    setError('');
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return;

    try {
      await api.delete(`/interns/${deleteConfirm.id}`);
      setDeleteConfirm({ isOpen: false, id: null });
      fetchInterns();
    } catch (error) {
      console.error('Error deleting intern:', error);
      setErrorModal({ isOpen: true, message: 'Failed to delete intern' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Interns</h1>
          <p className="text-gray-500 mt-1">Manage and track all registered interns in the system.</p>
        </div>
        <button
          onClick={() => {
            if (showAddForm) {
              handleCancel();
            } else {
              setShowAddForm(true);
              setEditingIntern(null);
              setFormData(initialFormData);
            }
          }}
          className={cn(
            "flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300",
            showAddForm 
              ? "bg-macos-red/10 text-macos-red hover:bg-macos-red/20" 
              : "mac-button-primary"
          )}
        >
          {showAddForm ? (
            <>
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Add Intern</span>
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="mac-card p-8 mb-8 border-macos-blue/20 bg-macos-blue/[0.02]">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                {editingIntern ? (
                  <>
                    <Edit2 className="w-5 h-5 mr-2 text-macos-blue" />
                    Edit Intern Profile
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2 text-macos-blue" />
                    New Intern Profile
                  </>
                )}
              </h2>
              <InternForm
                formData={formData}
                error={error}
                onChange={setFormData}
                onSubmit={handleSubmit}
                isEditing={!!editingIntern}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <InternFiltersComponent filters={filters} onChange={setFilters} />
        
        <InternList 
          interns={interns} 
          loading={loading} 
          onDelete={handleDeleteClick}
          onEdit={handleEditClick}
        />
      </div>

      {/* macOS Style Modal for Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[400px] mac-card p-8 shadow-2xl"
            >
              <div className="w-16 h-16 bg-macos-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-macos-red" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Intern?</h3>
              <p className="text-sm text-gray-500 text-center mb-8">
                This action cannot be undone. All logs associated with this intern will be permanently removed.
              </p>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleDeleteConfirm}
                  className="w-full py-3 bg-macos-red text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-macos-red/20"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
                  className="w-full py-3 text-gray-600 font-semibold hover:bg-black/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* macOS Style Error Modal */}
      <AnimatePresence>
        {errorModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setErrorModal({ isOpen: false, message: '' })}
              className="absolute inset-0 bg-black/20"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-[350px] mac-card p-6 shadow-xl border-macos-red/20"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-macos-red/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-macos-red" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Something went wrong</h3>
                  <p className="text-sm text-gray-500 mt-1">{errorModal.message}</p>
                </div>
              </div>
              <button
                onClick={() => setErrorModal({ isOpen: false, message: '' })}
                className="w-full py-2.5 mac-button-primary mt-2"
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

