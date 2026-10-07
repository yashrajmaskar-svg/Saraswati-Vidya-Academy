# SARASWATI VIDYA ACADEMY - School Communication Hub

Official, production-ready school communication web portal for Saraswati Vidya Academy. Built with React, TypeScript, Cloud Firestore, Firebase Authentication, robust Firestore Security Rules, and a secure server-side email dispatch architecture.

---

## 🏛️ Purpose & Overview

The SVA School Communication Hub serves as the official administrative channel between the School Principal and Teaching Faculty:
- **Principal / Admin**: Has exclusive authority to create, edit, delete, and publish school announcements, circulars, events, weekly timetables, school profile settings, and manage teacher email records.
- **Teacher**: Has view-only access to published announcements, circulars, events, and class timetables. Teachers are mathematically and strictly restricted from writing or editing school information via Firestore Security Rules.

---

## 🚀 Key Features

1. **Role-Based Authentication (RBAC)**
   - Firebase Authentication with Email/Password and Google Sign-in.
   - User roles stored securely in `users/{uid}`.
   - Safe First-Admin Setup flow: Enables the initial school administrator to claim the Principal account securely without exposing hardcoded credentials.

2. **Announcements with Server-Side Email Dispatch**
   - Announcements with priorities: `Normal`, `Important`, `Urgent`.
   - Newest-first ordering.
   - When published:
     1. Stored in Cloud Firestore.
     2. Calls server-side endpoint `/api/email/send-announcement`.
     3. Queries all active teachers.
     4. Dispatches professional HTML email notifications.
     5. Saves delivery audit logs in `emailLogs` collection.

3. **Teacher Email Management (Principal Only)**
   - Directory of faculty members: name, email, phone, department, active status.
   - Edit email address at any time.
   - Deactivate / Activate toggle: **Deactivated teachers will never receive future announcement emails.**

4. **School Circulars**
   - Official administrative notices with printable memo format and reference codes.

5. **Events & Calendar**
   - Upcoming academic and co-curricular events listed chronologically with venue and timing details.

6. **Timetable**
   - Daily period schedule with Monday–Saturday filters, subject assignments, faculty teacher names, and classroom numbers.

7. **School Settings**
   - School name, campus address, principal name, contact phone, contact email, and school crest.
   - Integrated SMTP connection diagnostic and test email tool.

---

## 🔐 Security & Firestore Rules

Firestore Security Rules enforce strict Attribute-Based Access Control:
- **Zero Blanket Reads**: Only authenticated users can access school data; drafts are restricted to the Principal.
- **Role Verification**: Write operations require verification that `users/{uid}.role == 'principal'` or one-time initial bootstrap.
- **Server-Side Credentials**: SMTP credentials, private API keys, and service secrets are never sent to the client browser.

---

## ✉️ Server-Side Email Setup

The backend server automatically supports both **Live SMTP Mode** and **Audit Simulation Mode**:

### Environment Variables
Configure these in your deployment environment or `.env`:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="notifications@saraswatividya.edu.in"
SMTP_PASS="your-smtp-app-password"
SMTP_FROM="\"Saraswati Vidya Academy\" <no-reply@saraswatividya.edu.in>"
```

*Note: If SMTP variables are not set, the application operates in Simulation Mode, logging every dispatch to `emailLogs` in Firestore without error.*

---

## 📱 Mobile Responsiveness

- Full mobile navigation drawer.
- Tap-friendly touch targets (min 44px).
- Responsive table containers with horizontal scrolling for timetables and audit logs.
