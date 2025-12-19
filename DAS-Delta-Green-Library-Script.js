/**
 * Delta Green Auto Stats (DAS) Library Script
 * A comprehensive character management system adapted from the True Auto Stats system
 * for use with the Delta Green RPG ruleset
 * 
 * Features:
 * - Agent attribute generation and management
 * - Sanity tracking with breakdown mechanics
 * - Bond management for operational teams
 * - Cover identity profiles with field expertise
 * - Operational resource allocation
 * - Automatic modifier calculations
 * 
 * Version: 1.0.0
 * Last Updated: 2025-12-19
 */

// =============================================================================
// DAS_Agent: Core Agent Character Class
// =============================================================================

class DAS_Agent {
  constructor(name = "New Agent", agencyAffiliation = "Delta Green") {
    this.name = name;
    this.agencyAffiliation = agencyAffiliation;
    this.createdDate = new Date().toISOString();
    
    // Core Attributes (1-100 scale)
    this.attributes = {
      strength: 50,
      dexterity: 50,
      constitution: 50,
      intelligence: 50,
      wisdom: 50,
      charisma: 50
    };
    
    // Attribute modifiers
    this.attributeModifiers = {
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0
    };
    
    // Skills (0-100 scale)
    this.skills = this.initializeSkills();
    
    // Sanity System
    this.sanity = {
      current: 70,
      maximum: 100,
      breakdown: false,
      breakdownDuration: 0,
      temporaryLoss: 0,
      permanentLoss: 0,
      phobias: [],
      manias: [],
      disorders: []
    };
    
    // Health System
    this.health = {
      current: 100,
      maximum: 100,
      woundLevel: 0,
      injuries: []
    };
    
    // Bonds (Team Connections)
    this.bonds = [];
    
    // Cover Identity
    this.coverIdentity = {
      active: false,
      name: "",
      background: "",
      profession: "",
      safeHouses: [],
      legends: {}, // Detailed cover stories
      fieldExpertise: [] // Cover-specific skills
    };
    
    // Operational Resources
    this.operationalResources = {
      funding: 0,
      safeHouses: 0,
      vehicles: 0,
      weapons: 0,
      surveillance: 0,
      contacts: 0,
      documentation: 0
    };
    
    // Mission History
    this.missions = [];
    
    // Equipment and Gear
    this.inventory = [];
    
    // Psychology Profile
    this.psychology = {
      traumas: [],
      motivations: [],
      fears: [],
      secrets: []
    };
  }

  /**
   * Initialize all available Delta Green skills
   */
  initializeSkills() {
    return {
      // Combat Skills
      firearms: 30,
      melee: 30,
      closecombat: 30,
      
      // Investigation Skills
      investigation: 40,
      occult: 20,
      forensics: 30,
      
      // Social Skills
      persuasion: 40,
      intimidation: 35,
      deception: 35,
      charm: 40,
      
      // Technical Skills
      electronics: 30,
      mechanical: 30,
      computers: 40,
      surveillance: 35,
      
      // Survival Skills
      survival: 30,
      medicine: 30,
      firstaid: 40,
      psychology: 40,
      
      // Vehicle Skills
      driving: 40,
      piloting: 20,
      navigation: 40,
      
      // Academic Skills
      archaeology: 20,
      anthropology: 20,
      biology: 20,
      chemistry: 20,
      physics: 20,
      history: 20,
      language: 20,
      
      // Occult/Esoteric
      lore: 20,
      rituals: 20,
      thaumaturgy: 10,
      
      // Other
      administration: 30,
      athletics: 30,
      stealth: 35,
      lockpicking: 25,
      tradecraft: 40
    };
  }

  /**
   * Calculate attribute modifier based on attribute value
   */
  getAttributeModifier(attributeName) {
    const baseValue = this.attributes[attributeName] || 0;
    const modifier = Math.floor((baseValue - 50) / 10);
    return modifier + (this.attributeModifiers[attributeName] || 0);
  }

  /**
   * Get all attribute modifiers
   */
  getAllModifiers() {
    const modifiers = {};
    for (const attr in this.attributes) {
      modifiers[attr] = this.getAttributeModifier(attr);
    }
    return modifiers;
  }

