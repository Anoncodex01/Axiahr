import { executeSingleQuery } from './database';

// Create database tables for candidate system
export const setupCandidateTables = async () => {
  try {
    console.log('🚀 Setting up candidate database tables...');

    // Create candidates table
    await executeSingleQuery(`
      CREATE TABLE IF NOT EXISTS candidates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        surname VARCHAR(100) NOT NULL,
        last_name VARCHAR(100),
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        gender ENUM('male', 'female', 'other'),
        password_hash VARCHAR(255) NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        profile_completed BOOLEAN DEFAULT FALSE,
        status ENUM('active', 'pending', 'suspended') DEFAULT 'pending',
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Add gender column if it doesn't exist (for existing tables)
    try {
      await executeSingleQuery(`
        ALTER TABLE candidates 
        ADD COLUMN IF NOT EXISTS gender ENUM('male', 'female', 'other') AFTER phone
      `);
    } catch (error: any) {
      // Column might already exist, ignore error
      if (!error.message?.includes('Duplicate column name')) {
        console.warn('Warning adding gender column to candidates table:', error.message);
      }
    }
    
    // Add middle_name and surname columns if they don't exist (for existing tables)
    try {
      await executeSingleQuery(`
        ALTER TABLE candidates 
        ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100) AFTER first_name,
        ADD COLUMN IF NOT EXISTS surname VARCHAR(100) AFTER middle_name
      `);
    } catch (error: any) {
      if (!error.message?.includes('Duplicate column name')) {
        console.warn('Warning adding middle_name/surname columns:', error.message);
      }
    }

    // Add last_login column if it doesn't exist (for existing tables)
    try {
      await executeSingleQuery(`
        ALTER TABLE candidates 
        ADD COLUMN last_login TIMESTAMP NULL AFTER status
      `);
    } catch (error: any) {
      // Column might already exist, ignore duplicate column error
      if (error?.code !== 'ER_DUP_FIELDNAME' && !error.message?.includes('Duplicate column name')) {
        console.warn('Warning adding last_login column:', error.message);
      }
    }

    // Create email_verifications table for candidates
    await executeSingleQuery(`
      CREATE TABLE IF NOT EXISTS candidate_email_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        candidate_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
      )
    `);

    // Create candidate_profiles table
    await executeSingleQuery(`
      CREATE TABLE IF NOT EXISTS candidate_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        candidate_id INT NOT NULL,
        date_of_birth DATE,
        gender ENUM('male', 'female', 'other'),
        nationality VARCHAR(100),
        current_location VARCHAR(255),
        permanent_location VARCHAR(255),
        current_address TEXT,
        permanent_address TEXT,
        preferred_industries JSON,
        job_preferences JSON,
        skills JSON,
        languages JSON,
        education JSON,
        experience JSON,
        references JSON,
        cv_file VARCHAR(255),
        profile_picture VARCHAR(255),
        status ENUM('draft', 'completed', 'under_review', 'approved') DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
      )
    `);

    // Create candidate_experience table
    await executeSingleQuery(`
      CREATE TABLE IF NOT EXISTS candidate_experience (
        id INT AUTO_INCREMENT PRIMARY KEY,
        candidate_id INT NOT NULL,
        job_title VARCHAR(255) NOT NULL,
        designation VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        industry VARCHAR(100),
        level VARCHAR(50),
        start_date DATE NOT NULL,
        end_date DATE,
        is_current BOOLEAN DEFAULT FALSE,
        description TEXT,
        roles_responsibilities TEXT,
        achievements TEXT,
        experience_type ENUM('work', 'internship', 'volunteer') DEFAULT 'work',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
      )
    `);
    
    // Add missing columns if they don't exist (for existing tables)
    try {
      await executeSingleQuery(`
        ALTER TABLE candidate_experience 
        ADD COLUMN IF NOT EXISTS roles_responsibilities TEXT AFTER description
      `);
    } catch (error: any) {
      // Column might already exist, ignore error
      if (!error.message?.includes('Duplicate column name')) {
        console.warn('Warning adding roles_responsibilities column:', error.message);
      }
    }
    
    try {
      await executeSingleQuery(`
        ALTER TABLE candidate_experience 
        ADD COLUMN IF NOT EXISTS experience_type ENUM('work', 'internship', 'volunteer') DEFAULT 'work' AFTER is_current
      `);
    } catch (error: any) {
      if (!error.message?.includes('Duplicate column name')) {
        console.warn('Warning adding experience_type column:', error.message);
      }
    }
    
    // Make industry and level nullable if they are NOT NULL
    try {
      await executeSingleQuery(`
        ALTER TABLE candidate_experience 
        MODIFY COLUMN industry VARCHAR(100) NULL,
        MODIFY COLUMN level VARCHAR(50) NULL
      `);
    } catch (error: any) {
      console.warn('Warning modifying industry/level columns:', error.message);
    }

    // Create candidate_education table
    await executeSingleQuery(`
      CREATE TABLE IF NOT EXISTS candidate_education (
        id INT AUTO_INCREMENT PRIMARY KEY,
        candidate_id INT NOT NULL,
        institution VARCHAR(255) NOT NULL,
        qualification VARCHAR(255) NOT NULL,
        field_of_study VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        is_current BOOLEAN DEFAULT FALSE,
        grade VARCHAR(50),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
      )
    `);

    // Create candidate_references table
    await executeSingleQuery(`
      CREATE TABLE IF NOT EXISTS candidate_references (
        id INT AUTO_INCREMENT PRIMARY KEY,
        candidate_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        designation VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        relationship VARCHAR(100) NOT NULL,
        verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await executeSingleQuery(`
      CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email)
    `);

    await executeSingleQuery(`
      CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status)
    `);

    await executeSingleQuery(`
      CREATE INDEX IF NOT EXISTS idx_candidate_email_verifications_otp ON candidate_email_verifications(otp_code)
    `);

    await executeSingleQuery(`
      CREATE INDEX IF NOT EXISTS idx_candidate_email_verifications_expires ON candidate_email_verifications(expires_at)
    `);

    await executeSingleQuery(`
      CREATE INDEX IF NOT EXISTS idx_candidate_profiles_candidate ON candidate_profiles(candidate_id)
    `);

    await executeSingleQuery(`
      CREATE INDEX IF NOT EXISTS idx_candidate_experience_candidate ON candidate_experience(candidate_id)
    `);

    await executeSingleQuery(`
      CREATE INDEX IF NOT EXISTS idx_candidate_education_candidate ON candidate_education(candidate_id)
    `);

    await executeSingleQuery(`
      CREATE INDEX IF NOT EXISTS idx_candidate_references_candidate ON candidate_references(candidate_id)
    `);

    // Create candidate_job_preferences table
    await executeSingleQuery(`
      CREATE TABLE IF NOT EXISTS candidate_job_preferences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        candidate_id INT NOT NULL,
        job_type VARCHAR(50) NOT NULL,
        work_mode VARCHAR(50) NOT NULL,
        shift_timing VARCHAR(50) NOT NULL,
        relocation_preference VARCHAR(10) DEFAULT 'no',
        notice_period VARCHAR(100),
        preferred_industries JSON,
        preferred_roles JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
        UNIQUE KEY unique_candidate_preferences (candidate_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await executeSingleQuery(`
      CREATE INDEX IF NOT EXISTS idx_candidate_job_preferences_candidate ON candidate_job_preferences(candidate_id)
    `);

    console.log('✅ Candidate database tables created successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error setting up candidate tables:', error);
    throw error;
  }
};

// Clean up expired OTP codes
export const cleanupExpiredCandidateOTPs = async () => {
  try {
    await executeSingleQuery(`
      DELETE FROM candidate_email_verifications 
      WHERE expires_at < NOW() AND verified = FALSE
    `);
    console.log('🧹 Cleaned up expired candidate OTP codes');
  } catch (error) {
    console.error('❌ Error cleaning up expired candidate OTPs:', error);
  }
};
