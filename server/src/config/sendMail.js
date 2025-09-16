
import { createTransport } from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Ensure proper path resolution for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const sendMail = async({email,subject,html})=>{
    // Debug: Log environment variables (remove in production)
    console.log('SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not set');
    console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'Set' : 'Not set');
    console.log('Current working directory:', process.cwd());
    
    // Check if credentials are loaded
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SMTP')));
        throw new Error('SMTP credentials not found in environment variables');
    }

    const transporter = createTransport({
        service: 'gmail',
        host:"smtp.gmail.com",
        port:587,
        secure: false,
        requireTLS: true,
        auth:{
            user:process.env.SMTP_USER,
            pass:process.env.SMTP_PASSWORD,
        }
    })

    try {
        const info = await transporter.sendMail({
            from: `"Authentication App" <${process.env.SMTP_USER}>`,
            to:email,
            subject,
            html
        })
        
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email sending failed:', error.message);
        throw error;
    }
}

export default sendMail ;