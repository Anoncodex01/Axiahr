import { NextRequest, NextResponse } from 'next/server';
import { EvaluationData } from '@/components/EvaluationForm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, evaluationData, candidateName, jobTitle, companyName } = body;

    // Validate required fields
    if (!applicationId || !evaluationData || !candidateName || !jobTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In a real application, you would:
    // 1. Save the evaluation to your database
    // 2. Update the application status based on recommendation
    // 3. Send notification email to employer
    // 4. Log the evaluation for audit purposes

    console.log('Evaluation submitted:', {
      applicationId,
      candidateName,
      jobTitle,
      companyName,
      evaluationData,
      timestamp: new Date().toISOString()
    });

    // Simulate saving to database
    const evaluationRecord = {
      id: `eval_${Date.now()}`,
      applicationId,
      candidateName,
      jobTitle,
      companyName,
      evaluationData,
      submittedAt: new Date().toISOString(),
      status: 'submitted'
    };

    // Simulate sending email notification to employer
    const emailNotification = {
      to: 'employer@company.com', // This would come from job/company data
      subject: `Interview Evaluation Report - ${candidateName}`,
      template: 'evaluation-report',
      data: {
        candidateName,
        jobTitle,
        companyName,
        recommendation: evaluationData.recommendation,
        interviewerNotes: evaluationData.interviewerNotes,
        interviewerName: evaluationData.interviewerName,
        overallRating: calculateOverallRating(evaluationData),
        evaluationUrl: `/admin/evaluations/${evaluationRecord.id}`
      }
    };

    console.log('Email notification prepared:', emailNotification);

    // Simulate updating application status
    let newApplicationStatus = 'interviewed';
    if (evaluationData.recommendation === 'offer') {
      newApplicationStatus = 'selected';
    } else if (evaluationData.recommendation === 'not_interested') {
      newApplicationStatus = 'rejected';
    }

    console.log('Application status updated to:', newApplicationStatus);

    return NextResponse.json({
      success: true,
      evaluationId: evaluationRecord.id,
      applicationStatus: newApplicationStatus,
      message: 'Evaluation submitted successfully and employer has been notified'
    });

  } catch (error) {
    console.error('Error submitting evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to submit evaluation' },
      { status: 500 }
    );
  }
}

function calculateOverallRating(evaluationData: EvaluationData): string {
  const ratings = [
    evaluationData.communicationSkills,
    evaluationData.technicalSkills,
    evaluationData.experience,
    evaluationData.culturalFit,
    evaluationData.leadership
  ];

  const ratingValues: Record<string, number> = {
    'outstanding': 5,
    'above_satisfactory': 4,
    'satisfactory': 3,
    'below_satisfactory': 2,
    'unsatisfactory': 1
  };

  const totalScore = ratings.reduce((sum, rating) => sum + (ratingValues[rating] || 0), 0);
  const averageScore = totalScore / ratings.length;

  if (averageScore >= 4.5) return 'Outstanding';
  if (averageScore >= 3.5) return 'Above Satisfactory';
  if (averageScore >= 2.5) return 'Satisfactory';
  if (averageScore >= 1.5) return 'Below Satisfactory';
  return 'Unsatisfactory';
}
