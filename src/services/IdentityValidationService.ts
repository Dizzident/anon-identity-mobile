import {Identity} from '../types/Identity';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100, higher is better
}

export interface ValidationRule {
  name: string;
  validate: (identity: Identity) => {
    valid: boolean;
    error?: string;
    warning?: string;
    score: number;
  };
}

export class IdentityValidationService {
  private static instance: IdentityValidationService;
  private rules: ValidationRule[] = [];

  private constructor() {
    this.initializeDefaultRules();
  }

  static getInstance(): IdentityValidationService {
    if (!IdentityValidationService.instance) {
      IdentityValidationService.instance = new IdentityValidationService();
    }
    return IdentityValidationService.instance;
  }

  private initializeDefaultRules(): void {
    // Basic data validation rules
    this.rules = [
      {
        name: 'Required Name',
        validate: (identity: Identity) => {
          const hasName = !!(identity.name && identity.name.trim().length > 0);
          return {
            valid: hasName,
            error: hasName ? undefined : 'Identity must have a name',
            score: hasName ? 20 : 0,
          };
        },
      },
      {
        name: 'Valid Email Format',
        validate: (identity: Identity) => {
          if (!identity.email) {
            return {valid: true, score: 0}; // Email is optional
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const isValid = emailRegex.test(identity.email);

          return {
            valid: isValid,
            error: isValid ? undefined : 'Invalid email format',
            score: isValid ? 15 : -10,
          };
        },
      },
      {
        name: 'Valid Phone Format',
        validate: (identity: Identity) => {
          if (!identity.phone) {
            return {valid: true, score: 0}; // Phone is optional
          }

          // Basic phone validation (supports various formats)
          const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
          const isValid = phoneRegex.test(identity.phone);

          return {
            valid: isValid,
            error: isValid ? undefined : 'Invalid phone number format',
            score: isValid ? 10 : -5,
          };
        },
      },
      {
        name: 'QR Data Integrity',
        validate: (identity: Identity) => {
          const hasQRData = !!(identity.qrData && identity.qrData.trim().length > 0);

          if (!hasQRData) {
            return {
              valid: false,
              error: 'Missing QR code data',
              score: -20,
            };
          }

          // Try to validate QR data format
          try {
            JSON.parse(identity.qrData);
            return {valid: true, score: 15}; // Valid JSON
          } catch {
            // Not JSON, check if it's a valid simple format
            const hasValidFormat = identity.qrData.includes('@') ||
                                 identity.qrData.includes('identity:') ||
                                 identity.qrData.includes('user:');
            return {
              valid: true,
              warning: hasValidFormat ? undefined : 'QR data format may be invalid',
              score: hasValidFormat ? 10 : 5,
            };
          }
        },
      },
      {
        name: 'Verification Status',
        validate: (identity: Identity) => {
          const score = identity.isVerified ? 25 : 0;
          return {
            valid: true,
            warning: identity.isVerified ? undefined : 'Identity is not verified',
            score,
          };
        },
      },
      {
        name: 'Data Completeness',
        validate: (identity: Identity) => {
          let completeness = 0;
          const fields = [identity.name, identity.email, identity.phone];
          const filledFields = fields.filter(field => field && field.trim().length > 0).length;

          completeness = Math.round((filledFields / fields.length) * 100);

          return {
            valid: true,
            warning: completeness < 67 ? 'Identity data is incomplete' : undefined,
            score: Math.round(completeness * 0.15), // Max 15 points
          };
        },
      },
      {
        name: 'Credential Validation',
        validate: (identity: Identity) => {
          const hasCredentials = !!(
            identity.additionalData?.credentialId ||
            identity.additionalData?.credentials?.length > 0
          );

          if (!hasCredentials) {
            return {
              valid: true,
              warning: 'No verifiable credentials associated',
              score: 0,
            };
          }

          // Check credential metadata
          const hasValidCredentialData = !!(
            identity.additionalData?.issuer &&
            identity.additionalData?.issuanceDate
          );

          return {
            valid: true,
            score: hasValidCredentialData ? 20 : 10,
          };
        },
      },
      {
        name: 'Data Freshness',
        validate: (identity: Identity) => {
          const now = new Date();
          const daysSinceAdded = Math.floor(
            (now.getTime() - identity.dateAdded.getTime()) / (1000 * 60 * 60 * 24)
          );

          let score = 0;
          let warning: string | undefined;

          if (daysSinceAdded <= 7) {
            score = 10; // Fresh data
          } else if (daysSinceAdded <= 30) {
            score = 5; // Recent data
          } else if (daysSinceAdded <= 90) {
            score = 0; // Older data
            warning = 'Identity data is more than 30 days old';
          } else {
            score = -5; // Very old data
            warning = 'Identity data is more than 90 days old - consider refreshing';
          }

          return {
            valid: true,
            warning,
            score,
          };
        },
      },
    ];
  }

  validateIdentity(identity: Identity): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let totalScore = 0;

    for (const rule of this.rules) {
      try {
        const result = rule.validate(identity);

        if (!result.valid && result.error) {
          errors.push(result.error);
        }

        if (result.warning) {
          warnings.push(result.warning);
        }

        totalScore += result.score;
      } catch (error) {
        console.error(`Error running validation rule ${rule.name}:`, error);
        warnings.push(`Validation rule '${rule.name}' failed to execute`);
      }
    }

    // Normalize score to 0-100 range
    const normalizedScore = Math.max(0, Math.min(100, totalScore));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: normalizedScore,
    };
  }

  validateMultipleIdentities(identities: Identity[]): {
    results: Array<{identity: Identity; validation: ValidationResult}>;
    summary: {
      totalValidated: number;
      validCount: number;
      invalidCount: number;
      averageScore: number;
      commonIssues: string[];
    };
  } {
    const results = identities.map(identity => ({
      identity,
      validation: this.validateIdentity(identity),
    }));

    const validCount = results.filter(r => r.validation.isValid).length;
    const invalidCount = results.length - validCount;
    const averageScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.validation.score, 0) / results.length)
      : 0;

    // Find common issues
    const allIssues = results.flatMap(r => [...r.validation.errors, ...r.validation.warnings]);
    const issueCounts = allIssues.reduce((counts, issue) => {
      counts[issue] = (counts[issue] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const commonIssues = Object.entries(issueCounts)
      .filter(([_, count]) => count >= Math.max(2, Math.ceil(results.length * 0.3)))
      .map(([issue, _]) => issue)
      .slice(0, 5); // Top 5 common issues

    return {
      results,
      summary: {
        totalValidated: results.length,
        validCount,
        invalidCount,
        averageScore,
        commonIssues,
      },
    };
  }

  addCustomRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  removeRule(ruleName: string): boolean {
    const initialLength = this.rules.length;
    this.rules = this.rules.filter(rule => rule.name !== ruleName);
    return this.rules.length < initialLength;
  }

  getRules(): ValidationRule[] {
    return [...this.rules]; // Return copy to prevent external modification
  }

  getValidationSummary(identity: Identity): {
    level: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    primaryIssues: string[];
    recommendations: string[];
  } {
    const validation = this.validateIdentity(identity);

    let level: 'excellent' | 'good' | 'fair' | 'poor';
    if (validation.score >= 80) {level = 'excellent';}
    else if (validation.score >= 60) {level = 'good';}
    else if (validation.score >= 40) {level = 'fair';}
    else {level = 'poor';}

    const primaryIssues = [...validation.errors, ...validation.warnings.slice(0, 3)];

    const recommendations: string[] = [];

    if (!identity.isVerified) {
      recommendations.push('Scan a QR code with verifiable credentials to improve trust');
    }

    if (!identity.email) {
      recommendations.push('Add an email address for better identity verification');
    }

    if (!identity.phone) {
      recommendations.push('Add a phone number for additional contact information');
    }

    if (validation.errors.length > 0) {
      recommendations.push('Fix validation errors to improve identity reliability');
    }

    return {
      level,
      score: validation.score,
      primaryIssues,
      recommendations: recommendations.slice(0, 3), // Top 3 recommendations
    };
  }
}
