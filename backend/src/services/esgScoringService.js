/**
 * ESG Scoring Service
 * Provides Environmental, Social, and Governance scoring for energy trading
 */

class ESGScoringService {
  constructor() {
    this.weightings = {
      environmental: 0.5,
      social: 0.25,
      governance: 0.25,
    };

    this.environmentalFactors = {
      carbon_intensity: 0.3,
      renewable_energy_ratio: 0.25,
      waste_management: 0.15,
      water_usage: 0.15,
      biodiversity_impact: 0.15,
    };

    this.socialFactors = {
      community_impact: 0.3,
      worker_safety: 0.25,
      local_employment: 0.2,
      human_rights: 0.25,
    };

    this.governanceFactors = {
      transparency: 0.3,
      regulatory_compliance: 0.3,
      stakeholder_engagement: 0.2,
      risk_management: 0.2,
    };
  }

  /**
   * Calculate comprehensive ESG score for an energy asset or company
   * @param {Object} entity - Entity to score (company, project, or asset)
   * @returns {Object} ESG scoring result
   */
  async calculateESGScore(entity) {
    try {
      const environmentalScore = this.calculateEnvironmentalScore(entity);
      const socialScore = this.calculateSocialScore(entity);
      const governanceScore = this.calculateGovernanceScore(entity);

      const overallScore =
        environmentalScore.score * this.weightings.environmental +
        socialScore.score * this.weightings.social +
        governanceScore.score * this.weightings.governance;

      const rating = this.getESGRating(overallScore);

      return {
        success: true,
        entity_id: entity.id,
        entity_name: entity.name,
        overall_score: Math.round(overallScore * 10) / 10,
        rating: rating,
        scores: {
          environmental: environmentalScore,
          social: socialScore,
          governance: governanceScore,
        },
        recommendations: this.generateESGRecommendations(
          environmentalScore,
          socialScore,
          governanceScore
        ),
        benchmark_comparison: await this.getBenchmarkComparison(entity, overallScore),
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Calculate Environmental score
   */
  calculateEnvironmentalScore(entity) {
    const factors = {};
    let totalScore = 0;

    // Carbon intensity (lower is better)
    const carbonIntensity = entity.carbon_intensity || 0; // kg CO2 per unit
    factors.carbon_intensity = {
      value: carbonIntensity,
      score: Math.max(0, 100 - carbonIntensity / 10), // Normalized scale
      weight: this.environmentalFactors.carbon_intensity,
    };

    // Renewable energy ratio (higher is better)
    const renewableRatio = entity.renewable_energy_ratio || 0; // 0-1
    factors.renewable_energy_ratio = {
      value: renewableRatio,
      score: renewableRatio * 100,
      weight: this.environmentalFactors.renewable_energy_ratio,
    };

    // Waste management practices
    const wasteScore = this.assessWasteManagement(entity.waste_management || {});
    factors.waste_management = {
      score: wasteScore,
      weight: this.environmentalFactors.waste_management,
    };

    // Water usage efficiency
    const waterScore = this.assessWaterUsage(entity.water_usage || {});
    factors.water_usage = {
      score: waterScore,
      weight: this.environmentalFactors.water_usage,
    };

    // Biodiversity impact
    const biodiversityScore = this.assessBiodiversityImpact(entity.biodiversity || {});
    factors.biodiversity_impact = {
      score: biodiversityScore,
      weight: this.environmentalFactors.biodiversity_impact,
    };

    // Calculate weighted score
    Object.values(factors).forEach(factor => {
      totalScore += factor.score * factor.weight;
    });

    return {
      score: totalScore,
      factors: factors,
      category: 'Environmental',
    };
  }

  /**
   * Calculate Social score
   */
  calculateSocialScore(entity) {
    const factors = {};
    let totalScore = 0;

    // Community impact
    const communityScore = this.assessCommunityImpact(entity.community_programs || {});
    factors.community_impact = {
      score: communityScore,
      weight: this.socialFactors.community_impact,
    };

    // Worker safety
    const safetyScore = this.assessWorkerSafety(entity.safety_record || {});
    factors.worker_safety = {
      score: safetyScore,
      weight: this.socialFactors.worker_safety,
    };

    // Local employment
    const employmentScore = this.assessLocalEmployment(entity.employment || {});
    factors.local_employment = {
      score: employmentScore,
      weight: this.socialFactors.local_employment,
    };

    // Human rights
    const humanRightsScore = this.assessHumanRights(entity.human_rights || {});
    factors.human_rights = {
      score: humanRightsScore,
      weight: this.socialFactors.human_rights,
    };

    // Calculate weighted score
    Object.values(factors).forEach(factor => {
      totalScore += factor.score * factor.weight;
    });

    return {
      score: totalScore,
      factors: factors,
      category: 'Social',
    };
  }

  /**
   * Calculate Governance score
   */
  calculateGovernanceScore(entity) {
    const factors = {};
    let totalScore = 0;

    // Transparency
    const transparencyScore = this.assessTransparency(entity.transparency || {});
    factors.transparency = {
      score: transparencyScore,
      weight: this.governanceFactors.transparency,
    };

    // Regulatory compliance
    const complianceScore = this.assessRegulatoryCompliance(entity.compliance || {});
    factors.regulatory_compliance = {
      score: complianceScore,
      weight: this.governanceFactors.regulatory_compliance,
    };

    // Stakeholder engagement
    const stakeholderScore = this.assessStakeholderEngagement(entity.stakeholder_engagement || {});
    factors.stakeholder_engagement = {
      score: stakeholderScore,
      weight: this.governanceFactors.stakeholder_engagement,
    };

    // Risk management
    const riskScore = this.assessRiskManagement(entity.risk_management || {});
    factors.risk_management = {
      score: riskScore,
      weight: this.governanceFactors.risk_management,
    };

    // Calculate weighted score
    Object.values(factors).forEach(factor => {
      totalScore += factor.score * factor.weight;
    });

    return {
      score: totalScore,
      factors: factors,
      category: 'Governance',
    };
  }

  /**
   * Assessment helper methods
   */
  assessWasteManagement(wasteData) {
    let score = 50; // Base score

    if (wasteData.recycling_rate > 0.8) score += 30;
    else if (wasteData.recycling_rate > 0.5) score += 20;
    else if (wasteData.recycling_rate > 0.3) score += 10;

    if (wasteData.zero_waste_to_landfill) score += 20;
    if (wasteData.waste_reduction_programs) score += 15;

    return Math.min(100, score);
  }

  assessWaterUsage(waterData) {
    let score = 50; // Base score

    if (waterData.water_recycling_rate > 0.7) score += 25;
    else if (waterData.water_recycling_rate > 0.4) score += 15;

    if (waterData.water_conservation_programs) score += 15;
    if (waterData.water_efficiency_improvements) score += 10;

    return Math.min(100, score);
  }

  assessBiodiversityImpact(biodiversityData) {
    let score = 50; // Base score

    if (biodiversityData.protected_areas_percentage > 0.2) score += 25;
    if (biodiversityData.restoration_projects) score += 20;
    if (biodiversityData.biodiversity_monitoring) score += 15;
    if (biodiversityData.indigenous_consultation) score += 10;

    return Math.min(100, score);
  }

  assessCommunityImpact(communityData) {
    let score = 50; // Base score

    if (communityData.local_investment_percentage > 0.05) score += 20;
    if (communityData.community_development_programs) score += 15;
    if (communityData.local_procurement_percentage > 0.3) score += 15;

    return Math.min(100, score);
  }

  assessWorkerSafety(safetyData) {
    let score = 50; // Base score

    const injuryRate = safetyData.injury_rate || 0;
    if (injuryRate < 0.5) score += 30;
    else if (injuryRate < 1.0) score += 20;
    else if (injuryRate < 2.0) score += 10;

    if (safetyData.safety_training_hours > 40) score += 20;

    return Math.min(100, score);
  }

  assessLocalEmployment(employmentData) {
    let score = 50; // Base score

    const localEmploymentRate = employmentData.local_employment_rate || 0;
    if (localEmploymentRate > 0.8) score += 30;
    else if (localEmploymentRate > 0.6) score += 20;
    else if (localEmploymentRate > 0.4) score += 10;

    if (employmentData.skills_development_programs) score += 20;

    return Math.min(100, score);
  }

  assessHumanRights(humanRightsData) {
    let score = 50; // Base score

    if (humanRightsData.human_rights_policy) score += 20;
    if (humanRightsData.grievance_mechanism) score += 15;
    if (humanRightsData.human_rights_training) score += 15;

    return Math.min(100, score);
  }

  assessTransparency(transparencyData) {
    let score = 50; // Base score

    if (transparencyData.annual_sustainability_report) score += 20;
    if (transparencyData.third_party_verification) score += 15;
    if (transparencyData.stakeholder_reporting) score += 15;

    return Math.min(100, score);
  }

  assessRegulatoryCompliance(complianceData) {
    let score = 50; // Base score

    if (complianceData.compliance_violations === 0) score += 30;
    else if (complianceData.compliance_violations < 3) score += 15;

    if (complianceData.compliance_management_system) score += 20;

    return Math.min(100, score);
  }

  assessStakeholderEngagement(stakeholderData) {
    let score = 50; // Base score

    if (stakeholderData.regular_stakeholder_meetings) score += 20;
    if (stakeholderData.stakeholder_feedback_system) score += 15;
    if (stakeholderData.community_consultation_processes) score += 15;

    return Math.min(100, score);
  }

  assessRiskManagement(riskData) {
    let score = 50; // Base score

    if (riskData.risk_management_framework) score += 25;
    if (riskData.climate_risk_assessment) score += 15;
    if (riskData.operational_risk_controls) score += 10;

    return Math.min(100, score);
  }

  /**
   * Convert numeric score to letter rating
   */
  getESGRating(score) {
    if (score >= 90) return 'AAA';
    if (score >= 80) return 'AA';
    if (score >= 70) return 'A';
    if (score >= 60) return 'BBB';
    if (score >= 50) return 'BB';
    if (score >= 40) return 'B';
    return 'CCC';
  }

  /**
   * Generate improvement recommendations
   */
  generateESGRecommendations(envScore, socialScore, govScore) {
    const recommendations = [];

    // Environmental recommendations
    if (envScore.score < 70) {
      recommendations.push({
        category: 'Environmental',
        priority: 'High',
        action: 'Implement renewable energy sources to reduce carbon intensity',
        impact: 'Significant improvement in environmental score',
      });
    }

    // Social recommendations
    if (socialScore.score < 70) {
      recommendations.push({
        category: 'Social',
        priority: 'Medium',
        action: 'Enhance community engagement and local employment programs',
        impact: 'Improved social license to operate',
      });
    }

    // Governance recommendations
    if (govScore.score < 70) {
      recommendations.push({
        category: 'Governance',
        priority: 'High',
        action: 'Strengthen transparency and regulatory compliance frameworks',
        impact: 'Enhanced stakeholder trust and risk mitigation',
      });
    }

    return recommendations;
  }

  /**
   * Get benchmark comparison
   */
  async getBenchmarkComparison(entity, score) {
    // Mock benchmark data - in real implementation, this would query a database
    const industryBenchmarks = {
      oil_gas: 45,
      renewable_energy: 75,
      nuclear: 60,
      coal: 25,
      hydroelectric: 80,
    };

    const industryBenchmark = industryBenchmarks[entity.sector] || 50;
    const percentile = this.calculatePercentile(score, industryBenchmark);

    return {
      industry_average: industryBenchmark,
      entity_score: score,
      percentile: percentile,
      ranking: this.getPercentileRanking(percentile),
    };
  }

  calculatePercentile(score, benchmark) {
    return Math.round((score / benchmark) * 50 + 25); // Simplified percentile calculation
  }

  getPercentileRanking(percentile) {
    if (percentile >= 90) return 'Top 10%';
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 50) return 'Above Average';
    if (percentile >= 25) return 'Below Average';
    return 'Bottom 25%';
  }

  /**
   * Track ESG performance over time
   */
  async trackESGTrends(entityId, timeRange = '1Y') {
    // This would query historical ESG scores from database
    return {
      success: true,
      entity_id: entityId,
      time_range: timeRange,
      trend_data: {
        environmental: [65, 67, 70, 72, 75], // Sample monthly scores
        social: [60, 62, 65, 67, 68],
        governance: [70, 72, 74, 76, 78],
        overall: [65, 67, 70, 72, 74],
      },
      trend_analysis: {
        direction: 'improving',
        rate_of_change: '+2.3 points per quarter',
        key_drivers: ['Renewable energy adoption', 'Enhanced governance practices'],
      },
    };
  }
}

module.exports = ESGScoringService;
