// Permissions file
import { rule, shield, and, or, not, deny, allow } from 'graphql-shield';
import { Context } from './types';

/**
 * Permissions file
 * ----------------
 * This file determines the permissions of your GraphQL routes using the graphql-shield middleware
 */

/**
 * Determines if a user is authenticated. Checks to see whether user has id set in context
 */
const isAuthenticated = rule({ cache: 'no_cache' })(
  async (_, __, { user: { id } }: Context, ___) => {
    console.log('id: ', id);
    return !!id;
  }
);

/**
 * Determines if a user is authenticated and is a super user
 */
const isAdmin = rule({ cache: 'no_cache' })(
  async (_, __, { user: { id, role } }: Context, ___) => {
    return !!id && role === 'SUPER_USER';
  }
);

/**
 * Determines if a user is authenticated and is a normal user
 */
const isNormalUser = rule({ cache: 'contextual' })(
  async (_, __, { user: { id, role } }: Context, ___) => {
    return !!id && role === 'USER';
  }
);

/**
 * Sets permissions of routes
 */
const permissions = shield(
  {
    Query: {
      // All queries require a valid token
      '*': isAuthenticated
      // schools: or(isAuthenticated, not(isAuthenticated))
    },
    Mutation: {
      // All mutations require a valid token except for login and register
      '*': isAuthenticated,
      login: or(isAuthenticated, not(isAuthenticated)),
      signup: or(isAuthenticated, not(isAuthenticated)),
      flipExpirationJob: isAdmin
    }
  },
  {
    // All GraphQL types are readible by default. Only protecting queries and mutations.
    // In a more complex configuration, this may not be used.
    fallbackRule: allow,
    debug: false
  }
);

export { permissions };
