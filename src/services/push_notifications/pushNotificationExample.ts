import { Prisma } from '../../generated/prisma-client';
import moment = require('moment');
import {
  NOTIFICATION_EXPIRATION_IN_DAYS,
  NOTIFICATION_EXPIRED_TASK_TITLE
} from '../../utils/variables';
import { messaging } from '../../firebase';
import { ApolloError } from 'apollo-server';

// * Should send a push notification for a task that has expired

// TODO: Change logic to send notification to a list of devices tokens rather than N number of separate requests
// https://firebase.google.com/docs/cloud-messaging/send-message#send_messages_to_multiple_devices

export const examplePushNotificationFunction = async ({
  // Receive task id as the parameter
  id,
  prisma
}: {
  id: string;
  prisma: Prisma;
}) => {
  // With task id, we can get task for metadata purposes (not needed right now)
  // const task = await prisma.task({id})
  // With task id, we can get the category image_url
  const category_image_url = await prisma
    .task({ id })
    .category()
    .image_url();

  // With task id, we can get all users associated with that task
  const users_associated_to_task = await prisma.users({
    where: { tasks_some: { id } }
  });

  // For each user, send a notification
  await Promise.all(
    users_associated_to_task.map(async user => {
      // Add a notification item in prisma for each user_id
      await prisma.createNotification({
        user: { connect: { id: user.id } },
        expiration: moment()
          .add(NOTIFICATION_EXPIRATION_IN_DAYS, 'days')
          .format(),
        title: NOTIFICATION_EXPIRED_TASK_TITLE,
        description: NOTIFICATION_EXPIRED_TASK_TITLE,
        read: false,
        image_url: category_image_url
      });
      // Get badge count
      const badges = await prisma.notifications({
        where: { read: false, user: { id: user.id } }
      });
      const badge_count = badges.length;
      messaging
        .send({
          token: user.fcm_token,
          notification: {
            title: NOTIFICATION_EXPIRED_TASK_TITLE,
            body: NOTIFICATION_EXPIRED_TASK_TITLE
          },
          apns: {
            payload: {
              aps: {
                'content-available': 1,
                badge: badge_count
              }
            }
          },
          data: {
            task_id: id
          }
        })
        .catch(e => {
          console.log(`Error sending push notification to ${user.email}: ${e}`);
          throw new ApolloError(
            `Error sending push notification to ${user.email}: ${e}`
          );
        });
    })
  );
};
