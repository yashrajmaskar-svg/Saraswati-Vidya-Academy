import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { getAppsScriptUrl, saveAppsScriptUrl } from '../config/appsScript';
import {
  Announcement,
  Circular,
  CompetitionItem,
  EmailLog,
  MeetingItem,
  Notice,
  ScheduleItem,
  SchoolEvent,
  SchoolSettings,
  Teacher,
  TimetableEntry,
  Weekday,
} from '../types';

/* =========================================================================
   SCHOOL SETTINGS (Zero fake names, purely user-defined or neutral)
   ========================================================================= */

export const DEFAULT_SETTINGS: SchoolSettings = {
  institutionName: '',
  principalName: '',
  principalEmail: '',
  schoolAddress: '',
  contactPhone: '',
  schoolLogo: '🏛️',
  isConfigured: false,
};

export async function getSchoolSettings(): Promise<SchoolSettings> {
  const docPath = 'schoolSettings/default';
  try {
    const snap = await getDoc(doc(db, 'schoolSettings', 'default'));
    if (snap.exists()) {
      return { ...DEFAULT_SETTINGS, ...snap.data() } as SchoolSettings;
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.warn('Could not read schoolSettings, returning unconfigured default:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSchoolSettings(
  settings: Partial<SchoolSettings>,
  updatedBy?: string
): Promise<SchoolSettings> {
  const docPath = 'schoolSettings/default';
  try {
    const payload = {
      ...settings,
      institutionName: settings.institutionName || (settings as any).schoolName || '',
      schoolName: settings.institutionName || (settings as any).schoolName || '',
      principalEmail: settings.principalEmail || (settings as any).contactEmail || '',
      contactEmail: settings.principalEmail || (settings as any).contactEmail || '',
      isConfigured: Boolean((settings.institutionName || (settings as any).schoolName) && settings.principalName && (settings.principalEmail || (settings as any).contactEmail)),
      updatedBy: updatedBy || 'Principal',
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'schoolSettings', 'default'), payload, { merge: true });
    return payload as SchoolSettings;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
    throw error;
  }
}

export const updateSchoolSettings = saveSchoolSettings;

/* =========================================================================
   NOTICE BOARD (Title, Description, Date, Important / Normal)
   ========================================================================= */

export async function getNotices(): Promise<Notice[]> {
  const collPath = 'notices';
  try {
    const q = query(collection(db, collPath), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notice));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collPath);
    return [];
  }
}

export async function createNotice(data: {
  title: string;
  description: string;
  date: string;
  importance: 'Important' | 'Normal';
  createdBy?: string;
}): Promise<Notice> {
  const collPath = 'notices';
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, collPath), {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return {
      id: docRef.id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
    throw error;
  }
}

