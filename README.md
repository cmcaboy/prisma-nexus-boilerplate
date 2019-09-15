# Prisma Nexus boilerplate

This repository is a boiler plate for using the prisma plugin with GraphQL Nexus. Currently, only prisma version 1 is supported. We plan on supporting prisma 2 once it hits GA.

<a name="toc" ></a>

### 1. Table of Contents

1. [Table of Contents](#toc)
2. [Technologies used](#tech)
3. [GraphQL middleware](#middleware)
4. [How to use](#howto)
5. [Deployment](#deployment)
6. [To-do](#todo)

<a name="tech" ></a>

### 2. Technologies Used

- [NodeJs](https://nodejs.org/en/) - Primary language
- [GraphQL](https://graphql.org/) - Our Networking communication specification
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/) - GraphQL server
- [GraphQL Nexus](https://nexus.js.org/) - Type-first graphql implementation
- [Prisma](https://www.prisma.io/) - ORM for our Postgres database
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) - Used for push notifications
- [PostgresSQL](https://www.postgresql.org/) - Primary database
- [Firebase Firestore](https://firebase.google.com/docs/firestore) - Secondary database (Optional)

<a name="middleware" ></a>

### 3. GraphQL Middleware

This boilerplate has the following graphql middleware packages installed to help ease implementation.

- [graphql-middleware](https://github.com/prisma/graphql-middleware) - Hosts middleware packages for our Apollo GraphQL instance
- [graphql-shield](https://github.com/maticzav/graphql-shield) - Creates a permissions layer over your graphql queries, mutations, and return values
- [graphql-upload](https://github.com/jaydenseric/graphql-upload) - Adds support for file uploads through mutations and queries
- [graphql-middleware-apollo-upload-server](https://github.com/maticzav/graphql-middleware-apollo-upload-server) - A wrapper around graphql-upload. Automates a lot of the work around file uploads
- [graphql-yup-middleware](https://github.com/JCMais/graphql-yup-middleware) - Add yup validation on query and mutation parameters
- [graphql-middleware-sentry](https://github.com/BrunoScheufler/graphql-middleware-sentry) - Add yup validation on query and mutation parameters

<a name="howto" ></a>

### 4. How to use

1. Install the prisma cli

```
npm install -g prisma
```

2. Build your data model in prisma/datamodel.prisma using the graphql schema definition language

```
type User {
  id: ID! @id
  email: String! @unique
  token: String
  name: String
  username: String
  description: String
  photo_url: String
  flagged_as_objectionable: Boolean @default(value: false)
  view_objectionable_content: Boolean @default(value: true)
  receive_push_notifications: Boolean @default(value: true)
  oneSignalPlayerId: String
  fcm_token: String
  createdAt: DateTime! @createdAt
  updatedAt: DateTime! @updatedAt
}

type Notification {
  ...
}
...
```

3. Deploy your model

```
prisma deploy
```

4. Customize your GraphQL server with Queries, Mutations, Subscriptions, GraphQL types, and/or computed fields

Navigate to the models directory and update the respected file(s).

```
const Notification = prismaObjectType({
  name: 'Notification',
  description: 'A separare entity to control notifications for users',
  definition(t) {
    t.prismaFields(['*']);
  }
});
```

Note: This section is done using [graphql-nexus](https://nexus.js.org/). Check out the [docs](https://nexus.js.org/docs/getting-started) for more info.

<a name="deployment" ></a>

### 5. Deployment

There are 3 separate services that need to be deployed: A graphql server, a prisma server, and a postgres database. If using AWS, EC2 is typically used to create a graphql server, a Fargate instance for the prisma server, and an RDS instance to host the database.

<a name="todo" ></a>

### 5. To-do

1. Upgrade to prisma 2
2. Add examples for yup validation
3. Add JWT Refresh token support/examples
4. Add OneSignal Datasource
5. Add middleware for push notifications
6. Add examples for file upload
7. Add Subscription examples
