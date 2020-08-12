/**
 * Create a Jira avatar URL
 * @param {{jiraOwnerId: String?, email:String}{} user
 * @param {String} size Possible values 'xs','s', 'm', 'b', 'x' (or full words like 'small', 'big' ...)
 */
export function createAvatar(user, size = 'm') {
  let jiraOwnerId = user.jiraOwnerId || user.email.substring(0, user.email.indexOf('@'));
  if (!jiraOwnerId) return '';
  return `https://jira2.cnexus.com/secure/useravatar?ownerId=${jiraOwnerId}&size=${size}`;
}
