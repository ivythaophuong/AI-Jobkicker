import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * Extracts raw text from a DOCX file buffer.
 */
export const extractTextFromDocx = async (arrayBuffer) => {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
};

/**
 * Extracts raw text from a PDF file buffer.
 */
export const extractTextFromPdf = async (arrayBuffer) => {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Uses the LLM to map raw text to our structured Resume JSON schema.
 * Note: This facilitates the "Overleaf Model" by turning messy text into structured blocks.
 */
export const mapTextToResumeSchema = async (rawText, llmKey) => {
  // In a real implementation, this would call your Anthropic/OpenAI API
  // For now, we'll simulate the logic structure
  const prompt = `
    Extract the following information from this resume text and return it as a JSON object:
    - personalInfo (fullName, email, phone, location, linkedin, website)
    - summary
    - experience (company, position, startDate, endDate, description [array of bullets])
    - education (school, degree, year)
    - skills (array of strings)

    Resume Text:
    ${rawText}
  `;

  // This would be your API call logic...
  // For the sake of the demo, I'll return a structured template
  console.log('LLM Mapping triggered with text length:', rawText.length);
  
  // Return a rich sample that shows off the templates
  return {
    personalInfo: { 
      fullName: "Alex Sterling", 
      email: "alex.sterling@example.com", 
      phone: "+1 (555) 000-1234", 
      location: "San Francisco, CA", 
      linkedin: "linkedin.com/in/alexsterling", 
      website: "alexsterling.dev" 
    },
    summary: "Senior Software Engineer with 8+ years of experience in distributed systems and cloud architecture. Proven track record of scaling high-traffic applications and leading cross-functional teams to deliver mission-critical features.",
    experience: [
      {
        company: "TechFlow Systems",
        position: "Lead Backend Engineer",
        startDate: "Jan 2021",
        endDate: "Present",
        description: [
          "Architected a real-time data streaming pipeline using Kafka, reducing latency by 45% for 1M+ daily users.",
          "Led a team of 6 engineers to migrate legacy monolith to a microservices architecture on AWS.",
          "Optimized SQL query performance across shared databases, resulting in a 30% reduction in server costs."
        ]
      },
      {
        company: "Innovate AI",
        position: "Software Engineer",
        startDate: "Jun 2018",
        endDate: "Dec 2020",
        description: [
          "Developed and deployed 15+ RESTful APIs using Node.js and TypeScript for a core AI product.",
          "Collaborated with UX designers to implement responsive, accessible front-end components."
        ]
      }
    ],
    education: [
      { school: "Stanford University", degree: "M.S. in Computer Science", year: "2018" },
      { school: "UC Berkeley", degree: "B.S. in Software Engineering", year: "2016" }
    ],
    skills: ["React", "Node.js", "Python", "AWS", "Kubernetes", "PostgreSQL", "System Design", "Agile"]
  };
};
