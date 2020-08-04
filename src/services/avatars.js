/**
 * Create a Jira avatar URL
 * @param {String} email
 * @param {String} size Possible values 'xs','s', 'm', 'b', 'x' (or full words like 'small', 'big' ...)
 */
export function createAvatar(email, size = 'm') {
  const jiraOwnerId = email.substring(0, email.indexOf('@'));
  if (!jiraOwnerId) return '';
  return `https://jira2.cnexus.com/secure/useravatar?ownerId=${jiraOwnerId}&size${size}`;
}