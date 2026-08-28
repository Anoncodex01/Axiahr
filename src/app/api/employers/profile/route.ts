import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET - Fetch employer profile
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

    // Fetch employer profile with all fields
    const employers = await executeQuery<{
      id: number;
      company_name: string;
      contact_person: string;
      first_name: string | null;
      last_name: string | null;
      job_title: string | null;
      email: string;
      landline_phone: string | null;
      landline_country_code: string | null;
      mobile_phone: string | null;
      mobile_country_code: string | null;
      plot_no: string | null;
      street_name: string | null;
      landmark: string | null;
      postal_code: string | null;
      city: string | null;
      region: string | null;
      country: string | null;
      google_location_link: string | null;
      industry: string | null;
      business_type: string | null;
      company_size: string | null;
      company_brief: string | null;
      company_logo: string | null;
      website: string | null;
      founded_year: string | null;
      employee_count: string | null;
      annual_revenue: string | null;
      company_stage: string | null;
      linkedin_url: string | null;
      instagram_url: string | null;
      facebook_url: string | null;
      other_social_media: string | null;
      tin: string | null;
      vrn: string | null;
      registration_number: string | null;
      tax_office: string | null;
      business_license: string | null;
      legal_entity_name: string | null;
      registered_address: string | null;
      company_profile_document: string | null;
      business_license_document: string | null;
      tax_certificate_document: string | null;
      registration_certificate_document: string | null;
      status: string;
      profile_status: string | null;
    }>(
      `SELECT id, company_name, contact_person, first_name, last_name, job_title,
              email, landline_phone, landline_country_code, mobile_phone, mobile_country_code,
              plot_no, street_name, landmark, postal_code, city, region, country,
              google_location_link, industry, business_type, company_size, company_brief, company_logo, website,
              founded_year, employee_count, annual_revenue, company_stage,
              linkedin_url, instagram_url, facebook_url, other_social_media,
              tin, vrn, registration_number, tax_office, business_license,
              legal_entity_name, registered_address,
              company_profile_document, business_license_document, tax_certificate_document, registration_certificate_document,
              status, profile_status
       FROM employers
       WHERE id = ?`,
      [employerId]
    );

    if (employers.length === 0) {
      return NextResponse.json(
        { error: 'Employer not found' },
        { status: 404 }
      );
    }

    const employer = employers[0];

    return NextResponse.json({
      success: true,
      data: {
        id: employer.id.toString(),
        companyName: employer.company_name,
        contactPerson: employer.contact_person,
        firstName: employer.first_name || '',
        lastName: employer.last_name || '',
        jobTitle: employer.job_title || '',
        email: employer.email,
        // Phone fields
        landlinePhone: employer.landline_phone || '',
        landlineCountryCode: employer.landline_country_code || '',
        mobilePhone: employer.mobile_phone || '',
        mobileCountryCode: employer.mobile_country_code || '',
        // Address fields
        plotNo: employer.plot_no || '',
        streetName: employer.street_name || '',
        landmark: employer.landmark || '',
        postalCode: employer.postal_code || '',
        city: employer.city || '',
        region: employer.region || '',
        country: employer.country || '',
        googleLocationLink: employer.google_location_link || '',
        // Company details
        industry: employer.industry || '',
        businessType: employer.business_type || '',
        companySize: employer.company_size || '',
        companyBrief: employer.company_brief || '',
        companyLogo: (employer as any).company_logo || '',
        website: employer.website || '',
        foundedYear: employer.founded_year || '',
        employeeCount: employer.employee_count || '',
        annualRevenue: employer.annual_revenue || '',
        companyStage: employer.company_stage || '',
        // Online presence
        linkedinUrl: employer.linkedin_url || '',
        instagramUrl: employer.instagram_url || '',
        facebookUrl: employer.facebook_url || '',
        otherSocialMedia: employer.other_social_media || '',
        // Legal & Tax
        tin: employer.tin || '',
        vrn: employer.vrn || '',
        registrationNumber: employer.registration_number || '',
        taxOffice: employer.tax_office || '',
        businessLicense: employer.business_license || '',
        legalEntityName: employer.legal_entity_name || '',
        registeredAddress: employer.registered_address || '',
        // Document URLs
        companyProfileDocument: employer.company_profile_document || '',
        businessLicenseDocument: employer.business_license_document || '',
        taxCertificateDocument: employer.tax_certificate_document || '',
        registrationCertificateDocument: employer.registration_certificate_document || '',
        status: employer.status,
        profileStatus: employer.profile_status || 'incomplete'
      }
    });

  } catch (error: any) {
    console.error('Fetch employer profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Update employer profile
export async function PUT(request: NextRequest) {
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
      companyName,
      businessType,
      industry,
      foundedYear,
      employeeCount,
      annualRevenue,
      companyStage,
      website,
      plotNo,
      streetName,
      landmark,
      postalCode,
      country,
      state,
      city,
      landlinePhone,
      landlineCountryCode,
      mobilePhone,
      mobileCountryCode,
      googleLocationLink,
      linkedinUrl,
      instagramUrl,
      facebookUrl,
      otherSocialMedia,
      tin,
      vrn,
      registrationNumber,
      taxOffice,
      businessLicense,
      legalEntityName,
      registeredAddress,
      companyBrief,
      step // Track which step is being saved
    } = body;

    // Allow partial updates - no strict validation for all fields
    // Only validate if it's a final submission (step 4)
    if (step === 4) {
      if (!companyName || !industry || !country) {
        return NextResponse.json(
          { error: 'Company name, industry, and country are required for final submission' },
          { status: 400 }
        );
      }
    }

    // Address is now stored in separate fields, no need to build a combined address

    // Determine company size from employee count (only if provided)
    let companySize = null;
    if (employeeCount) {
      const countStr = employeeCount.toString().replace(/[^0-9]/g, '');
      if (countStr) {
        const count = parseInt(countStr);
        if (count < 10) companySize = 'startup';
        else if (count < 50) companySize = 'small';
        else if (count < 200) companySize = 'medium';
        else if (count < 1000) companySize = 'large';
        else companySize = 'enterprise';
      }
    }

    // Phone is now stored in separate fields (landline_phone and mobile_phone)

    // Build dynamic UPDATE query based on provided fields
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // Set profile_status to 'pending' when submitting for verification (step 4)
    if (step === 4) {
      updateFields.push('profile_status = ?');
      updateValues.push('pending');
    }

    // Company Details
    if (companyName) {
      updateFields.push('company_name = ?');
      updateValues.push(companyName.trim());
    }
    if (businessType !== undefined) {
      updateFields.push('business_type = ?');
      updateValues.push(businessType?.trim() || null);
    }
    if (industry) {
      updateFields.push('industry = ?');
      updateValues.push(industry.trim());
    }
    if (companyBrief !== undefined) {
      updateFields.push('company_brief = ?');
      updateValues.push(companyBrief?.trim() || null);
    }
    if (foundedYear !== undefined) {
      updateFields.push('founded_year = ?');
      updateValues.push(foundedYear?.trim() || null);
    }
    if (employeeCount !== undefined) {
      updateFields.push('employee_count = ?');
      updateValues.push(employeeCount?.trim() || null);
    }
    if (annualRevenue !== undefined) {
      updateFields.push('annual_revenue = ?');
      updateValues.push(annualRevenue?.trim() || null);
    }
    if (companyStage !== undefined) {
      updateFields.push('company_stage = ?');
      updateValues.push(companyStage?.trim() || null);
    }
    if (website !== undefined) {
      updateFields.push('website = ?');
      updateValues.push(website?.trim() || null);
    }
    if (companySize !== null) {
      updateFields.push('company_size = ?');
      updateValues.push(companySize);
    }

    // Address Information
    if (plotNo !== undefined) {
      updateFields.push('plot_no = ?');
      updateValues.push(plotNo?.trim() || null);
    }
    if (streetName !== undefined) {
      updateFields.push('street_name = ?');
      updateValues.push(streetName?.trim() || null);
    }
    if (landmark !== undefined) {
      updateFields.push('landmark = ?');
      updateValues.push(landmark?.trim() || null);
    }
    if (postalCode !== undefined) {
      updateFields.push('postal_code = ?');
      updateValues.push(postalCode?.trim() || null);
    }
    if (city !== undefined) {
      updateFields.push('city = ?');
      updateValues.push(city?.trim() || null);
    }
    if (state !== undefined) {
      // Map state to region (we only use region in the database)
      updateFields.push('region = ?');
      updateValues.push(state?.trim() || null);
    }
    if (country) {
      updateFields.push('country = ?');
      updateValues.push(country.trim());
    }
    if (googleLocationLink !== undefined) {
      updateFields.push('google_location_link = ?');
      updateValues.push(googleLocationLink?.trim() || null);
    }

    // Contact Information (separate fields)
    if (landlinePhone !== undefined) {
      updateFields.push('landline_phone = ?');
      updateValues.push(landlinePhone?.trim() || null);
    }
    if (landlineCountryCode !== undefined) {
      updateFields.push('landline_country_code = ?');
      updateValues.push(landlineCountryCode?.trim() || null);
    }
    if (mobilePhone !== undefined) {
      updateFields.push('mobile_phone = ?');
      updateValues.push(mobilePhone?.trim() || null);
    }
    if (mobileCountryCode !== undefined) {
      updateFields.push('mobile_country_code = ?');
      updateValues.push(mobileCountryCode?.trim() || null);
    }

    // Online Presence
    if (linkedinUrl !== undefined) {
      updateFields.push('linkedin_url = ?');
      updateValues.push(linkedinUrl?.trim() || null);
    }
    if (instagramUrl !== undefined) {
      updateFields.push('instagram_url = ?');
      updateValues.push(instagramUrl?.trim() || null);
    }
    if (facebookUrl !== undefined) {
      updateFields.push('facebook_url = ?');
      updateValues.push(facebookUrl?.trim() || null);
    }
    if (otherSocialMedia !== undefined) {
      updateFields.push('other_social_media = ?');
      updateValues.push(otherSocialMedia?.trim() || null);
    }

    // Legal & Tax Information
    if (tin !== undefined) {
      updateFields.push('tin = ?');
      updateValues.push(tin?.trim() || null);
    }
    if (vrn !== undefined) {
      updateFields.push('vrn = ?');
      updateValues.push(vrn?.trim() || null);
    }
    if (registrationNumber !== undefined) {
      updateFields.push('registration_number = ?');
      updateValues.push(registrationNumber?.trim() || null);
    }
    if (taxOffice !== undefined) {
      updateFields.push('tax_office = ?');
      updateValues.push(taxOffice?.trim() || null);
    }
    if (businessLicense !== undefined) {
      updateFields.push('business_license = ?');
      updateValues.push(businessLicense?.trim() || null);
    }
    if (legalEntityName !== undefined) {
      updateFields.push('legal_entity_name = ?');
      updateValues.push(legalEntityName?.trim() || null);
    }
    if (registeredAddress !== undefined) {
      updateFields.push('registered_address = ?');
      updateValues.push(registeredAddress?.trim() || null);
    }

    // Always update updated_at
    updateFields.push('updated_at = NOW()');
    updateValues.push(employerId);

    // Update employer profile only if there are fields to update
    if (updateFields.length > 1) { // More than just updated_at
      try {
        await executeSingleQuery(
          `UPDATE employers 
           SET ${updateFields.join(', ')}
           WHERE id = ?`,
          updateValues
        );
      } catch (error: any) {
        // If new columns don't exist, filter them out and try again
        if (error?.code === 'ER_BAD_FIELD_ERROR') {
          const basicFields = updateFields.filter(field => 
            !field.includes('company_brief') && 
            !field.includes('region') &&
            !field.includes('website')
          );
          const basicValues = updateValues.slice(0, -1); // Remove employerId
          
          // Rebuild basic values array
          const filteredValues: any[] = [];
          let valueIndex = 0;
          
          if (companyName) filteredValues.push(companyName.trim());
          if (industry) filteredValues.push(industry.trim());
          if (companySize !== null) filteredValues.push(companySize);
          if (country) filteredValues.push(country.trim());
          
          filteredValues.push(employerId);
          
          if (basicFields.length > 1) {
            await executeSingleQuery(
              `UPDATE employers 
               SET ${basicFields.join(', ')}
               WHERE id = ?`,
              filteredValues
            );
          }
        } else {
          throw error;
        }
      }
    }

    // Store additional profile data in a separate table or JSON field
    // For now, we'll store it in a JSON field if available, or we can create a separate table
    // This is a simplified version - you may want to create a separate employer_profiles table

    // Determine status based on step
    let status = 'pending';
    let message = 'Company profile updated successfully.';
    
    if (step === 4) {
      status = 'pending';
      message = 'Company profile submitted successfully. Your profile is pending verification.';
    } else if (step) {
      message = `Step ${step} saved successfully. You can continue later.`;
    }

    return NextResponse.json({
      success: true,
      message: message,
      data: {
        employerId: employerId.toString(),
        step: step || null,
        status: step === 4 ? 'pending' : 'incomplete'
      }
    });

  } catch (error: any) {
    console.error('Update employer profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: error?.message },
      { status: 500 }
    );
  }
}

