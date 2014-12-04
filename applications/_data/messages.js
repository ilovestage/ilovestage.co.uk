'use strict';

var messages = {};

messages.badRequest = 'The request cannot be fulfilled due to bad syntax.';
messages.forbidden = 'Operation forbidden.  Supplied uid not authenticated to access this resource or perform this operation.';
messages.invalidUid = 'Invalid uid format.  Please provide a uid as a 24 character hexadecimal string.';
messages.noUid = 'Please provide a uid as a 24 character hexadecimal string.';
messages.noUserForUid = 'No user found for uid provided in header data.';
messages.requestEntityTooLarge = 'The request is larger than the server is willing or able to process.';
messages.requiresAdminPrivilege = 'Operation requires administrator-level privileges.';
messages.requiresAgentPrivilege = 'Operation requires agent-level privileges.';
messages.resourceNotFound = 'Resource not found.';
messages.specifyContentType = 'Unsupported media type';
messages.unauthorised = 'Authorisation required.';
messages.unprocessableEntity = 'The request was well-formed but was unable to be followed due to semantic errors.';
messages.unknownError = 'An unknown error occurred.';

module.exports = messages;