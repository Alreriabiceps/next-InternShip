'use client';

import Link from 'next/link';
import { Intern } from '../types';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  FileText, 
  Trash2,
  Edit2,
  ChevronRight,
  Loader2
} from 'lucide-react';
import ListContainer from '@/components/lists/ListContainer';
import { cloudinaryThumbnail } from '@/lib/cloudinary-thumbnail';

interface InternListProps {
  interns: Intern[];
  loading: boolean;
  onDelete: (id: string) => void;
  onEdit: (intern: Intern) => void;
}

export default function InternList({ interns, loading, onDelete, onEdit }: InternListProps) {
  return (
    <ListContainer 
      loading={loading && interns.length === 0}
      isEmpty={interns.length === 0}
      emptyMessage="No interns registered in the system yet."
      title="Active Interns"
    >
      {interns.map((intern, index) => (
        <motion.div
          key={intern._id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group px-6 py-5 hover:bg-black/[0.02] transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            {/* Left Section - Avatar & Basic Info */}
            <div className="flex items-center space-x-5 flex-1 min-w-0">
              {intern.profilePicture ? (
                <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform duration-300 border-2 border-macos-blue/20">
                  <img
                    src={cloudinaryThumbnail(intern.profilePicture, 48, 48)}
                    alt={intern.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-macos-blue/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <User className="w-6 h-6 text-macos-blue" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {intern.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-black/5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {intern.studentId}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Mail className="w-3.5 h-3.4 mr-1.5 opacity-70" />
                    <span className="truncate">{intern.email}</span>
                  </div>
                  {intern.phone && (
                    <div className="flex items-center">
                      <Phone className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                      <span>{intern.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Section - Company Info */}
            <div className="hidden lg:flex flex-col space-y-1.5 px-8 border-l border-black/5 flex-1 max-w-[300px]">
              <div className="flex items-center text-sm font-semibold text-gray-700">
                <Building2 className="w-4 h-4 mr-2 text-macos-gray opacity-60" />
                <span className="truncate">{intern.company}</span>
              </div>
              {intern.companyAddress && (
                <div className="flex items-start text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 mr-2 text-macos-gray opacity-60 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{intern.companyAddress}</span>
                </div>
              )}
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-2 ml-6">
              <Link
                href={`/main/logs?internId=${intern._id}`}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-bold text-macos-blue hover:bg-macos-blue/10 rounded-xl transition-all duration-200"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Logs</span>
              </Link>
              
              <button
                onClick={() => onEdit(intern)}
                className="p-2 text-gray-400 hover:text-macos-blue hover:bg-macos-blue/10 rounded-xl transition-all duration-200"
                title="Edit Intern"
              >
                <Edit2 className="w-4.5 h-4.5" />
              </button>
              
              <button
                onClick={() => onDelete(intern._id)}
                className="p-2 text-gray-400 hover:text-macos-red hover:bg-macos-red/10 rounded-xl transition-all duration-200"
                title="Delete Intern"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
              
              <div className="pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </ListContainer>
  );
}
