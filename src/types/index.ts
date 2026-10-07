export type UserRole = 'principal' | 'teacher';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SchoolSettings {
  institutionName: string;
  schoolName?: string;
  principalName: string;
  principalEmail: string;
  contactEmail?: string;
  schoolAddress?: string;
  contactPhone?: string;
  schoolLogo?: string;
  appsScriptUrl?: string;
  isConfigured: boolean;
  updatedAt?: string;
}

export type NoticeImportance = 'Important' | 'Normal';

export interface Notice {
  id: string;
  title: string;
  description: string;
  date: string;
  importance: NoticeImportance;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface Circular {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  location?: string;
  createdAt: string;
  createdBy?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
  priority?: string;
  sendEmail?: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  description?: string;
  createdAt: string;
  createdBy?: string;
}

export interface MeetingItem {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  agenda: string;
  createdAt: string;
  createdBy?: string;
}

export interface CompetitionItem {
  id: string;
  title: string;
  category: string;
  date: string;
  eligibility?: string;
  details?: string;
  createdAt: string;
  createdBy?: string;
}

export type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface TimetableEntry {
  id: string;
  day: Weekday;
  period: string;
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
  room: string;
  createdBy?: string;
  createdAt?: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  active: boolean;
  phone?: string;
  subject?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailLog {
  id: string;
  announcementId: string;
  announcementTitle?: string;
  recipientEmail: string;
  recipientName?: string;
  sentAt: string;
  status: 'sent' | 'simulated' | 'failed';
  errorMessage?: string;
}
