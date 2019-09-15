import { makePrismaSchema } from 'nexus-prisma';
import * as path from 'path';
import datamodelInfo from './generated/nexus-prisma';
import { prisma } from './generated/prisma-client';
import { Application } from 'express';
import bodyParser = require('body-parser');
import { verify } from 'jsonwebtoken';
import { auth, db, firestore, messaging } from './firebase';
import { Message, Query, Mutation, User, Notification } from './models';
import {
  JWT_SECRET,
  APOLLO_ENGINE_API_KEY,
  SENTRY_DSN
} from './utils/variables';
import * as Sentry from '@sentry/node';
import { permissions } from './permissions';
import { applyMiddleware } from 'graphql-middleware';
import { sentry } from 'graphql-middleware-sentry';
import { Context } from './types';

const { ApolloServer } = require('apollo-server-express');
const express = require('express');

Sentry.init({ dsn: SENTRY_DSN });

const sentryMiddleware = sentry({
  config: {
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV
  },
  withScope: (scope, error, { user: { id, email } }: Context) => {
    scope.setUser({ id, email });
    scope.setExtra('Error message: ', error.message);
    scope.setExtra('Error name: ', error.name);
  }
});

const baseSchema = makePrismaSchema({
  // Provide all the GraphQL types we've implemented
  types: [Query, Mutation, User, Message, Notification],

  // Configure the interface to Prisma
  prisma: {
    datamodelInfo,
    client: prisma
  },

  // Specify where Nexus should put the generated files
  outputs: {
    schema: path.join(__dirname, './generated/schema.graphql'),
    typegen: path.join(__dirname, './generated/nexus.ts')
  },

  // Configure nullability of input arguments: All arguments are non-nullable by default
  nonNullDefaults: {
    input: false,
    output: false
  },

  // Configure automatic type resolution for the TS representations of the associated types
  typegenAutoConfig: {
    sources: [
      {
        source: path.join(__dirname, './types.ts'),
        alias: 'types'
      }
    ],
    contextType: 'types.Context'
  }
});

const context = async ({ req }: { req: any }) => {
  // simple auth check on every request
  try {
    const auth = (req.headers && req.headers.authorization) || '';
    // const token = new Buffer(auth, "base64").toString("ascii");

    // Verify authorization token is valid
    const { id, email, role }: any = verify(auth, JWT_SECRET);

    return {
      prisma,
      auth,
      db,
      firestore,
      messaging,
      user: { id, email, role }
    };
    // const doesUserExist = await prisma.$exists.user({id})
    // if(!doesUserExist) {
    //   throw new ApolloError("User does not exist")
    // }
  } catch (e) {
    // If token is not valid, catch the exception. Some routes can still be accessed without a valid JWT token
  }

  // return same context object without context.user properties
  return {
    prisma,
    auth,
    db,
    firestore,
    messaging,
    user: { id: undefined, email: undefined, role: undefined }
  };
};

// Apply Middleware
const schema = applyMiddleware(baseSchema, permissions, sentryMiddleware);

const server = new ApolloServer({
  schema,
  context,
  engine: {
    apiKey: APOLLO_ENGINE_API_KEY
  }
});

const pathRoute: string = '/graphql';

const app: Application = express();

app.use('/graphql', bodyParser.text());
app.use('/graphql', (req, _, next) => {
  if (typeof req.body === 'string') {
    req.body = JSON.parse(req.body);
  }
  next();
});

// const authenticate = async (req, res, next) => {
//   // const token = req.headers.authorization;
//   // try {
//   //   const { user } = await jwt.verify(token, SECRET);
//   //   req.user = user;
//   // } catch (err) {
//   //   console.log(err);
//   // }
//   console.log("req: ", req);
//   console.log("res: ", res);
//   req.next();
// };

// app.use(authenticate);

server.applyMiddleware({
  app,
  path: pathRoute
  // cors: false
});

app.listen(process.env.PORT || 14000, () =>
  console.log(`API is ready at port ${process.env.PORT || 14000}`)
);
