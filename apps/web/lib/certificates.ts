import fs from 'fs';
import path from 'path';

const certDir = path.join(process.cwd(), 'public', 'certificates');

export function generateCertificateNumber(): string {
  const prefix = 'RIS';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function generateCertificateHTML(params: {
  studentName: string;
  courseName: string;
  completionDate: string;
  certificateNumber: string;
}): string {
  const { studentName, courseName, completionDate, certificateNumber } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; }
    .certificate {
      width: 1122px;
      height: 793px;
      padding: 60px;
      background: linear-gradient(135deg, #f8fafc 0%, #e8f0f9 100%);
      border: 8px double #185FA5;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      position: relative;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 180px;
      color: rgba(24, 95, 165, 0.04);
      font-weight: bold;
      pointer-events: none;
    }
    .logo { font-size: 24px; color: #185FA5; font-weight: bold; margin-bottom: 10px; }
    .title { font-size: 48px; color: #185FA5; font-weight: bold; margin: 30px 0 10px; letter-spacing: 2px; }
    .subtitle { font-size: 20px; color: #64748b; margin-bottom: 40px; }
    .presented { font-size: 18px; color: #475569; margin-bottom: 10px; }
    .name { font-size: 42px; color: #1e293b; font-weight: bold; margin: 10px 0; border-bottom: 2px solid #185FA5; display: inline-block; padding: 0 20px 10px; }
    .course { font-size: 22px; color: #185FA5; margin: 20px 0; }
    .date { font-size: 16px; color: #64748b; margin-bottom: 60px; }
    .footer { font-size: 14px; color: #94a3b8; }
    .cert-number { font-size: 12px; color: #94a3b8; margin-bottom: 20px; }
    .seal { font-size: 14px; color: #475569; margin-top: 20px; font-style: italic; }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="watermark">RI</div>
    <div class="logo">RI's Academy</div>
    <div class="title">Certificate of Completion</div>
    <div class="subtitle">This certificate is proudly awarded to</div>
    <div class="presented">This is to certify that</div>
    <div class="name">${studentName}</div>
    <div class="presented">has successfully completed the course</div>
    <div class="course">${courseName}</div>
    <div class="date">Date of Completion: ${completionDate}</div>
    <div class="cert-number">Certificate No: ${certificateNumber}</div>
    <div class="footer">RI's Academy - Excellence in Education</div>
    <div class="seal">Digitally Verified Certificate</div>
  </div>
</body>
</html>`;
}

export async function saveCertificate(
  html: string,
  certificateNumber: string,
): Promise<string> {
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }
  const filePath = path.join(certDir, `${certificateNumber}.html`);
  fs.writeFileSync(filePath, html);
  return `/certificates/${certificateNumber}.html`;
}
