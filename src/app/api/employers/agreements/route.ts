import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET - Fetch agreements for the authenticated employer
export async function GET(request: NextRequest) {
  try {
    // Get token from cookies or Authorization header
    const token = request.cookies.get('employerAuthToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const employerId = decoded.sub;

    // Fetch agreements for this employer
    const agreements = await executeQuery<any>(
      `SELECT 
        id,
        employer_id,
        service_type,
        agreement_type,
        company_name,
        contact_person,
        email,
        phone,
        address,
        city,
        country,
        tin,
        vrn,
        registration_number,
        start_date,
        end_date,
        status,
        digital_signature,
        signature_method,
        agreement_content,
        signed_at,
        created_at,
        updated_at,
        approved_at
      FROM employer_agreements
      WHERE employer_id = ?
      ORDER BY created_at DESC`,
      [employerId]
    );

    const formattedAgreements = agreements.map((agreement: any) => ({
      id: agreement.id.toString(),
      employerId: agreement.employer_id.toString(),
      serviceType: agreement.service_type,
      agreementType: agreement.agreement_type,
      companyName: agreement.company_name,
      contactPerson: agreement.contact_person,
      email: agreement.email,
      phone: agreement.phone,
      address: agreement.address,
      city: agreement.city,
      country: agreement.country,
      tin: agreement.tin,
      vrn: agreement.vrn,
      registrationNumber: agreement.registration_number,
      startDate: agreement.start_date ? new Date(agreement.start_date).toISOString().split('T')[0] : null,
      endDate: agreement.end_date ? new Date(agreement.end_date).toISOString().split('T')[0] : null,
      status: agreement.status,
      digitalSignature: agreement.digital_signature,
      signatureMethod: agreement.signature_method,
      agreementContent: agreement.agreement_content,
      signedAt: agreement.signed_at ? new Date(agreement.signed_at).toISOString() : null,
      createdAt: agreement.created_at ? new Date(agreement.created_at).toISOString() : null,
      updatedAt: agreement.updated_at ? new Date(agreement.updated_at).toISOString() : null,
      approvedAt: agreement.approved_at ? new Date(agreement.approved_at).toISOString() : null
    }));

    return NextResponse.json({
      success: true,
      agreements: formattedAgreements
    });

  } catch (error: any) {
    console.error('Get agreements error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agreements', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create a new agreement
export async function POST(request: NextRequest) {
  try {
    // Get token from cookies or Authorization header
    const token = request.cookies.get('employerAuthToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const employerId = decoded.sub;
    const body = await request.json();

    const {
      serviceType,
      agreementType,
      companyName,
      contactPerson,
      email,
      phone,
      address,
      city,
      country,
      tin,
      vrn,
      registrationNumber,
      startDate,
      endDate,
      digitalSignature,
      signatureMethod,
      agreementContent
    } = body;

    // Validation
    if (!serviceType || !agreementType || !companyName || !contactPerson || !email || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!digitalSignature) {
      return NextResponse.json(
        { error: 'Digital signature is required' },
        { status: 400 }
      );
    }

    // Insert agreement
    const result = await executeSingleQuery(
      `INSERT INTO employer_agreements (
        employer_id,
        service_type,
        agreement_type,
        company_name,
        contact_person,
        email,
        phone,
        address,
        city,
        country,
        tin,
        vrn,
        registration_number,
        start_date,
        end_date,
        status,
        digital_signature,
        signature_method,
        signed_at,
        agreement_content
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        employerId,
        serviceType,
        agreementType,
        companyName,
        contactPerson,
        email,
        phone || null,
        address || null,
        city || null,
        country || null,
        tin || null,
        vrn || null,
        registrationNumber || null,
        startDate,
        endDate,
        'signed', // Status is 'signed' when submitted
        digitalSignature,
        signatureMethod || 'draw',
        agreementContent || null
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Agreement submitted successfully',
      data: {
        agreementId: result.insertId.toString(),
        status: 'signed'
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create agreement error:', error);
    return NextResponse.json(
      { error: 'Failed to create agreement', details: error?.message },
      { status: 500 }
    );
  }
}

