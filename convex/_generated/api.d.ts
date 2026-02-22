/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as deposits from "../deposits.js";
import type * as emailTemplates from "../emailTemplates.js";
import type * as emails from "../emails.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as inquiries from "../inquiries.js";
import type * as leases from "../leases.js";
import type * as messages from "../messages.js";
import type * as payments from "../payments.js";
import type * as properties from "../properties.js";
import type * as recentlyViewed from "../recentlyViewed.js";
import type * as savedProperties from "../savedProperties.js";
import type * as users from "../users.js";
import type * as verification from "../verification.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  audit: typeof audit;
  auth: typeof auth;
  crons: typeof crons;
  deposits: typeof deposits;
  emailTemplates: typeof emailTemplates;
  emails: typeof emails;
  files: typeof files;
  http: typeof http;
  inquiries: typeof inquiries;
  leases: typeof leases;
  messages: typeof messages;
  payments: typeof payments;
  properties: typeof properties;
  recentlyViewed: typeof recentlyViewed;
  savedProperties: typeof savedProperties;
  users: typeof users;
  verification: typeof verification;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