  /**
   * Apply sanity damage
   */
  takeSanityDamage(amount, type = "temporary") {
    if (type === "temporary") {
      this.sanity.temporaryLoss += amount;
    } else if (type === "permanent") {
      this.sanity.permanentLoss += amount;
    }
    this.sanity.current = Math.max(0, this.sanity.current - amount);
    
    // Check for breakdown
    if (this.sanity.current === 0) {
      this.triggerBreakdown();
    }
    
    return this.sanity.current;
  }

  /**
   * Recover sanity through downtime or therapy
   */
  recoverSanity(amount, type = "temporary") {
    if (type === "temporary" && this.sanity.temporaryLoss > 0) {
      const recovered = Math.min(amount, this.sanity.temporaryLoss);
      this.sanity.temporaryLoss -= recovered;
      this.sanity.current += recovered;
    }
    this.sanity.current = Math.min(this.sanity.maximum, this.sanity.current);
    return this.sanity.current;
  }

  /**
   * Trigger psychological breakdown
   */
  triggerBreakdown() {
    this.sanity.breakdown = true;
    this.sanity.breakdownDuration = this.rollD10();
    return {
      breakdown: true,
      duration: this.sanity.breakdownDuration,
      message: `Agent ${this.name} has suffered a breakdown lasting ${this.sanity.breakdownDuration} hours.`
    };
  }

  /**
   * Recover from breakdown
   */
  recoverFromBreakdown() {
    this.sanity.breakdown = false;
    this.sanity.breakdownDuration = 0;
    this.sanity.current = Math.max(1, this.sanity.current);
  }

  /**
   * Add a phobia
   */
  addPhobia(trigger, intensity = "moderate") {
    this.sanity.phobias.push({
      trigger: trigger,
      intensity: intensity,
      dateAcquired: new Date().toISOString()
    });
  }

  /**
   * Add a mania
   */
  addMania(description, intensity = "moderate") {
    this.sanity.manias.push({
      description: description,
      intensity: intensity,
      dateAcquired: new Date().toISOString()
    });
  }

  /**
   * Add a psychological disorder
   */
  addDisorder(name, symptoms) {
    this.sanity.disorders.push({
      name: name,
      symptoms: symptoms,
      dateAcquired: new Date().toISOString()
    });
  }

