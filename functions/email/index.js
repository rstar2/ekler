const nodemailer = require('nodemailer');

/**
 * These options are actually the Firebase Functions config (e.g. functions.config())
 * @param {{gmail: {email: String, pass: String}, mailtrap: {user: String, pass: String, from: String}, fromPrefix: String}} options
 */
module.exports = function(options) {
  const { gmail, mailtrap, fromPrefix = '' } = options;

  // if Gmail transport is available then use it (like in production)
  // otherwise use the Mailtrap (in dev case for testing purpose)
  let transport, emailFrom;
  if (gmail) {
    transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmail.email,
        pass: gmail.pass
      }
    });

    emailFrom = gmail.email;
  } else if (mailtrap) {
    transport = nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: mailtrap.user,
        pass: mailtrap.pass
      }
    });
    emailFrom = mailtrap.pass || 'admin@test.test';
  }

  if (emailFrom && fromPrefix) {
    emailFrom = fromPrefix.trim() + ' ' + emailFrom;
  }

  return {
    /**
     * Send a email to user's account email
     * @param {{uid: String, email: String, receiveEmails: Boolean}} user
     * @param {{subject: String, text?:String, html?: String}} payload
     */
    async sendEmail(user, payload) {
      // not email config - so do nothing
      if (!transport) return false;

      const { uid, email, receiveEmails = true } = user;

      // check if user wants to NOT receive any emails
      if (!receiveEmails) return false;

      const { subject, text, html } = payload;

      if (!text && !html) throw new Error('Either text or html should be set');
      if (text && html) throw new Error('Either only text or only html should be set');

      console.log(`Send email to user ${uid} - ${email}: ${subject}`);

      const mailOptions = {
        from: emailFrom,
        to: email,

        subject, //Email subject
        text, //Email content in plain text
        html //Email content in HTML
      };

      return transport.sendMail(mailOptions);
    }
  };
};
