import { prismaObjectType } from 'nexus-prisma';
import { stringArg } from 'nexus/dist';
import { AuthenticationError, ApolloError } from 'apollo-server';
import { JWT_SECRET } from '../utils/variables';
import { sign } from 'jsonwebtoken';
import { createMessageFS } from '../firebase/db';
import { FirebaseMessage } from '../types';

/**
 * Standard Mutation object. A few common mutation objects are left in for reference
 */
const Mutation = prismaObjectType({
  name: 'Mutation',
  definition: t => {
    t.prismaFields(['*']);
    t.field('register', {
      type: 'User',
      args: {
        email: stringArg({
          required: true,
          description: 'email of the user'
        }),
        uid: stringArg({
          required: true,
          description:
            'The firebase uid that you receive after authenticating through firebase auth.'
        })
      },
      description:
        'Call this mutation to sign a new user up. It will return a user payload',
      resolve: async (
        _,
        { email: email_param, uid, username },
        { prisma, auth }
      ) => {
        const email = email_param.toLowerCase();
        // Check to see if user already exists
        const emailAlreadyExists = await prisma.$exists
          .user({ email })
          .catch(e => {
            console.log('Error when checking if email already exists', e);
            throw new AuthenticationError('Unable to verify email');
          });
        if (emailAlreadyExists) {
          throw new AuthenticationError('Email already in use');
        }
        const decodedToken = await auth.getUser(uid).catch(e => {
          console.log('Error trying to verify firebase token', e);
          throw new AuthenticationError(`Unable to verify firebase token`);
        });
        // If user is disabled in Firebase auth, return an error
        if (decodedToken.disabled) {
          console.log('User has been disabled. Cannot continue');
          throw new AuthenticationError(`User has been disabled`);
        }
        // Check to see if the email used in signup is the same as the Firebase email
        if (decodedToken.email.toLowerCase() !== email.toLowerCase()) {
          console.log('User has been disabled. Cannot continue');
          throw new AuthenticationError(`User has been disabled`);
        }
        // Create new user
        const newUser = await prisma
          .createUser({ email, name, username })
          .catch(e => {
            console.log('Error trying to verify firebase token', e);
            throw new AuthenticationError(`Could not create new user`);
          });
        // Sign the JWT token
        const token = sign(
          { id: newUser.id, email: newUser.email, role: newUser.role },
          JWT_SECRET,
          {}
        );
        // Place the token on the user's object
        await prisma.updateUser({ data: { token }, where: { id: newUser.id } });
        return { ...newUser, token };
      }
    });
    t.field('createMessage', {
      description: 'Create a new message in a conversation',
      args: {
        id: stringArg({ required: true, description: 'id of conversation' }),
        text: stringArg({
          required: true,
          description: 'actual content of the message'
        })
      },
      type: 'Message',
      resolve: async (
        _,
        { id, text },
        { firestore, user: { id: sender_id } }
      ) => {
        let newMessage: FirebaseMessage;
        try {
          newMessage = await createMessageFS({
            id,
            db: firestore,
            sender_id,
            text
          });
        } catch (e) {
          throw new ApolloError(`Error creating new message: ${e}`);
        }
        return newMessage;
      }
    });
    t.field('login', {
      description:
        'Login mutation: Send your email and firebase uid and get back a token',
      type: 'User',
      args: {
        email: stringArg({ description: 'Email of user', required: true }),
        uid: stringArg({
          description: 'uid received from Firebase',
          required: true
        })
      },
      resolve: async (_, { email: email_param, uid }, { auth, prisma }) => {
        // Check to see if user already exists
        const email = email_param.toLowerCase();
        const emailAlreadyExists = await prisma.$exists
          .user({ email })
          .catch(e => {
            console.log('Error when checking if email exists', e);
            throw new AuthenticationError('Unable to verify email');
          });
        if (!emailAlreadyExists) {
          throw new AuthenticationError('Could not find email');
        }
        const decodedToken = await auth.getUser(uid).catch(e => {
          console.log('Error trying to verify firebase token', e);
          throw new AuthenticationError(`Unable to verify firebase token`);
        });
        // If user is disabled, return an error
        if (decodedToken.disabled) {
          console.log('User has been disabled. Cannot continue');
          throw new AuthenticationError(`User has been disabled`);
        }
        // Check to see if email is correct
        if (decodedToken.email !== email) {
          console.log(`Incorrect email: ${email} ${decodedToken.email}`);
          throw new AuthenticationError(`Invalid email`);
        }
        // Grab user object from prisma
        const user = await prisma.user({ email }).catch(e => {
          console.log('Error trying to verify firebase token', e);
          throw new AuthenticationError(`Could not create new user`);
        });
        // Sign the JWT token
        const token = sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          {}
        );
        await prisma.updateUser({ data: { token }, where: { id: user.id } });
        return { ...user, token };
      }
    });
  }
});

export { Mutation };
