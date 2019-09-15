import { FirebaseMessage } from '../types';
import { ApolloError } from 'apollo-server';
import uuid = require('uuid');
import moment = require('moment');

// Firestore structure
// channels -> conversation_id -> thread -> messages

/**
 * Helper function for retrieve messages from Firebase Firestore
 * This makes assumptions based on the structure of your database; If your structure deviates from said structure, you will need to make changes accordingly
 * @param id - id of the conversation in which we are obtaining the messages from
 * @param db - The Firestore db object
 */
export const getMessagesFS = async ({
  id,
  db
}: {
  id: string;
  db: FirebaseFirestore.Firestore;
}) => {
  const query: any = db
    .collection(`channels/${id}/thread`)
    .orderBy('dateSent', 'desc');
  // .limit();

  let data!: any;
  try {
    data = await query.get();
  } catch (e) {
    console.log('error fetching more messages from firestore: ', e);
    throw new ApolloError(`Error Fetching messages ${e}`);
  }

  const messages = data.docs.map((doc: any) => {
    const docData = doc.data();
    return {
      ...docData
    };
  });
  return messages;
};

/**
 * Helper function for sending a message to Firebase Firestore
 * This makes assumptions based on the structure of your database; If your structure deviates from said structure, you will need to make changes accordingly
 * @param id - id of the conversation in which we are obtaining the messages from
 * @param sender_id - id of the user sending the message
 * @param text - The text of the message being sent
 * @param db - The Firestore db object
 */
export const createMessageFS = async ({
  id,
  sender_id,
  text,
  db
}: {
  id: string;
  sender_id: string;
  text: string;
  db: FirebaseFirestore.Firestore;
}): Promise<FirebaseMessage> => {
  try {
    const newMessageId = uuid();
    const message: FirebaseMessage = {
      id: newMessageId,
      text,
      active: true,
      read: false,
      dateSent: moment().format(),
      sender_id
    };
    const ref = await db
      .collection(`channels/${id}/thread`)
      .doc(newMessageId)
      .set(message);

    return message;
  } catch (e) {
    console.error(`error writing new message to ${id}: ${e}`);
    throw new ApolloError(
      `Unable to create message on converation ${id}: ${e}`
    );
  }
};

/**
 * Helper function for obtaining the last message in a Firebase Firestore conversation
 * This makes assumptions based on the structure of your database; If your structure deviates from said structure, you will need to make changes accordingly
 * @param id - id of the conversation in which we are obtaining the last message from
 * @param db - The Firestore db object
 */
export const getLastMessageFS = async ({
  id,
  db
}: {
  id: string;
  db: FirebaseFirestore.Firestore;
}): Promise<FirebaseMessage> => {
  try {
    // Can use a desc option if orderBy if I need to get opposite order.
    // citiesRef.orderBy("state").orderBy("population", "desc")
    const data = await db
      .collection(`channels/${id}/thread`)
      .orderBy('dateSent', 'desc')
      .limit(1)
      .get();

    if (!data.docs) {
      return null;
    }

    const messages = data.docs.map((doc: any) => {
      const docData = doc.data();
      return {
        ...docData
      };
    });

    if (!messages.length) {
      return null;
    }

    // This array should only have 1 element, but I want to return just the element rather than a 1 length array.
    return messages[0];
  } catch (e) {
    console.log('error fetching last message: ', e);
    return null;
  }
};
