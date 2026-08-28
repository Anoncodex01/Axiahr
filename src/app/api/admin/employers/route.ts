import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET - Fetch all employers for admin management
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'all';
    const profileStatus = searchParams.get('profileStatus') || 'all';
    const id = searchParams.get('id');

    // If ID is provided, fetch single employer
    if (id) {
      const query = `
        SELECT 
          id,
          company_name,
          contact_person,
          first_name,
          last_name,
          job_title,
          email,
          industry,
          business_type,
          company_brief,
          company_logo,
          founded_year,
          employee_count,
          annual_revenue,
          company_stage,
          company_size,
          website,
          plot_no,
          street_name,
          landmark,
          postal_code,
          city,
          region,
          country,
          google_location_link,
          landline_phone,
          landline_country_code,
          mobile_phone,
          mobile_country_code,
          linkedin_url,
          instagram_url,
          facebook_url,
          other_social_media,
          tin,
          vrn,
          registration_number,
          tax_office,
          business_license,
          legal_entity_name,
          registered_address,
          company_profile_document,
          business_license_document,
          tax_certificate_document,
          registration_certificate_document,
          status,
          profile_status,
          email_verified,
          created_at,
          updated_at,
          last_login
        FROM employers
        WHERE id = ?
      `;
      
      const employers = await executeQuery<any>(query, [id]);
      
      if (employers.length === 0) {
        return NextResponse.json(
          { error: 'Employer not found' },
          { status: 404 }
        );
      }

      const employer = employers[0];
      const formattedEmployer = {
        id: employer.id.toString(),
        companyName: employer.company_name || '',
        contactPerson: employer.contact_person || '',
        firstName: employer.first_name || '',
        lastName: employer.last_name || '',
        jobTitle: employer.job_title || '',
        email: employer.email || '',
        industry: employer.industry || '',
        businessType: employer.business_type || '',
        companyBrief: employer.company_brief || '',
        companyLogo: employer.company_logo || '',
        foundedYear: employer.founded_year || '',
        employeeCount: employer.employee_count || '',
        annualRevenue: employer.annual_revenue || '',
        companyStage: employer.company_stage || '',
        companySize: employer.company_size || '',
        website: employer.website || '',
        plotNo: employer.plot_no || '',
        streetName: employer.street_name || '',
        landmark: employer.landmark || '',
        postalCode: employer.postal_code || '',
        city: employer.city || '',
        region: employer.region || '',
        country: employer.country || '',
        googleLocationLink: employer.google_location_link || '',
        landlinePhone: employer.landline_phone || '',
        landlineCountryCode: employer.landline_country_code || '',
        mobilePhone: employer.mobile_phone || '',
        mobileCountryCode: employer.mobile_country_code || '',
        linkedinUrl: employer.linkedin_url || '',
        instagramUrl: employer.instagram_url || '',
        facebookUrl: employer.facebook_url || '',
        otherSocialMedia: employer.other_social_media || '',
        tin: employer.tin || '',
        vrn: employer.vrn || '',
        registrationNumber: employer.registration_number || '',
        taxOffice: employer.tax_office || '',
        businessLicense: employer.business_license || '',
        legalEntityName: employer.legal_entity_name || '',
        registeredAddress: employer.registered_address || '',
        companyProfileDocument: employer.company_profile_document || '',
        businessLicenseDocument: employer.business_license_document || '',
        taxCertificateDocument: employer.tax_certificate_document || '',
        registrationCertificateDocument: employer.registration_certificate_document || '',
        status: employer.status || 'pending',
        profileStatus: employer.profile_status || 'incomplete',
        emailVerified: employer.email_verified || false,
        createdAt: employer.created_at ? new Date(employer.created_at).toISOString() : null,
        updatedAt: employer.updated_at ? new Date(employer.updated_at).toISOString() : null,
        lastLogin: employer.last_login ? new Date(employer.last_login).toISOString() : null
      };

      return NextResponse.json({
        success: true,
        employers: [formattedEmployer]
      });
    }

    let query = `
      SELECT 
        id,
        company_name,
        contact_person,
        first_name,
        last_name,
        job_title,
        email,
        industry,
        business_type,
        company_brief,
        company_logo,
        founded_year,
        employee_count,
        annual_revenue,
        company_stage,
        company_size,
        website,
        plot_no,
        street_name,
        landmark,
        postal_code,
        city,
        region,
        country,
        google_location_link,
        landline_phone,
        landline_country_code,
        mobile_phone,
        mobile_country_code,
        linkedin_url,
        instagram_url,
        facebook_url,
        other_social_media,
        tin,
        vrn,
        registration_number,
        tax_office,
        business_license,
        legal_entity_name,
        registered_address,
        company_profile_document,
        business_license_document,
        tax_certificate_document,
        registration_certificate_document,
        status,
        profile_status,
        email_verified,
        created_at,
        updated_at,
        last_login
      FROM employers
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (profileStatus !== 'all') {
      query += ' AND profile_status = ?';
      params.push(profileStatus);
    }

    if (search) {
      query += ' AND (company_name LIKE ? OR email LIKE ? OR contact_person LIKE ? OR industry LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC';

    const employers = await executeQuery<any>(query, params);

    const formattedEmployers = employers.map((employer: any) => ({
      id: employer.id.toString(),
      companyName: employer.company_name || '',
      contactPerson: employer.contact_person || '',
      firstName: employer.first_name || '',
      lastName: employer.last_name || '',
      jobTitle: employer.job_title || '',
      email: employer.email || '',
      industry: employer.industry || '',
      businessType: employer.business_type || '',
      companyBrief: employer.company_brief || '',
      companyLogo: employer.company_logo || '',
      foundedYear: employer.founded_year || '',
      employeeCount: employer.employee_count || '',
      annualRevenue: employer.annual_revenue || '',
      companyStage: employer.company_stage || '',
      companySize: employer.company_size || '',
      website: employer.website || '',
      // Address
      plotNo: employer.plot_no || '',
      streetName: employer.street_name || '',
      landmark: employer.landmark || '',
      postalCode: employer.postal_code || '',
      city: employer.city || '',
      region: employer.region || '',
      country: employer.country || '',
      googleLocationLink: employer.google_location_link || '',
      // Contact
      landlinePhone: employer.landline_phone || '',
      landlineCountryCode: employer.landline_country_code || '',
      mobilePhone: employer.mobile_phone || '',
      mobileCountryCode: employer.mobile_country_code || '',
      // Online Presence
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
      // Documents
      companyProfileDocument: employer.company_profile_document || '',
      businessLicenseDocument: employer.business_license_document || '',
      taxCertificateDocument: employer.tax_certificate_document || '',
      registrationCertificateDocument: employer.registration_certificate_document || '',
      // Status
      status: employer.status || 'pending',
      profileStatus: employer.profile_status || 'incomplete',
      emailVerified: employer.email_verified || false,
      createdAt: employer.created_at ? new Date(employer.created_at).toISOString() : null,
      updatedAt: employer.updated_at ? new Date(employer.updated_at).toISOString() : null,
      lastLogin: employer.last_login ? new Date(employer.last_login).toISOString() : null
    }));

    return NextResponse.json({
      success: true,
      employers: formattedEmployers,
      total: formattedEmployers.length
    });

  } catch (error: any) {
    console.error('Get employers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employers', details: error?.message },
      { status: 500 }
    );
  }
}