export async function updateNotice(
  id: string,
  data: Partial<Omit<Notice, 'id' | 'createdAt'>>
): Promise<void> {
  const docPath = `notices/${id}`;
  try {
    await updateDoc(doc(db, 'notices', id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
    throw error;
  }
}

export async function deleteNotice(id: string): Promise<void> {
  const docPath = `notices/${id}`;
  try {
    await deleteDoc(doc(db, 'notices', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
    throw error;
  }
}

/* =========================================================================
   ANNOUNCEMENTS (Title, Message, Date, Send Announcement, Send by Email)
   ========================================================================= */

export async function getAnnouncements(_isPrincipal?: boolean): Promise<Announcement[]> {
  const collPath = 'announcements';
  try {
    const q = query(collection(db, collPath), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collPath);
    return [];
  }
}

export async function createAnnouncement(data: {
  title: string;
  message: string;
  date: string;
  priority?: string;
  sendEmail?: boolean;
  createdBy?: string;
}): Promise<Announcement> {
  const collPath = 'announcements';
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, collPath), {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return {
      id: docRef.id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
    throw error;
  }
}

export async function updateAnnouncement(
  id: string,
  data: Partial<Omit<Announcement, 'id' | 'createdAt'>>
): Promise<void> {
  const docPath = `announcements/${id}`;
  try {
    await updateDoc(doc(db, 'announcements', id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
    throw error;
  }
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const docPath = `announcements/${id}`;
  try {
    await deleteDoc(doc(db, 'announcements', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
    throw error;
  }
}

// Helper: Get ALL active teacher emails from Firestore records (Requirement 1 & 2)
export async function getActiveTeacherEmails(): Promise<string[]> {
  try {
    const teachers = await getTeachers();
    const activeEmails = teachers
      .filter(t => t.active !== false && t.email && t.email.trim().includes('@'))
      .map(t => t.email.trim());

    // Deduplicate case-insensitively while preserving original casing
    const seen = new Set<string>();
    const uniqueEmails: string[] = [];
    for (const email of activeEmails) {
      const lower = email.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueEmails.push(email);
      }
    }
    return uniqueEmails;
  } catch (err) {
    console.error('Failed to get active teacher emails from Firestore:', err);
    return [];
  }
}

// Dispatches announcement email via Google Apps Script Web App (Backend Proxy Architecture)
export async function dispatchAnnouncementEmails(
  announcement: Announcement,
  activeTeacherEmails?: string[]
): Promise<{ success: boolean; totalSent: number; totalFailed: number; message: string; zeroRecipients?: boolean }> {
  // 1. Get ALL active teacher emails from Firestore if not passed
  const recipients = activeTeacherEmails !== undefined ? activeTeacherEmails : await getActiveTeacherEmails();
  let APPS_SCRIPT_URL = getAppsScriptUrl();

  // If local URL is placeholder, try loading from Firestore schoolSettings
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'PASTE_MY_APPS_SCRIPT_WEB_APP_URL_HERE') {
    try {
      const settings = await getSchoolSettings();
      if (settings?.appsScriptUrl && settings.appsScriptUrl.trim() && settings.appsScriptUrl.trim() !== 'PASTE_MY_APPS_SCRIPT_WEB_APP_URL_HERE') {
        APPS_SCRIPT_URL = settings.appsScriptUrl.trim();
        saveAppsScriptUrl(APPS_SCRIPT_URL);
      }
    } catch {
      // ignore
    }
  }

  // If zero active teacher emails found
  if (recipients.length === 0) {
    return {
      success: true,
      zeroRecipients: true,
      totalSent: 0,
      totalFailed: 0,
      message: 'Announcement posted to notice board, but no active teacher emails were available.',
    };
  }

  let response: Response;
  // Send request via secure server-side proxy endpoint (/api/send-announcement)
  // Flow: React frontend -> AI Studio backend endpoint -> Google Apps Script Web App
  try {
    response = await fetch('/api/send-announcement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        title: announcement.title,
        message: announcement.message,
        recipients,
        appsScriptUrl: APPS_SCRIPT_URL,
      }),
    });
  } catch (proxyErr: any) {
    console.error('Backend proxy fetch failed:', proxyErr);
    return {
      success: false,
      totalSent: 0,
      totalFailed: recipients.length,
      message: proxyErr?.message || 'Could not connect to the backend announcement email service.',
    };
  }

  let rawText = '';
  try {
    rawText = await response.text();
  } catch (textErr: any) {
    console.error('Failed reading response text from email service:', textErr);
    return {
      success: false,
      totalSent: 0,
      totalFailed: recipients.length,
      message: 'Email service returned an invalid response.',
    };
  }

  let data: any = null;
  try {
    data = JSON.parse(rawText);
  } catch (parseErr) {
    // If response is not valid JSON, display invalid response and log rawText
    console.error('Email service response is not valid JSON:', rawText, parseErr);
    return {
      success: false,
      totalSent: 0,
      totalFailed: recipients.length,
      message: 'Email service returned an invalid response.',
    };
  }

  // Requirement 8: If Apps Script returns success=true, show: "Announcement sent successfully to X teachers."
  if (data && data.success === true) {
    const sent = typeof data.sent === 'number' ? data.sent : recipients.length;
    const failed = typeof data.failed === 'number' ? data.failed : 0;

    let displayMessage: string;
    if (data.zeroRecipients) {
      displayMessage = data.message || 'Announcement posted to notice board, but no active teacher emails were available.';
    } else if (failed > 0) {
      displayMessage = `Announcement sent to ${sent} teachers. ${failed} emails failed.`;
    } else {
      displayMessage = `Announcement sent successfully to ${sent} teachers.`;
    }

    // Record audit log in Firestore
    try {
      await addDoc(collection(db, 'emailLogs'), {
        announcementId: announcement.id,
        announcementTitle: announcement.title,
        recipientEmail: `${sent} active teachers`,
        recipientName: `All Active Teachers (${sent} sent, ${failed} failed)`,
        sentAt: new Date().toISOString(),
        status: failed > 0 ? 'partial' : 'sent',
        errorMessage: null,
        sentCount: sent,
        failedCount: failed,
        service: 'Google Apps Script',
      });
    } catch (logErr) {
      console.warn('Failed recording audit log in Firestore:', logErr);
    }

    return {
      success: true,
      totalSent: sent,
      totalFailed: failed,
      message: displayMessage,
    };
  }

  // Requirement 9: If Apps Script returns an error, show the REAL error message returned by Apps Script
  const realErrorMsg = data?.message || data?.error || 'Email delivery failed.';
  const sent = typeof data?.sent === 'number' ? data.sent : 0;
  const failed = typeof data?.failed === 'number' ? data.failed : recipients.length;

  // Record failure audit log in Firestore
  try {
    await addDoc(collection(db, 'emailLogs'), {
      announcementId: announcement.id,
      announcementTitle: announcement.title,
      recipientEmail: 'All Active Teachers',
      recipientName: 'All Active Teachers',
      sentAt: new Date().toISOString(),
      status: 'failed',
      errorMessage: realErrorMsg,
      sentCount: sent,
      failedCount: failed,
      service: 'Google Apps Script',
    });
  } catch (logErr) {
    console.warn('Failed recording failure log in Firestore:', logErr);
  }

  return {
    success: false,
    totalSent: sent,
    totalFailed: failed,
    message: realErrorMsg,
  };
}

/* =========================================================================
   SCHEDULES
   ========================================================================= */

export async function getSchedules(): Promise<ScheduleItem[]> {
  const collPath = 'schedules';
  try {
    const q = query(collection(db, collPath), orderBy('date', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collPath);
    return [];
  }
}

export async function createSchedule(data: {
  title: string;
  date: string;
  time: string;
  location?: string;
  description?: string;
  createdBy?: string;
}): Promise<ScheduleItem> {
  const collPath = 'schedules';
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, collPath), {
      ...data,
      createdAt: now,
    });
    return { id: docRef.id, ...data, createdAt: now };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
    throw error;
  }
}

export async function updateSchedule(
  id: string,
  data: Partial<Omit<ScheduleItem, 'id' | 'createdAt'>>
): Promise<void> {
  const docPath = `schedules/${id}`;
  try {
    await updateDoc(doc(db, 'schedules', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
    throw error;
  }
}

export async function deleteSchedule(id: string): Promise<void> {
  const docPath = `schedules/${id}`;
  try {
    await deleteDoc(doc(db, 'schedules', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
    throw error;
  }
}

/* =========================================================================
   MEETINGS
   ========================================================================= */

export async function getMeetings(): Promise<MeetingItem[]> {
  const collPath = 'meetings';
  try {
    const q = query(collection(db, collPath), orderBy('date', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as MeetingItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collPath);
    return [];
  }
}

export async function createMeeting(data: {
  title: string;
  date: string;
  time: string;
  venue: string;
  agenda: string;
  createdBy?: string;
}): Promise<MeetingItem> {
  const collPath = 'meetings';
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, collPath), {
      ...data,
      createdAt: now,
    });
    return { id: docRef.id, ...data, createdAt: now };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
    throw error;
  }
}

export async function updateMeeting(
  id: string,
  data: Partial<Omit<MeetingItem, 'id' | 'createdAt'>>
): Promise<void> {
  const docPath = `meetings/${id}`;
  try {
    await updateDoc(doc(db, 'meetings', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
    throw error;
  }
}

export async function deleteMeeting(id: string): Promise<void> {
  const docPath = `meetings/${id}`;
  try {
    await deleteDoc(doc(db, 'meetings', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
    throw error;
  }
}

/* =========================================================================
   COMPETITIONS
   ========================================================================= */

export async function getCompetitions(): Promise<CompetitionItem[]> {
  const collPath = 'competitions';
  try {
    const q = query(collection(db, collPath), orderBy('date', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CompetitionItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collPath);
    return [];
  }
}

export async function createCompetition(data: {
  title: string;
  category: string;
  date: string;
  eligibility?: string;
  details?: string;
  createdBy?: string;
}): Promise<CompetitionItem> {
  const collPath = 'competitions';
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, collPath), {
      ...data,
      createdAt: now,
    });
    return { id: docRef.id, ...data, createdAt: now };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
    throw error;
  }
}

export async function updateCompetition(
  id: string,
  data: Partial<Omit<CompetitionItem, 'id' | 'createdAt'>>
): Promise<void> {
  const docPath = `competitions/${id}`;
  try {
    await updateDoc(doc(db, 'competitions', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
    throw error;
  }
}

export async function deleteCompetition(id: string): Promise<void> {
  const docPath = `competitions/${id}`;
  try {
    await deleteDoc(doc(db, 'competitions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
    throw error;
  }
}

/* =========================================================================
   TIMETABLE
   ========================================================================= */

export async function getTimetable(dayFilter?: Weekday): Promise<TimetableEntry[]> {
  const collPath = 'timetable';
  try {
    const q = dayFilter
      ? query(collection(db, collPath), where('day', '==', dayFilter))
      : query(collection(db, collPath));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as TimetableEntry));
    return list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collPath);
    return [];
  }
}

export async function createTimetableEntry(data: {
  day: Weekday;
  period: string;
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
  room: string;
  createdBy?: string;
}): Promise<TimetableEntry> {
  const collPath = 'timetable';
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, collPath), {
      ...data,
      createdAt: now,
    });
    return { id: docRef.id, ...data, createdAt: now };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
    throw error;
  }
}

export async function updateTimetableEntry(
  id: string,
  data: Partial<Omit<TimetableEntry, 'id' | 'createdAt'>>
): Promise<void> {
  const docPath = `timetable/${id}`;
  try {
    await updateDoc(doc(db, 'timetable', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
    throw error;
  }
}

export async function deleteTimetableEntry(id: string): Promise<void> {
  const docPath = `timetable/${id}`;
  try {
    await deleteDoc(doc(db, 'timetable', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
    throw error;
  }
}

/* =========================================================================
   TEACHER EMAILS (Teacher Email Management)
   ========================================================================= */

export async function getTeachers(): Promise<Teacher[]> {
  try {
    const [teachersSnap, usersSnap] = await Promise.all([
      getDocs(query(collection(db, 'teachers'), orderBy('name', 'asc'))).catch(() => ({ docs: [] })),
      getDocs(query(collection(db, 'users'), where('role', '==', 'teacher'))).catch(() => ({ docs: [] })),
    ]);

    const teacherMap = new Map<string, Teacher>();

    teachersSnap.docs.forEach(d => {
      const data = d.data();
      const email = ((data.email as string) || '').trim().toLowerCase();
      teacherMap.set(email || d.id, {
        id: d.id,
        name: data.name || 'Teacher',
        email: data.email || '',
        active: data.active !== false,
        phone: data.phone || '',
        subject: data.subject || '',
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    usersSnap.docs.forEach(d => {
      const data = d.data();
      const email = ((data.email as string) || '').trim().toLowerCase();
      if (email && !teacherMap.has(email)) {
        teacherMap.set(email, {
          id: d.id,
          name: data.name || 'Teacher',
          email: data.email || '',
          active: data.active !== false,
          phone: data.phone || '',
          subject: data.subject || '',
          createdBy: 'Self-Registered',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      }
    });

    return Array.from(teacherMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'teachers');
    return [];
  }
}

export async function createTeacher(data: {
  name: string;
  email: string;
  active: boolean;
  phone?: string;
  subject?: string;
  createdBy?: string;
}): Promise<Teacher> {
  const collPath = 'teachers';
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, collPath), {
      ...data,
      email: data.email.trim().toLowerCase(),
      createdAt: now,
      updatedAt: now,
    });
    return {
      id: docRef.id,
      ...data,
      email: data.email.trim().toLowerCase(),
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
    throw error;
  }
}

export async function updateTeacher(
  id: string,
  data: Partial<Omit<Teacher, 'id' | 'createdAt'>>,
  _updatedBy?: string
): Promise<void> {
  const docPath = `teachers/${id}`;
  try {
    const payload: Record<string, any> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    if (data.email) {
      payload.email = data.email.trim().toLowerCase();
    }
    await updateDoc(doc(db, 'teachers', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
    throw error;
  }
}

export async function toggleTeacherStatus(id: string, active: boolean, updatedBy?: string): Promise<void> {
  return updateTeacher(id, { active }, updatedBy);
}

export async function deleteTeacher(id: string): Promise<void> {
  const docPath = `teachers/${id}`;
  try {
    await deleteDoc(doc(db, 'teachers', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
    throw error;
  }
}

/* =========================================================================
   CIRCULARS
   ========================================================================= */

export async function getCirculars(): Promise<Circular[]> {
  const collPath = 'circulars';
  try {
    const q = query(collection(db, collPath), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Circular));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collPath);
    return [];
  }
}

export async function createCircular(data: {
  title: string;
  content: string;
  date: string;
  createdBy?: string;
}): Promise<Circular> {
  const collPath = 'circulars';
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, collPath), {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return { id: docRef.id, ...data, createdAt: now, updatedAt: now };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
    throw error;
  }
}

export async function updateCircular(
  id: string,
  data: Partial<Omit<Circular, 'id' | 'createdAt'>>,
  _updatedBy?: string
): Promise<void> {
  const docPath = `circulars/${id}`;
  try {
    await updateDoc(doc(db, 'circulars', id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
    throw error;
  }
}

export async function deleteCircular(id: string): Promise<void> {
  const docPath = `circulars/${id}`;
  try {
    await deleteDoc(doc(db, 'circulars', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
    throw error;
  }
}

/* =========================================================================
   SCHOOL EVENTS
   ========================================================================= */

export async function getEvents(): Promise<SchoolEvent[]> {
  const collPath = 'events';
  try {
    const q = query(collection(db, collPath), orderBy('eventDate', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolEvent));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collPath);
    return [];
  }
}

export async function createEvent(data: {
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  location?: string;
  createdBy?: string;
}): Promise<SchoolEvent> {
  const collPath = 'events';
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, collPath), {
      ...data,
      createdAt: now,
    });
    return { id: docRef.id, ...data, createdAt: now };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collPath);
    throw error;
  }
}

export async function updateEvent(
  id: string,
  data: Partial<Omit<SchoolEvent, 'id' | 'createdAt'>>,
  _updatedBy?: string
): Promise<void> {
  const docPath = `events/${id}`;
  try {
    await updateDoc(doc(db, 'events', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
    throw error;
  }
}

export async function deleteEvent(id: string): Promise<void> {
  const docPath = `events/${id}`;
  try {
    await deleteDoc(doc(db, 'events', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
    throw error;
  }
}

/* =========================================================================
   EMAIL LOGS (Audit)
   ========================================================================= */

export async function getEmailLogs(): Promise<EmailLog[]> {
  const collPath = 'emailLogs';
  try {
    const q = query(collection(db, collPath), orderBy('sentAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EmailLog));
  } catch (error) {
    console.warn('Could not retrieve emailLogs:', error);
    return [];
  }
}

/* =========================================================================
   SEED FUNCTION (Ensures initial collection connectivity)
   ========================================================================= */

export async function seedInitialSchoolDataIfEmpty(principalName?: string): Promise<void> {
  // Safe helper to confirm collections without inserting fake school names
  try {
    const settings = await getSchoolSettings();
    if (!settings.isConfigured && principalName) {
      await saveSchoolSettings({ principalName });
    }
  } catch (err) {
    console.warn('seedInitialSchoolDataIfEmpty check finished:', err);
  }
}
