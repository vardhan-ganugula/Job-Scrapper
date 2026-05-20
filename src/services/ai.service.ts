import OpenAI from "openai";
import { openaiApiKey } from "@utils/config.util.js";

export type ModelType = "gemini-2.5-flash" | "gemini-2.0-flash" | "gpt-4" | "gemini-3.1-pro-preview" | "gemma-4-26b-a4b-it" | "gemini-flash-latest" | "gemini-2.5-flash-lite";

class AI {
  private openAi: OpenAI;
  private __model: ModelType;

  constructor(model: ModelType = "gemini-2.5-flash", key: string = openaiApiKey, baseURL: string = 'https://generativelanguage.googleapis.com/v1beta/openai/') {
    this.openAi = new OpenAI({
      apiKey: key,
      baseURL: baseURL,
    });
    this.__model = model;
  }


  async extractResumeDetails(text: string): Promise<string | null> {
    const response = await this.openAi.chat.completions.create({
      model: this.__model,
      messages: [
        {
          role: "system",
          content: `You are a precise Telegram message analyzer. 
Your task is to extract structured job-related details from short or informal Telegram messages. 
Return the result strictly as a valid JSON object containing any of the following fields if available:

{
  "keyword": String,
  "location": String,
  "experienceLevel": String,
  "remote": String,
  "jobType": String,
  "easyApply": Boolean
}

Guidelines:
- Messages may be short or written informally, so infer meaning carefully (e.g., “WFH” = remote, “onsite” = on-site).
- Include only the fields that are clearly mentioned or confidently inferred.
- Do not include any field that is not found or uncertain.
- "location" by default is India
- "keyword" should describe the role or position (e.g., "Frontend Developer", "Python Intern").
- "remote" can be values like "remote", "hybrid", or "onsite".
- "easyApply" should be true if the message mentions easy/quick apply; otherwise, omit it.
- The output must be **strictly a JSON object** with no extra text, formatting, or explanation and also no array format.
`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: {
        type: "json_object",
      },
    });
    if (response?.choices?.[0]) {
      return response.choices[0].message.content ?? null;
    }
    return null;
  }

  async askQuestion(text: string): Promise<string | null> {
    const response = await this.openAi.chat.completions.create({
      model: this.__model,
      messages: [
        {
          'role': 'system',
          'content': 'you are a friendly ai chat bot, you reply with simple and easily understandable english',
        },
        {
          'role': 'user',
          'content': text
        }
      ]
    })
    if (response?.choices?.[0]) {
      return response.choices[0].message.content || null;
    }
    return null;
  }


  async compareJOBDescriptions(desc1: string): Promise<string> {
    const response = await this.openAi.chat.completions.create({
      model: this.__model,
      // Forces the model to return valid JSON at the API level
      response_format: { type: "json_object" }, 
      messages: [
        {
          role: "system",
          content: `
You are an advanced, strict ATS (Applicant Tracking System) simulation engine.
Your task is to compare a candidate's resume against a target job description for structural, technical, and contextual alignment.

CRITICAL GUARDRAILS FOR KEYWORDS:
1. "matching_keywords" must ONLY include explicit tech stacks, methodologies, skills, or tools present in BOTH documents.
2. "missing_keywords" must ONLY include critical hard skills, tools, frameworks, certifications, or concepts explicitly demanded in the TARGET JOB DESCRIPTION that are missing from the Candidate's resume.
3. ABSOLUTE FORBIDDEN RULE: Do NOT look at the candidate's profile and guess what else they should know (e.g., if they know React, do not suggest Next.js or Tailwind as "missing" unless those exact words are explicitly written in the TARGET JOB DESCRIPTION). 
4. If a technology or concept is not written anywhere in the TARGET JOB DESCRIPTION, it is an automatic hallucination to include it in the output.

Analysis Criteria:
- Overall similarity score (0-100) based on role alignment.
- ATS match score (0-100) based strictly on keyword density and presence.
- Strengths & Weaknesses: Grounded solely on the comparison of the two texts.
- Suggestions: Clear instructions on how the candidate can update their resume language to better match the target job description.
`
        },
        {
          role: "user",
          content: `
Perform an ATS gap analysis by comparing the candidate resume against the target job description.

[TARGET JOB DESCRIPTION]
${desc1}

[CANDIDATE RESUME]
EXPERIENCE
SoraMinds | Full-Stack Developer
Aug 2025 - Jan 2026 | Remote
• Developed and maintained full-stack applications, contributing to both front-end and back-end features.
• Implemented WebSocket-based real-time communication to improve application responsiveness and system performance.
• Deployed and managed applications on AWS EC2 virtual machines, supporting production environments.
• Collaborated with cross-functional teams to integrate LLM responses into full-stack applications.

PROJECTS
Job Listener (GitHub)
• Built an AI-powered automation agent for personalized job recommendations.
• Integrated resume-based skill matching using AI for relevance scoring. Automated daily job search and notifications via Telegram bot.
• Tech Stack: MongoDB, Express.js, Node.js, Telegram API, WebScraping

EduAgentX (GitHub)
• Integrated RPA workflows with the MERN stack for automating leave approvals, evaluations, and result distribution.
• Collaborated with the RPA team to connect automation solutions with a MERN-based platform for educational use.
• Tech Stack: Express.js, React.js, Node.js

EDUCATION
CMR Institute of Technology
• B.Tech in Computer Science and Engineering | Nov 2022 - Present | CGPA: 8.78 / 10
Sri Chaitanya Junior College
• Higher Secondary Education | Mar 2020 - Apr 2022 | CGPA: 9.48 / 10

SKILLS
• Languages/Frameworks: Python, JavaScript, Express.js, React.js, HTML, CSS
• Databases: MySQL, MongoDB
• Tools: GitHub, VS Code, Postman, Docker, AWS VM2

[OUTPUT FORMAT]
Return a JSON object that strictly adheres to the schema below. No conversational filler text outside the JSON structure.

{
  "similarity_score": 0,
  "ats_score": 0,
  "summary": "A concise breakdown of why these scores were given based on alignment.",
  "matching_keywords": ["keyword_found_in_both"],
  "missing_keywords": ["must_be_explicitly_in_target_job_description_but_absent_in_resume"],
  "technical_skills_match": {
    "matched": ["tech_found_in_both"],
    "missing": ["tech_explicitly_in_target_but_absent_in_resume"]
  },
  "experience_analysis": {
    "relevant_experience": "Analysis of the candidate's existing experience against requirements.",
    "experience_gaps": "Direct discrepancies between required experience duration/scope vs candidate reality."
  },
  "strengths": ["Grounded point 1", "Grounded point 2"],
  "weaknesses": ["Grounded point 1", "Grounded point 2"],
  "improvement_suggestions": ["Actionable step 1", "Actionable step 2"],
  "coverLetter" : "cover leter information for that job for the user in markdown format"
}
`
        }
      ]
    });

    if (response?.choices?.[0]?.message?.content) {
      return response.choices[0].message.content;
    }
    throw new Error("Failed to get a valid response from the AI model.");
}

}


export default AI;