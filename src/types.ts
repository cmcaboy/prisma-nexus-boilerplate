import { Prisma } from './generated/prisma-client';
import { auth, database, messaging } from 'firebase-admin';

/**
 * Context type for GraphQL Context object, which is share among all resolvers
 */
export interface Context {
  prisma: Prisma;
  auth: auth.Auth;
  db: database.Database;
  firestore: FirebaseFirestore.Firestore;
  messaging: messaging.Messaging;
  user: {
    id?: string;
    email?: string;
    role?: string;
  };
}

export interface FirebaseMessage {
  id: string;
  text: string;
  dateSent: string;
  sender_id: string;
  active: boolean;
  read: boolean;
}
