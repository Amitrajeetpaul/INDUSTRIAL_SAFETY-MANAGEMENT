import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

async function setupTransporter() {
    if (transporter) return transporter;
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });

    return transporter;
}

export async function sendCriticalIncidentAlert(incidentTitle: string, reporterName: string) {
    try {
        const t = await setupTransporter();

        const info = await t.sendMail({
            from: '"InduSafe Alerts" <alerts@indusafe.local>',
            to: "manager@example.com",
            subject: "CRITICAL ALERT: New Safety Incident Reported",
            text: `A new critical incident "${incidentTitle}" has been reported by ${reporterName}. Please check the dashboard immediately.`,
            html: `<b>A new critical incident "${incidentTitle}" has been reported by ${reporterName}.</b><br/>Please check the dashboard immediately.`,
        });

        console.log("=========================================");
        console.log("CRITICAL INCIDENT ALERT SENT TO MANAGER:");
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        console.log("=========================================");
    } catch (error) {
        console.error("Failed to send email alert:", error);
    }
}
