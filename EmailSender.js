const nodemailer = require('nodemailer');
const axios = require('axios');

class EmailSender {
    service = new EmailService()

    constructor (service) {
        this.service = service
    }

    enviar(to, subject, body) {
        return this.service.enviar(to, subject, body);
    }
}

class EmailService {
    async enviar(to, subject, body) {
        throw new Error('Método enviar não implementado.');
    }
}

class GmailService extends EmailService {
    constructor ({ name, user, pass }) {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user,
                pass
            }
        });

        this.sender = {
            name,
            email: user
        }
    }

    async enviar(to, subject, body, attachments = []) {
        try {
            const mailOptions = {
                from: `"${this.sender.name}" <${this.sender.email}>`,
                to,
                subject,
                html: body,
                attachments // Array de anexos
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('E-mail enviado com sucesso:', info.messageId);
        } catch (error) {
            console.error('Erro ao enviar o e-mail:', error.message);
            throw error;
        }
    }
}

class SendGridService extends EmailService {
    constructor ({ apiKey, name, email }) {
        this.apiKey = apiKey;

        this.sender = {
            name,
            email
        };
    }

    async enviar(to, subject, body, attachments = []) {
        try {
            const url = "https://api.sendgrid.com/v3/mail/send";

            const payload = {
                personalizations: [
                    { to: [ { email: to } ] }
                ],
                from: {
                    email: this.sender.email,
                    name: this.sender.name
                },
                subject,
                content: [
                    {
                        type: 'text/html',
                        value: body
                    }
                ],
                attachments: attachments.map(attachment => ({
                    content: attachment.content.toString('base64'),
                    filename: attachment.filename,
                    type: attachment.type,
                    disposition: 'attachment'
                }))
            };

            const response = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.apiKey
                }
            });

            console.log('E-mail enviado com sucesso:', JSON.stringify(response.data));
        } catch (error) {
            const message = error.response?.data || error.message;
            console.error('Erro ao enviar o e-mail:', message);
            throw error;
        }
    }
}

class Attachment {
    constructor({ content, filename, type, disposition = 'attachment' }) {
        this.content = content;
        this.filename = filename;
        this.type = type;
        this.disposition = disposition;
    }

    toFormat() {
        throw new Error('Método toFormat não implementado.');
    }
}

class SendGridAttachment extends Attachment {
    toFormat() {
        return {
            content: this.content.toString('base64'),
            filename: this.filename,
            type: this.type,
            disposition: this.disposition
        };
    }
}

class NodemailerAttachment extends Attachment {
    toFormat() {
        return {
            filename: this.filename,
            content: this.content,
            contentType: this.type
        };
    }
}
