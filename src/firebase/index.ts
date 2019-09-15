import * as admin from 'firebase-admin';
import { FIREBASE_API_FILE } from '../utils/variables';

/**
 * Firebase exports
 * messaging - Firebase Cloud messaging
 * auth - Firebase auth
 * db - Firebase Realtime Database
 * firestore - Firebase Firestore database
 */

// You may have to use relative path to get this to work
const serviceAccount = require(FIREBASE_API_FILE);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://joinmi-d42c8.firebaseio.com'
});

const messaging = admin.messaging();
const auth = admin.auth();
const db = admin.database();
const firestore = admin.firestore();

export { messaging, auth, db, firestore };
