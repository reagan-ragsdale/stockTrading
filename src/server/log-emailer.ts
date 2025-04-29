import nodemailer from 'nodemailer';
import excelJS from "exceljs"

export const emailer = async (spreadsheetBuffer: excelJS.Buffer) => {
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
            to: process.env['reaganEmail'] + ',' + process.env['briannaEmail'],
            subject: 'KrakenStock Log: ' + today.toLocaleDateString(),
            text: 'Report Attatched',
            attachments: [{
                filename: 'DailyLog.xlsx',
                content: Buffer.from(spreadsheetBuffer),
                contentType:
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              },
            ]
        };

        const info = await transporter.sendMail(mailOptions);
    } catch (error) {
    }
}