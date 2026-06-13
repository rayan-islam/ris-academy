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
    .logo { margin-bottom: 15px; }
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
    <div class="logo">
      <svg width="60" height="68" viewBox="0 0 300 340" xmlns="http://www.w3.org/2000/svg">
        <polygon points="150,52 242,103 242,205 150,256 58,205 58,103" fill="#185FA5"/>
        <polygon points="150,70 224,113 224,197 150,240 76,197 76,113" fill="none" stroke="#B5D4F4" stroke-width="1.5"/>
        <text x="150" y="186" text-anchor="middle" font-family="Georgia, serif" font-size="88" font-weight="700" fill="#ffffff" letter-spacing="-4">RI</text>
        <text x="198" y="140" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-weight="700" fill="#B5D4F4">'s</text>
        <rect x="122" y="38" width="56" height="8" rx="2" fill="#B5D4F4"/>
        <polygon points="150,22 180,38 150,38 120,38" fill="#B5D4F4"/>
        <line x1="180" y1="38" x2="180" y2="52" stroke="#B5D4F4" stroke-width="2"/>
        <circle cx="180" cy="55" r="3" fill="#B5D4F4"/>
        <text x="150" y="290" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="700" fill="#185FA5" letter-spacing="6">ACADEMY</text>
        <text x="150" y="314" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#888780" letter-spacing="2">HSC Excellence Center</text>
        <line x1="58" y1="290" x2="94" y2="290" stroke="#185FA5" stroke-width="1"/>
        <line x1="206" y1="290" x2="242" y2="290" stroke="#185FA5" stroke-width="1"/>
      </svg>
    </div>
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
