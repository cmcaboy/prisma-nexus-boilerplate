import { prismaObjectType } from 'nexus-prisma';

/**
 * Default user object. computed field num_tasks is left in to illustrate how to use a computed field.
 */
const User = prismaObjectType({
  name: 'User',
  description: 'A user of the application',
  definition(t) {
    t.prismaFields(['*']);
    // t.field("num_tasks", {
    //   description: "The number of tasks the user is associated with",
    //   type: "Int",
    //   resolve: async ({ id }, _, { prisma }) => {
    //     try {
    //       const tasks = await prisma.tasks({
    //         where: { OR: [{ creator: { id } }, { participants_some: { id } }] }
    //       });
    //       return tasks.length;
    //     } catch (e) {
    //       throw Error("Unable to retrieve number of tasks from user");
    //     }
    //   }
    // });
  }
});

export { User };
