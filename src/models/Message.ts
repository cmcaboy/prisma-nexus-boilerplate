import { prismaObjectType } from 'nexus-prisma';
import { objectType } from 'nexus';
import { ApolloError } from 'apollo-server';

/**
 * Default Message object
 */
const Message = objectType({
  name: 'Message',
  description:
    'Messages for the chat application. These are stored in firebase real time database',
  definition(t) {
    t.id('id', { description: 'unique identifier for message' });
    t.string('text', { description: 'The text of the message' });
    t.string('sender_id', { description: 'id of the sender' });
    t.field('sender', {
      description: 'User who sent the message',
      type: 'User',
      resolve: async ({ id, sender_id }, _, { prisma, db }) => {
        try {
          const user = await prisma.user({ id: sender_id });
          return user;
        } catch (e) {
          console.log('Error fetching user: ', e);
          throw new ApolloError('Could not find user with id: ', sender_id);
        }
      }
    });
    t.string('dateSent', { description: 'The Datetime of the message' });
    t.boolean('read', {
      description: 'Determines if the message has been read'
    });
    t.boolean('active', {
      description: 'Determines if the message is still active or visible.'
    });
  }
});

export { Message };
