import nodemailer from "nodemailer";
import { email, emailPass } from "@utils/config.util.js";
import type { InsertJob } from "@/db/schema.js";


const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: email,
        pass: emailPass
    }
});

export async function sendEmail(to: string, subject: string, text: string) {
    try {
        const info = await transporter.sendMail({
            from: email,
            to,
            subject,
            html: text
        });
        console.log("Email sent: " + info.response);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

export function prepareEmailBody(res: string, result: Partial<InsertJob>): string {

    const cleaned = res.trim();

    const parsedRes = JSON.parse(cleaned);
    // Updated to elegant, professional tech colors (Emerald, Amber, Crimson)
    const getScoreColor = (score: number) => {
        if (score >= 80) return "#10b981";
        if (score >= 60) return "#f59e0b";
        return "#ef4444";
    };

    const similarityColor = getScoreColor(parsedRes.similarity_score);
    const atsColor = getScoreColor(parsedRes.ats_score);

    // Styled as clean, subtle tag chips instead of overly bright blocks
    const createTags = (items: string[], bg: string, color: string) =>
        items
            .map(
                (item) => `
      <span style="
        display: inline-block;
        padding: 6px 12px;
        margin: 4px;
        border-radius: 6px;
        background: ${bg};
        color: ${color};
        font-size: 13px;
        font-weight: 500;
      ">
        ${item}
      </span>
    `
            )
            .join("");

    // Clean list styling with modern spacing and custom bullet coloring indicator via borders/padding
    const createList = (items: string[], indicatorColor: string) =>
        items
            .map(
                (item) => `
      <li style="
        margin-bottom: 10px;
        color: #334155;
        line-height: 1.6;
        font-size: 14px;
        list-style-type: none;
        position: relative;
        padding-left: 15px;
        border-left: 3px solid ${indicatorColor};
      ">
        ${item}
      </li>
    `
            )
            .join("");

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 10px;">
    <tr>
      <td align="center">

        <table width="100%" style="max-width: 680px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);" cellpadding="0" cellspacing="0">
          
          <tr>
            <td style="background-color: #0f172a; padding: 40px; text-align: left;">
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="color: #6366f1; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;">
                      Application Insights
                    </div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; line-height: 1.3; color: #ffffff;">
                      ${result.jobTitle ?? "Unknown Position"}
                    </h1>
                    <p style="margin: 8px 0 24px 0; color: #94a3b8; font-size: 15px; font-weight: 400;">
                      ${result.companyName ?? "Unknown Company"} &bull; ${result.location ?? "Unknown Location"}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="${result.url ?? "#"}" target="_blank" style="
                      display: inline-block;
                      background-color: #4f46e5;
                      color: #ffffff;
                      font-weight: 600;
                      font-size: 14px;
                      padding: 12px 24px;
                      text-decoration: none;
                      border-radius: 6px;
                    ">
                      Apply for Position &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  
                  <td width="50%" style="padding-right: 12px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center;">
                      <tr>
                        <td style="color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding-bottom: 8px;">
                          Similarity Match
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 36px; font-weight: 800; color: ${similarityColor};">
                          ${parsedRes.similarity_score}%
                        </td>
                      </tr>
                    </table>
                  </td>

                  <td width="50%" style="padding-left: 12px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center;">
                      <tr>
                        <td style="color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding-bottom: 8px;">
                          ATS Optimization
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 36px; font-weight: 800; color: ${atsColor};">
                          ${parsedRes.ats_score}%
                        </td>
                      </tr>
                    </table>
                  </td>

                </tr>
              </table>

              <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 700; color: #1e293b;">Executive Summary</h3>
              <p style="margin: 0 0 32px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                ${parsedRes.summary}
              </p>

              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 32px;" />

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td width="50%" valign="top" style="padding-right: 15px;">
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #0f766e;">Identified Skills</h4>
                    <div>
                      ${createTags(parsedRes.matching_keywords, "#ccfbf1", "#115e59")}
                    </div>
                  </td>
                  <td width="50%" valign="top" style="padding-left: 15px;">
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #991b1b;">Missing Keywords</h4>
                    <div>
                      ${createTags(parsedRes.missing_keywords, "#fee2e2", "#991b1b")}
                    </div>
                  </td>
                </tr>
              </table>

              <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #1e293b;">Key Strengths</h3>
              <ul style="margin: 0 0 32px 0; padding: 0;">
                ${createList(parsedRes.strengths, "#10b981")}
              </ul>

              <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #1e293b;">Areas of Vulnerability</h3>
              <ul style="margin: 0 0 32px 0; padding: 0;">
                ${createList(parsedRes.weaknesses, "#ef4444")}
              </ul>

              <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #1e293b;">Actionable Suggestions</h3>
              <ul style="margin: 0 0 32px 0; padding: 0;">
                ${createList(parsedRes.improvement_suggestions, "#f59e0b")}
              </ul>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-bottom: 32px;">
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding: 6px 0;"><strong>Active Candidates:</strong></td>
                  <td align="right" style="font-size: 13px; color: #1e293b; padding: 6px 0;">${result.applicants ?? "N/A"}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding: 6px 0;"><strong>Posting Timeline:</strong></td>
                  <td align="right" style="font-size: 13px; color: #1e293b; padding: 6px 0;">${result.postedTime ?? "N/A"}</td>
                </tr>
              </table>


            </td>
          </tr>

          <tr>
            <td style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.4;">
                This evaluation report is an automated diagnostic asset prepared by your Career Management Platform.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

    return emailBody;

}