const STUDENT_TOKEN_KEY = 'student_auth_token';
const STUDENT_USER_KEY = 'student_user';
const REMEMBER_ME_KEY = 'student_remember_me';
const REMEMBERED_STUDENT_ID_KEY = 'student_remembered_studentId';
const REMEMBERED_PASSWORD_KEY = 'student_remembered_password';

export const getStudentToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STUDENT_TOKEN_KEY);
};

export const setStudentToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STUDENT_TOKEN_KEY, token);
};

export const clearStudentToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STUDENT_TOKEN_KEY);
};

export const getStudentUser = (): any | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(STUDENT_USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setStudentUser = (user: any): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STUDENT_USER_KEY, JSON.stringify(user));
};

export const clearStudentUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STUDENT_USER_KEY);
};

export const getRememberMe = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
};

export const setRememberMe = (remember: boolean, studentId?: string, password?: string): void => {
  if (typeof window === 'undefined') return;
  if (remember && studentId && password) {
    localStorage.setItem(REMEMBER_ME_KEY, 'true');
    localStorage.setItem(REMEMBERED_STUDENT_ID_KEY, studentId);
    localStorage.setItem(REMEMBERED_PASSWORD_KEY, password);
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem(REMEMBERED_STUDENT_ID_KEY);
    localStorage.removeItem(REMEMBERED_PASSWORD_KEY);
  }
};

export const getRememberedCredentials = (): { studentId: string; password: string } | null => {
  if (typeof window === 'undefined') return null;
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  if (!rememberMe) return null;
  
  const studentId = localStorage.getItem(REMEMBERED_STUDENT_ID_KEY);
  const password = localStorage.getItem(REMEMBERED_PASSWORD_KEY);
  
  if (studentId && password) {
    return { studentId, password };
  }
  return null;
};

export const getReminderPreferences = (): any => {
  if (typeof window === 'undefined') return getDefaultReminderPrefs();
  const prefsStr = localStorage.getItem('student_reminder_prefs');
  if (!prefsStr) return getDefaultReminderPrefs();
  try {
    return JSON.parse(prefsStr);
  } catch {
    return getDefaultReminderPrefs();
  }
};

export const setReminderPreferences = (prefs: any): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('student_reminder_prefs', JSON.stringify(prefs));
};

const getDefaultReminderPrefs = () => ({
  enabled: false,
  timeInHour: 8,
  timeInMinute: 0,
  timeOutHour: 17,
  timeOutMinute: 0,
  missedTimeInEnabled: true,
  incompleteDayEnabled: true,
  streakNudgeEnabled: true,
  mondayNudgeEnabled: false,
  weeklySummaryEnabled: false,
});
