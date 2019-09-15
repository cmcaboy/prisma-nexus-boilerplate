import { prismaObjectType } from 'nexus-prisma';
import { stringArg } from 'nexus/dist';
import { ApolloError } from 'apollo-server';
import { getMessagesFS } from '../firebase/db';
import { prisma } from '../generated/prisma-client';

/**
 * Standard Query object. Two queries are left in to illustrate how queries can be created.
 */
const Query = prismaObjectType({
  name: 'Query',
  definition: t => {
    t.prismaFields(['*']);
    t.field('getAlertsAbstraction', {
      type: 'Notification',
      list: true,
      description: 'Get a list of notifications for a particular user',
      args: {},
      resolve: async (_, __, { user: { id } }) => {
        if (!id) {
          throw new ApolloError(
            "No user id found. You need pass in the user's token in the header authorization key."
          );
        }
        try {
          const notifications = await prisma.notifications({
            where: { user: { id } },
            orderBy: 'createdAt_DESC'
          });
          return notifications;
        } catch (e) {
          throw new ApolloError('Error fetching notifications');
        }
      }
    });

    t.field('getMessages', {
      description: 'Get messages for conversation',
      list: true,
      args: {
        id: stringArg({ required: true, description: 'id of conversation' })
      },
      type: 'Message',
      resolve: async (_, { id }, { firestore }) => {
        try {
          const messages = await getMessagesFS({ id, db: firestore });
          return messages;
        } catch (e) {
          throw new ApolloError(e);
        }
      }
    });
  }
});

export { Query };
