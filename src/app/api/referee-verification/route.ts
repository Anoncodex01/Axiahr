import { NextRequest, NextResponse } from 'next/server';
import { executeSingleQuery } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refId, candidateName, formData, timestamp } = body;

    // Basic validation
    if (!refId || !formData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update the reference verification status to 'verified'
    await executeSingleQuery(
      `UPDATE candidate_references 
       SET verification_status = 'verified', 
           updated_at = NOW() 
       WHERE id = ?`,
      [refId]
    );

    // Save the referee verification form data
    const verificationData = {
      ref_id: refId,
      candidate_name: candidateName,
      referee_name: formData.fullName,
      referee_email: formData.email,
      referee_organization: formData.organization,
      referee_position: formData.position,
      relationship: formData.relationship,
      how_long_known: formData.howLongKnown,
      work_quality: formData.workQuality,
      communication_skills: formData.communicationSkills,
      leadership_skills: formData.leadershipSkills,
      teamwork: formData.teamwork,
      reliability: formData.reliability,
      overall_rating: formData.overallRating,
      would_recommend: formData.wouldRecommend,
      strengths: formData.strengths,
      areas_for_improvement: formData.areasForImprovement,
      additional_comments: formData.additionalComments,
      submitted_at: timestamp
    };

    // Insert verification data into a new table (create if doesn't exist)
    await executeSingleQuery(
      `CREATE TABLE IF NOT EXISTS referee_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ref_id INT NOT NULL,
        candidate_name VARCHAR(255),
        referee_name VARCHAR(255) NOT NULL,
        referee_email VARCHAR(255) NOT NULL,
        referee_organization VARCHAR(255),
        referee_position VARCHAR(255),
        relationship VARCHAR(100),
        how_long_known VARCHAR(100),
        work_quality VARCHAR(100),
        communication_skills VARCHAR(100),
        leadership_skills VARCHAR(100),
        teamwork VARCHAR(100),
        reliability VARCHAR(100),
        overall_rating VARCHAR(100),
        would_recommend VARCHAR(100),
        strengths TEXT,
        areas_for_improvement TEXT,
        additional_comments TEXT,
        submitted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      []
    );

    // Insert the verification data
    await executeSingleQuery(
      `INSERT INTO referee_verifications 
       (ref_id, candidate_name, referee_name, referee_email, referee_organization, 
        referee_position, relationship, how_long_known, work_quality, communication_skills, 
        leadership_skills, teamwork, reliability, overall_rating, would_recommend, 
        strengths, areas_for_improvement, additional_comments, submitted_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        refId,
        candidateName,
        verificationData.referee_name,
        verificationData.referee_email,
        verificationData.referee_organization,
        verificationData.referee_position,
        verificationData.relationship,
        verificationData.how_long_known,
        verificationData.work_quality,
        verificationData.communication_skills,
        verificationData.leadership_skills,
        verificationData.teamwork,
        verificationData.reliability,
        verificationData.overall_rating,
        verificationData.would_recommend,
        verificationData.strengths,
        verificationData.areas_for_improvement,
        verificationData.additional_comments,
        verificationData.submitted_at
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Referee verification submitted successfully',
      data: {
        refId,
        candidateName,
        verificationStatus: 'verified'
      }
    });

  } catch (error) {
    console.error('Error saving referee verification:', error);
    return NextResponse.json(
      { error: 'Failed to save referee verification' },
      { status: 500 }
    );
  }
}
