# Student Achievement Certificate Management System

## Project description
The Student Achievement Certificate Management System is a college portal for managing student achievements, certificate uploads, review workflows, and faculty approval. It is designed for B.Tech IT CSP projects and uses Firebase Authentication, Firestore, and Cloudinary for real data handling without requiring a paid Firebase Storage plan.

## Problem statement
Colleges often collect student achievements and certificates through manual processes, making it difficult to track status, verify submissions, and maintain records. This system automates registration, profile management, certificate uploads, review, approval, and download actions.

## Objectives
- Let students register and log in using their roll number-based login flow.
- Automate student and certificate creation through the application.
- Allow students to upload certificate files via Cloudinary and monitor status.
- Enable faculty/admins to search, filter, review, approve, and reject submissions.
- Store secure metadata in Firebase and protect access using Firestore rules.

## Features
- Student registration and login
- Role-based access using Firebase Authentication and Firestore
- Student profile management with branch and year updates
- Achievement submission with Cloudinary-backed certificate upload
- Display of certificate records and review status
- Admin dashboard with overall statistics
- Search and filters for certificates and students
- Approval and rejection flow with reason capture
- Download and bulk download support
- Responsive UI for desktop and mobile

## Technology stack
- React + Vite
- React Router
- Firebase Authentication
- Firestore
- Cloudinary
- JSZip and FileSaver for bulk downloads
- CSS for responsive UI

## Folder structure
- src/components
- src/context
- src/firebase
- src/pages
- src/services
- src/utils
- src/App.jsx
- src/main.jsx

## Firebase setup
1. Create a Firebase project in the Firebase Console.
2. Enable Authentication with Email/Password.
3. Enable Firestore Database.
4. Create an admin user manually in the Firebase console and add an admins/{uid} document.
5. Add your Firebase config values to a local .env file.

## Cloudinary setup
1. Create a Cloudinary account.
2. Open the Cloudinary dashboard.
3. Create an unsigned upload preset.
4. Set the upload preset to allow the file types you need for certificates.
5. Add the values to the local .env file:
   - VITE_CLOUDINARY_CLOUD_NAME
   - VITE_CLOUDINARY_UPLOAD_PRESET

For client-side React apps, the safe approach is an unsigned upload preset. It allows the browser to upload directly to Cloudinary without embedding secret API keys in the frontend. Keep the preset restricted to the allowed file types and only the folder you intend to use.

## Authentication setup
Students log in with their roll number and password, while the app resolves the registered student email behind the scenes. Admins log in separately using their email and password.

## Firestore structure
- students/{uid}
- admins/{uid}
- certificates/{certificateId}

## Cloudinary upload flow
Student selects certificate
→ React uploads the file to Cloudinary
→ Cloudinary returns a secure URL
→ React stores the metadata and secure URL in Firestore

## Environment variables
Create a .env file using the values from your Firebase project and Cloudinary account:

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset

## Local development
npm install
npm run dev

## Testing
- Student registration flow
- Student login and invalid password handling
- Profile updates
- Achievement upload through Cloudinary
- Search and filters
- Approval and rejection
- Download and bulk actions

## Production build
npm run build

## Deployment
Deploy the app to Vercel, Netlify, or Firebase Hosting after configuring the environment variables and Firebase project settings.

## Future enhancements
- QR codes for certificate validation
- PDF generation for achievement summary reports
- Notification emails for approval and rejection
- Advanced analytics dashboards
