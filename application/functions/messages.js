'use strict';

module.exports = function Messages(language) {
  var messages = {};

  switch (language) {
    case 'ko':
      messages.accepted = 'ko: Accepted';
      messages.badRequest = 'ko: The request cannot be fulfilled due to bad syntax.';
      messages.continue = 'ko: Continue';
      messages.created = 'ko: Created';
      messages.forbidden = 'ko: Operation forbidden.  Supplied uid not authenticated to access this resource or perform this operation.';
      messages.internalServerError = 'ko: Internal Server Error';
      messages.invalidUid = 'ko: Invalid uid format.  Please provide a uid as a 24 character hexadecimal string.';
      messages.noUid = 'ko: Please provide a uid as a 24 character hexadecimal string.';
      messages.noUserForUid = 'ko: No user found for uid provided in header data.';
      messages.notImplemented = 'ko: Not implemented.';
      messages.ok = 'ko: OK';
      messages.requestEntityTooLarge = 'ko: The request is larger than the server is willing or able to process.';
      messages.requiresAdminPrivilege = 'ko: Operation requires administrator-level privileges.';
      messages.requiresAgentPrivilege = 'ko: Operation requires agent-level privileges.';
      messages.resourceNotFound = 'ko: Resource not found.';
      messages.specifyContentType = 'ko: Unsupported media type';
      messages.unauthorised = 'ko: Authorisation required.';
      messages.unprocessableEntity = 'ko: The request was well-formed but was unable to be followed due to semantic errors.';
      messages.unknownError = 'ko: An unknown error occurred.';
    break;
    // case 'en':
    default:
      messages.accepted = 'Accepted';
      messages.badRequest = 'The request cannot be fulfilled due to bad syntax.';
      messages.continue = 'Continue';
      messages.created = 'Created';
      messages.forbidden = 'Operation forbidden.  Supplied uid not authenticated to access this resource or perform this operation.';
      messages.internalServerError = 'Internal Server Error';
      messages.invalidUid = 'Invalid uid format.  Please provide a uid as a 24 character hexadecimal string.';
      messages.noUid = 'Please provide a uid as a 24 character hexadecimal string.';
      messages.noUserForUid = 'No user found for uid provided in header data.';
      messages.notImplemented = 'Not implemented.';
      messages.ok = 'OK';
      messages.requestEntityTooLarge = 'The request is larger than the server is willing or able to process.';
      messages.requiresAdminPrivilege = 'Operation requires administrator-level privileges.';
      messages.requiresAgentPrivilege = 'Operation requires agent-level privileges.';
      messages.resourceNotFound = 'Resource not found.';
      messages.specifyContentType = 'Unsupported media type';
      messages.unauthorised = 'Authorisation required.';
      messages.unprocessableEntity = 'The request was well-formed but was unable to be followed due to semantic errors.';
      messages.unknownError = 'An unknown error occurred.';
    break;
  }

  return messages;
}
