const nodemailer = require("nodemailer");
var transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "2b096888b9f669",
        pass: "0b364f09ec1c08"
    }
});
message = {
    from: "from-example@email.com",
    to: "martin.air@seznam.cz",
    subject: "Subject",
    html: "<h1>Hello SMTP Email</h1>"
};
transporter.sendMail(message, (err, info) => {
    if (err) {
        console.log(err)
    } else {
        console.log(info);
    }
})