  /**
   * Create or update bond with another agent
   */
  addOrUpdateBond(agentName, relationship, strength = 5) {
    const existingBond = this.bonds.find(b => b.agentName === agentName);
    
    if (existingBond) {
      existingBond.relationship = relationship;
      existingBond.strength = Math.min(10, strength);
      existingBond.lastUpdated = new Date().toISOString();
    } else {
      this.bonds.push({
        agentName: agentName,
        relationship: relationship,
        strength: Math.min(10, strength),
        secrets: [],
        trustLevel: strength > 7 ? "high" : strength > 3 ? "moderate" : "low",
        dateFormed: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
  }

  /**
   * Create or activate cover identity
   */
  createCoverIdentity(name, background, profession) {
    this.coverIdentity = {
      active: true,
      name: name,
      background: background,
      profession: profession,
      safeHouses: [],
      legends: {},
      fieldExpertise: [],
      createdDate: new Date().toISOString()
    };
  }

  /**
   * Add field expertise to cover identity
   */
  addFieldExpertise(skillName, proficiencyLevel = "basic") {
    if (this.coverIdentity.active) {
      this.coverIdentity.fieldExpertise.push({
        skill: skillName,
        level: proficiencyLevel, // basic, intermediate, advanced, expert
        coverStory: ""
      });
    }
  }

  /**
   * Add or update a legend (detailed cover story)
   */
  addLegend(legendName, details) {
    if (this.coverIdentity.active) {
      this.coverIdentity.legends[legendName] = {
        details: details,
        created: new Date().toISOString(),
        tested: false,
        testCount: 0
      };
    }
  }

  /**
   * Add a safe house to cover identity
   */
  addSafeHouse(location, security = 3) {
    if (this.coverIdentity.active) {
      this.coverIdentity.safeHouses.push({
        location: location,
        security: security, // 1-10 scale
        lastChecked: new Date().toISOString(),
        status: "secure"
      });
    }
  }

  /**
   * Deactivate cover identity
   */
  deactivateCoverIdentity() {
    this.coverIdentity.active = false;
  }

  /**
   * Allocate operational resource
   */
  allocateResource(resourceType, amount) {
    if (resourceType in this.operationalResources) {
      this.operationalResources[resourceType] += amount;
      return this.operationalResources[resourceType];
    }
    throw new Error(`Unknown resource type: ${resourceType}`);
  }

  /**
   * Use operational resource
   */
  useResource(resourceType, amount) {
    if (resourceType in this.operationalResources) {
      const available = this.operationalResources[resourceType];
      if (available >= amount) {
        this.operationalResources[resourceType] -= amount;
        return true;
      }
      return false;
    }
    throw new Error(`Unknown resource type: ${resourceType}`);
  }

  /**
   * Add item to inventory
   */
  addToInventory(itemName, quantity = 1, description = "") {
    const existingItem = this.inventory.find(i => i.name === itemName);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.inventory.push({
        name: itemName,
        quantity: quantity,
        description: description,
        added: new Date().toISOString()
      });
    }
  }

  /**
   * Remove item from inventory
   */
  removeFromInventory(itemName, quantity = 1) {
    const item = this.inventory.find(i => i.name === itemName);
    
    if (item) {
      item.quantity = Math.max(0, item.quantity - quantity);
      if (item.quantity === 0) {
        this.inventory = this.inventory.filter(i => i.name !== itemName);
      }
      return true;
    }
    return false;
  }

  /**
   * Log a mission
   */
  logMission(missionName, briefing, outcome = "unknown", daysElapsed = 1) {
    this.missions.push({
      name: missionName,
      briefing: briefing,
      outcome: outcome, // success, partial, failure, compromised, classified
      date: new Date().toISOString(),
      daysElapsed: daysElapsed,
      sanityLost: 0,
      woundsReceived: []
    });
  }

  /**
   * Update last mission with results
   */
  updateLastMission(outcome, sanityLost = 0, wounds = []) {
    if (this.missions.length > 0) {
      const lastMission = this.missions[this.missions.length - 1];
      lastMission.outcome = outcome;
      lastMission.sanityLost = sanityLost;
      lastMission.woundsReceived = wounds;
    }
  }

  /**
   * Take physical damage
   */
  takeDamage(amount) {
    this.health.current = Math.max(0, this.health.current - amount);
    
    // Increase wound level
    this.health.woundLevel = Math.ceil((this.health.maximum - this.health.current) / 20);
    
    if (this.health.current === 0) {
      return { status: "dead", message: `${this.name} has been killed.` };
    } else if (this.health.current < 25) {
      return { status: "critical", message: `${this.name} is critically wounded.` };
    } else if (this.health.current < 50) {
      return { status: "wounded", message: `${this.name} is wounded.` };
    }
    return { status: "damaged", health: this.health.current };
  }

  /**
   * Heal damage
   */
  heal(amount) {
    this.health.current = Math.min(this.health.maximum, this.health.current + amount);
    this.health.woundLevel = Math.ceil((this.health.maximum - this.health.current) / 20);
    return this.health.current;
  }

  /**
   * Add trauma to psychology profile
   */
  addTrauma(description, severity = "moderate") {
    this.psychology.traumas.push({
      description: description,
      severity: severity, // minor, moderate, severe
      date: new Date().toISOString()
    });
  }

  /**
   * Get agent summary report
   */
  getSummary() {
    return {
      name: this.name,
      affiliation: this.agencyAffiliation,
      attributes: this.attributes,
      modifiers: this.getAllModifiers(),
      sanityStatus: {
        current: this.sanity.current,
        maximum: this.sanity.maximum,
        inBreakdown: this.sanity.breakdown,
        phobias: this.sanity.phobias.length,
        manias: this.sanity.manias.length,
        disorders: this.sanity.disorders.length
      },
      healthStatus: {
        current: this.health.current,
        maximum: this.health.maximum,
        woundLevel: this.health.woundLevel
      },
      coverActive: this.coverIdentity.active,
      bonds: this.bonds.length,
      missionsCompleted: this.missions.length,
      inventory: this.inventory.length,
      resourcesAvailable: this.operationalResources
    };
  }

  /**
   * Generate full character sheet
   */
  getFullCharacterSheet() {
    return {
      agent: this,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Roll a d10 (1-10)
   */
  rollD10() {
    return Math.floor(Math.random() * 10) + 1;
  }

  /**
   * Roll a d100 (1-100)
   */
  rollD100() {
    return Math.floor(Math.random() * 100) + 1;
  }

  /**
   * Perform a skill check
   */
  skillCheck(skillName, difficulty = 50) {
    const skillValue = this.skills[skillName] || 0;
    const roll = this.rollD100();
    const success = roll <= skillValue;
    const difficulty_met = skillValue >= difficulty;

    return {
      skill: skillName,
      skillValue: skillValue,
      roll: roll,
      difficulty: difficulty,
      success: success,
      criticalSuccess: roll === 1,
      criticalFailure: roll === 100,
      difficultyMet: difficulty_met,
      margin: success ? skillValue - roll : roll - skillValue
    };
  }

  /**
   * Perform an attribute check
   */
  attributeCheck(attributeName, difficulty = 50) {
    const attributeValue = this.attributes[attributeName] || 50;
    const roll = this.rollD100();
    const success = roll <= attributeValue;

    return {
      attribute: attributeName,
      attributeValue: attributeValue,
      roll: roll,
      difficulty: difficulty,
      success: success,
      criticalSuccess: roll === 1,
      criticalFailure: roll === 100,
      margin: success ? attributeValue - roll : roll - attributeValue
    };
  }
}

// =============================================================================
// DAS_Team: Team/Squad Management Class
// =============================================================================

class DAS_Team {
  constructor(teamName, missionBrief = "") {
    this.teamName = teamName;
    this.missionBrief = missionBrief;
    this.members = [];
    this.createdDate = new Date().toISOString();
    this.teamResources = {
      budget: 0,
      safeHouses: 0,
      vehicles: [],
      weapons: [],
      contacts: 0
    };
    this.teamBonds = [];
    this.missionLog = [];
  }

  /**
   * Add agent to team
   */
  addMember(agent) {
    if (!this.members.find(m => m.name === agent.name)) {
      this.members.push(agent);
      return true;
    }
    return false;
  }

  /**
   * Remove agent from team
   */
  removeMember(agentName) {
    this.members = this.members.filter(m => m.name !== agentName);
  }

  /**
   * Get team member by name
   */
  getMember(agentName) {
    return this.members.find(m => m.name === agentName);
  }

  /**
   * Record team bond (inter-agent relationship)
   */
  recordTeamBond(agent1Name, agent2Name, bondType, strength = 5) {
    this.teamBonds.push({
      agent1: agent1Name,
      agent2: agent2Name,
      type: bondType, // partnership, rivalry, subordinate, mentor, romantic, conflicted
      strength: strength,
      recorded: new Date().toISOString()
    });
  }

  /**
   * Get team status report
   */
  getTeamStatus() {
    const health = this.members.reduce((total, m) => total + m.health.current, 0) / this.members.length;
    const sanity = this.members.reduce((total, m) => total + m.sanity.current, 0) / this.members.length;

    return {
      teamName: this.teamName,
      memberCount: this.members.length,
      averageHealth: Math.round(health),
      averageSanity: Math.round(sanity),
      teamBonds: this.teamBonds.length,
      resourcesAvailable: this.teamResources,
      memberStatus: this.members.map(m => ({
        name: m.name,
        health: m.health.current,
        sanity: m.sanity.current,
        inBreakdown: m.sanity.breakdown
      }))
    };
  }

  /**
   * Log team mission
   */
  logTeamMission(missionName, briefing, outcome = "unknown") {
    this.missionLog.push({
      name: missionName,
      briefing: briefing,
      outcome: outcome,
      date: new Date().toISOString(),
      participants: this.members.map(m => m.name)
    });
  }

  /**
   * Allocate team resources
   */
  allocateTeamResource(resourceType, amount) {
    if (resourceType in this.teamResources && resourceType !== "vehicles" && resourceType !== "weapons") {
      this.teamResources[resourceType] += amount;
      return this.teamResources[resourceType];
    }
    throw new Error(`Cannot allocate ${resourceType}`);
  }

  /**
   * Add vehicle to team resources
   */
  addVehicle(vehicleName, capacity = 4) {
    this.teamResources.vehicles.push({
      name: vehicleName,
      capacity: capacity,
      condition: "good",
      added: new Date().toISOString()
    });
  }

  /**
   * Add weapon to team arsenal
   */
  addWeapon(weaponName, quantity = 1) {
    const existing = this.teamResources.weapons.find(w => w.name === weaponName);
    
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.teamResources.weapons.push({
        name: weaponName,
        quantity: quantity,
        added: new Date().toISOString()
      });
    }
  }
}

// =============================================================================
// DAS_SanitySystem: Specialized Sanity Management
// =============================================================================

class DAS_SanitySystem {
  constructor() {
    this.sanityThresholds = {
      stable: { min: 70, max: 100, status: "stable" },
      stressed: { min: 40, max: 69, status: "stressed" },
      unstable: { min: 10, max: 39, status: "unstable" },
      critical: { min: 0, max: 9, status: "critical" }
    };
    
    this.commonPhobias = [
      "Darkness", "Blood", "Death", "The Unnatural", "Incompleteness",
      "Isolation", "Helplessness", "Mutilation", "Contamination", "Strangers"
    ];
    
    this.commonManias = [
      "Paranoia", "Obsession", "Gambling", "Substance Abuse", "Compulsion",
      "Recklessness", "Dominance", "Religiosity", "Honesty", "Secretiveness"
    ];
  }

  /**
   * Get sanity status based on current value
   */
  getSanityStatus(currentSanity) {
    for (const [key, threshold] of Object.entries(this.sanityThresholds)) {
      if (currentSanity >= threshold.min && currentSanity <= threshold.max) {
        return threshold.status;
      }
    }
    return "unknown";
  }

  /**
   * Recommend sanity recovery method
   */
  getRecoveryRecommendation(agent) {
    const status = this.getSanityStatus(agent.sanity.current);
    
    const recommendations = {
      stable: "Agent is stable. Standard maintenance protocols sufficient.",
      stressed: "Agent needs downtime. Recommend 1-2 weeks rest and counseling.",
      unstable: "Agent requires immediate intervention. Psychiatric evaluation recommended.",
      critical: "Agent must be removed from duty. Intensive therapy required."
    };
    
    return recommendations[status] || "Status unknown";
  }

  /**
   * Generate sanity loss scenario
   */
  generateSanityLossScenario() {
    const scenarios = [
      { trigger: "Witnessing unnatural phenomenon", loss: 5 },
      { trigger: "Viewing grotesque remains", loss: 3 },
      { trigger: "Reading forbidden tome", loss: 4 },
      { trigger: "Losing a team member", loss: 6 },
      { trigger: "Discovering truth about organization", loss: 8 },
      { trigger: "Encountering an entity", loss: 10 }
    ];
    
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }
}

// =============================================================================
// DAS_ResourceManager: Operational Resource Management
// =============================================================================

class DAS_ResourceManager {
  constructor() {
    this.resourceCategories = {
      financial: { name: "Financial Resources", unit: "dollars", max: 1000000 },
      personnel: { name: "Personnel Contacts", unit: "contacts", max: 100 },
      safehouse: { name: "Safe Houses", unit: "locations", max: 50 },
      transport: { name: "Vehicle Assets", unit: "vehicles", max: 100 },
      weapons: { name: "Weapon Stockpiles", unit: "units", max: 500 },
      intelligence: { name: "Intelligence Assets", unit: "assets", max: 100 },
      documentation: { name: "False Documentation", unit: "sets", max: 50 },
      surveillance: { name: "Surveillance Equipment", unit: "units", max: 100 }
    };
  }

  /**
   * Check resource availability
   */
  checkResourceAvailability(agent, resourceType, amount) {
    const resource = agent.operationalResources[resourceType];
    return resource !== undefined && resource >= amount;
  }

  /**
   * Get resource utilization report
   */
  getResourceUtilizationReport(agent) {
    const report = {};
    for (const [key, value] of Object.entries(agent.operationalResources)) {
      const max = this.resourceCategories[key]?.max || 100;
      report[key] = {
        current: value,
        maximum: max,
        utilization: Math.round((value / max) * 100) + "%"
      };
    }
    return report;
  }

  /**
   * Recommend resource redistribution
   */
  recommendResourceRedistribution(agent) {
    const recommendations = [];
    for (const [key, value] of Object.entries(agent.operationalResources)) {
      const max = this.resourceCategories[key]?.max || 100;
      const utilization = (value / max) * 100;
      
      if (utilization > 80) {
        recommendations.push(`${key}: Over-allocated (${utilization.toFixed(0)}%). Consider redistribution.`);
      } else if (utilization < 20) {
        recommendations.push(`${key}: Under-utilized (${utilization.toFixed(0)}%). Consider reallocation.`);
      }
    }
    return recommendations;
  }
}

// =============================================================================
// DAS_CoverIdentityManager: Cover Management System
// =============================================================================

class DAS_CoverIdentityManager {
  constructor() {
    this.commonProfessions = [
      "Academic", "Consultant", "Government Agent", "Corporate Executive",
      "Journalist", "Investigator", "Contractor", "Diplomat",
      "Military Personnel", "Police Officer", "Medical Professional",
      "Mechanic", "Tradesman", "Artist", "Entrepreneur"
    ];
    
    this.coverLegendTypes = [
      "Employment History", "Educational Background", "Family Connections",
      "Financial Records", "Criminal History", "Medical Records",
      "Travel History", "Social Media Presence", "Property Ownership"
    ];
  }

  /**
   * Generate random cover identity
   */
  generateRandomCover() {
    const professions = this.commonProfessions;
    const profession = professions[Math.floor(Math.random() * professions.length)];
    const names = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Bailey"];
    const lastName = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller"];
    
    const name = names[Math.floor(Math.random() * names.length)] + " " +
                 lastName[Math.floor(Math.random() * lastName.length)];
    
    return {
      name: name,
      profession: profession,
      background: `Established ${profession.toLowerCase()} with clean background.`
    };
  }

  /**
   * Validate cover identity consistency
   */
  validateCoverConsistency(cover) {
    const issues = [];
    
    if (!cover.name || cover.name.trim().length === 0) {
      issues.push("Cover identity must have a name.");
    }
    
    if (!cover.profession || cover.profession.trim().length === 0) {
      issues.push("Cover identity must have a profession.");
    }
    
    if (cover.legends && Object.keys(cover.legends).length === 0) {
      issues.push("Cover identity should have supporting legends.");
    }
    
    if (cover.safeHouses && cover.safeHouses.length === 0) {
      issues.push("Consider establishing safe houses for this cover.");
    }
    
    return {
      valid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * Get cover stress level
   */
  getCoverStressLevel(cover, timeUnderCover) {
    const baseStress = 10;
    const timeStress = Math.floor(timeUnderCover / 30); // 10 additional stress per month
    const legendCount = Object.keys(cover.legends || {}).length;
    const legendStress = Math.floor(legendCount * 2);
    
    const totalStress = baseStress + timeStress + legendStress;
    
    return {
      totalStress: totalStress,
      baseStress: baseStress,
      timeStress: timeStress,
      legendStress: legendStress,
      riskLevel: totalStress > 50 ? "high" : totalStress > 30 ? "moderate" : "low"
    };
  }
}

// =============================================================================
// DAS_Generator: Random Character/Mission Generator
// =============================================================================

class DAS_Generator {
  /**
   * Generate a random Delta Green agent
   */
  static generateAgent(name = null) {
    const agent = new DAS_Agent(name || this.generateRandomName());
    
    // Randomize attributes
    for (const attr in agent.attributes) {
      agent.attributes[attr] = 30 + Math.floor(Math.random() * 41); // 30-70
    }
    
    // Randomize skills
    for (const skill in agent.skills) {
      agent.skills[skill] = Math.floor(Math.random() * 61); // 0-60
    }
    
    // Set sanity to reasonable level
    agent.sanity.current = 60 + Math.floor(Math.random() * 31); // 60-90
    agent.sanity.maximum = agent.sanity.current;
    
    return agent;
  }

  /**
   * Generate random name
   */
  static generateRandomName() {
    const firstNames = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Bailey", "Sam"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"];
    
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${first} ${last}`;
  }

  /**
   * Generate a mission brief
   */
  static generateMissionBrief() {
    const objectives = [
      "Investigate disappearances in rural area",
      "Recover classified artifact",
      "Eliminate unnatural threat",
      "Gather intelligence on cult activity",
      "Protect civilian from supernatural danger",
      "Retrieve corrupted documentation"
    ];
    
    const complications = [
      "Local law enforcement interference",
      "Entity manifestation during mission",
      "Agent contamination/corruption",
      "Resource scarcity",
      "Time pressure - 24 hours to complete",
      "Team member betrayal suspected"
    ];
    
    const objective = objectives[Math.floor(Math.random() * objectives.length)];
    const complication = complications[Math.floor(Math.random() * complications.length)];
    
    return {
      objective: objective,
      complication: complication,
      clearanceLevel: ["Unclassified", "Classified", "Top Secret", "Black"][Math.floor(Math.random() * 4)],
      deadline: 1 + Math.floor(Math.random() * 14) // 1-14 days
    };
  }
}

// =============================================================================
// Export for use in other modules
// =============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DAS_Agent,
    DAS_Team,
    DAS_SanitySystem,
    DAS_ResourceManager,
    DAS_CoverIdentityManager,
    DAS_Generator
  };
}
