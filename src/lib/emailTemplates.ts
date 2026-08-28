export const evaluationEmailTemplate = (data: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  recommendation: string;
  interviewerNotes: string;
  interviewerName: string;
  overallRating: string;
  evaluationUrl: string;
}) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Interview Evaluation Report</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .recommendation { background: ${data.recommendation === 'offer' ? '#d4edda' : data.recommendation === 'not_interested' ? '#f8d7da' : '#fff3cd'}; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Interview Evaluation Report</h1>
            <p>Candidate Assessment Complete</p>
        </div>
        
        <div class="content">
            <h2>Evaluation Summary</h2>
            <p><strong>Candidate:</strong> ${data.candidateName}</p>
            <p><strong>Position:</strong> ${data.jobTitle}</p>
            <p><strong>Company:</strong> ${data.companyName}</p>
            <p><strong>Interviewer:</strong> ${data.interviewerName}</p>
            <p><strong>Overall Rating:</strong> ${data.overallRating}</p>
            
            <div class="recommendation">
                <h3>Recommendation: ${data.recommendation === 'offer' ? '✅ HIRE' : data.recommendation === 'not_interested' ? '❌ DO NOT HIRE' : '⏸️ HOLD'}</h3>
            </div>
            
            <h3>Interviewer Notes:</h3>
            <p style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
                ${data.interviewerNotes || 'No additional notes provided.'}
            </p>
            
            <a href="${data.evaluationUrl}" class="button">View Full Evaluation Report</a>
            
            <p><em>This evaluation has been automatically generated and sent to you as the hiring manager. Please review the full report for detailed assessment criteria.</em></p>
        </div>
        
        <div class="footer">
            <p>This is an automated message from the recruitment system. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
  `;
};
