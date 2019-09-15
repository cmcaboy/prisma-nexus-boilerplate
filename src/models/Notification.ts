import { prismaObjectType } from 'nexus-prisma';

/**
 * Default notification object. Great for storing the notifications for user. Great for badge counts as well.
 */
const Notification = prismaObjectType({
  name: 'Notification',
  description: 'A separare entity to control notifications for users',
  definition(t) {
    t.prismaFields(['*']);
  }
});

export { Notification };
