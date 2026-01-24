export interface Intern {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  phone?: string;
  company: string;
  companyAddress: string;
  profilePicture?: string;
  createdAt: string;
}

export interface InternFormData {
  name: string;
  email: string;
  studentId: string;
  phone: string;
  company: string;
  companyAddress: string;
}

export interface InternFilters {
  search: string;
  company: string;
  activityStatus: 'all' | 'with-logs' | 'without-logs' | 'active' | 'inactive';
  sortBy: 'name-asc' | 'name-desc' | 'created-newest' | 'created-oldest' | 'most-active';
  quickFilter: 'all' | 'recently-added' | 'recently-active';
}




