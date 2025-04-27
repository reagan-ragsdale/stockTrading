import nodemailer from 'nodemailer';

export const emailer = async () => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env['EmailHandle'],
                pass: process.env['EmailPass']
            }
        });

        let today = new Date()
        const mailOptions = {
            from: process.env['EmailHandle'],
            to: process.env['reaganEmail'],
            subject: 'Error',
            text: 'Log Data: ' + today.toLocaleDateString(),
            attachments: [{
                filename: 'dailyLog.xlsx',
                path: './dailyLog.xlsx'
            }]
        };

        const info = await transporter.sendMail(mailOptions);
    } catch (error) {
    }
}