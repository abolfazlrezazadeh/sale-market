const nodeMailer = require("nodemailer");

const sendMail = async (option) => {
  var transport = nodeMailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "f10ca2f7187627",
      pass: "74d70a6125785e",
    },
  });
  const mailOption = {
    from: "raminrezazadeg687@gmail.com",
    to: option.userEmail,
    subject: option.subject,
    html: option.html,
  };
  await transport.sendMail(mailOption);
};

module.exports = sendMail;
