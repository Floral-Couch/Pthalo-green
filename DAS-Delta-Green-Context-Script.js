/**
 * DAS-Delta-Green-Context-Script.js
 * Delta Green Context Management System
 * 
 * Manages story state injection and narrative progression for Delta Green
 * campaign scenarios. Handles agent status, team dynamics, mission briefing,
 * threat assessment, and narrative injection for immersive storytelling.
 * 
 * @version 1.0.0
 * @author DAS (Delta Green Administration System)
 * @date 2025-12-20
 */

class DeltaGreenContextManager {
  /**
   * Initialize the Delta Green Context Manager
   * @param {Object} config - Configuration object
   * @param {string} config.campaignId - Unique campaign identifier
   * @param {string} config.gamemaster - Gamemaster name
   * @param {Array} config.agents - Initial agent roster
   * @param {Object} config.worldState - Initial world state
   */
  constructor(config = {}) {
    this.campaignId = config.campaignId || `DG-${Date.now()}`;
    this.gamemaster = config.gamemaster || 'Anonymous Handler';
    this.timestamp = new Date().toISOString();
    
    // Core state management
    this.agents = new Map();
    this.teams = new Map();
    this.missions = new Map();
    this.threats = new Map();
    this.narrative = {
      scenes: [],
      atmosphere: [],
      clues: [],
      revelations: []
    };
    this.worldState = config.worldState || {};
    this.storyArchive = [];
    
    // Initialize agents if provided
    if (config.agents && Array.isArray(config.agents)) {
      config.agents.forEach(agent => this.registerAgent(agent));
    }
    
    this.sanityTracker = new Map();
    this.missionLog = [];
    this.contextHistory = [];
  }

  /**
   * Build and inject complete narrative context
   * @param {Object} contextData - Full context data structure
   * @returns {Object} Injected context object
   */
  buildContext(contextData) {
    const context = {
      id: `CTX-${this.campaignId}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      gamemaster: this.gamemaster,
      agents: this.getAllAgents(),
      teams: this.getAllTeams(),
      currentMission: this.getCurrentMission(),
      activeThreats: this.getActiveThreats(),
      narrative: this.getNarrativeState(),
      worldState: { ...this.worldState },
      atmosphere: contextData.atmosphere || 'tense',
      briefingLevel: contextData.briefingLevel || 'classified',
      clearance: contextData.clearance || 'DELTA GREEN',
      metadata: {
        version: '1.0.0',
        systemTime: this.timestamp,
        contextBuilder: 'DeltaGreenContextManager'
      }
    };

    // Archive the built context
    this.contextHistory.push(context);
    
    return context;
  }

  /**
   * Register or update an agent's status
   * @param {Object} agent - Agent object
   * @param {string} agent.id - Agent identifier
   * @param {string} agent.name - Agent name
   * @param {string} agent.role - Agent role/archetype
   * @param {number} agent.sanity - Current sanity points
   * @param {Object} agent.skills - Agent skills
   * @param {Object} agent.status - Current operational status
   * @returns {Object} Updated agent object
   */
  registerAgent(agent) {
    const agentData = {
      id: agent.id || `AGENT-${this.agents.size + 1}`,
      name: agent.name || 'Unknown Agent',
      role: agent.role || 'Operative',
      callsign: agent.callsign || this.generateCallsign(),
      sanity: agent.sanity || 60,
      maxSanity: agent.maxSanity || 60,
      skills: agent.skills || {},
      status: agent.status || 'active',
      cover: agent.cover || { identity: 'unknown', occupation: 'civilian' },
      equipment: agent.equipment || [],
      connections: agent.connections || [],
      notes: agent.notes || '',
      joinedCampaign: new Date().toISOString(),
      lastAction: null,
      stressLevel: 0
    };

    this.agents.set(agentData.id, agentData);
    this.sanityTracker.set(agentData.id, {
      current: agentData.sanity,
      max: agentData.maxSanity,
      history: [],
      breakpoints: []
    });

    return agentData;
  }

  /**
   * Update agent status with dynamic state changes
   * @param {string} agentId - Agent identifier
   * @param {Object} statusUpdate - Status update object
   * @returns {Object} Updated agent status
   */
  updateAgentStatus(agentId, statusUpdate) {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found in registry`);
    }

    // Update agent properties
    Object.keys(statusUpdate).forEach(key => {
      if (key === 'sanity') {
        this.modifySanity(agentId, statusUpdate[key]);
      } else if (key === 'status') {
        agent.status = statusUpdate[key];
      } else if (key === 'stressLevel') {
        agent.stressLevel = Math.max(0, Math.min(100, statusUpdate[key]));
      } else if (agent.hasOwnProperty(key)) {
        agent[key] = statusUpdate[key];
      }
    });

    agent.lastAction = new Date().toISOString();
    return agent;
  }

  /**
   * Modify agent sanity and track degradation
   * @param {string} agentId - Agent identifier
   * @param {number} delta - Sanity change amount (positive or negative)
   * @returns {Object} Sanity tracker state
   */
  modifySanity(agentId, delta) {
    const tracker = this.sanityTracker.get(agentId);
    const agent = this.agents.get(agentId);

    if (!tracker || !agent) {
      throw new Error(`Unable to modify sanity for agent ${agentId}`);
    }

    const previousSanity = tracker.current;
    tracker.current = Math.max(0, Math.min(tracker.max, tracker.current + delta));
    
    tracker.history.push({
      timestamp: new Date().toISOString(),
      delta: delta,
      previous: previousSanity,
      current: tracker.current,
      reason: ''
    });

    // Check for sanity breakpoints
    if (tracker.current === 0) {
      tracker.breakpoints.push({ timestamp: new Date().toISOString(), type: 'complete_break' });
      agent.status = 'incapacitated';
    } else if (tracker.current < tracker.max * 0.25) {
      tracker.breakpoints.push({ timestamp: new Date().toISOString(), type: 'critical' });
    }

    agent.sanity = tracker.current;
    return tracker;
  }

  /**
   * Create and manage team compositions
   * @param {Object} team - Team configuration
   * @param {string} team.id - Team identifier
   * @param {string} team.name - Team name
   * @param {Array} team.memberIds - Array of agent IDs
   * @param {string} team.objective - Team objective
   * @returns {Object} Created team object
   */
  createTeam(team) {
    const teamData = {
      id: team.id || `TEAM-${this.teams.size + 1}`,
      name: team.name || 'Unnamed Team',
      members: team.memberIds ? team.memberIds.map(id => this.agents.get(id)).filter(Boolean) : [],
      objective: team.objective || '',
      morale: team.morale || 75,
      cohesion: team.cohesion || 80,
      casualtyCount: 0,
      missionHistory: [],
      formed: new Date().toISOString(),
      status: 'active',
      tactics: team.tactics || 'adaptive'
    };

    this.teams.set(teamData.id, teamData);
    return teamData;
  }

  /**
   * Manage team dynamics and morale
   * @param {string} teamId - Team identifier
   * @param {Object} dynamics - Dynamics update
   * @returns {Object} Updated team dynamics
   */
  manageTeamDynamics(teamId, dynamics) {
    const team = this.teams.get(teamId);

    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    if (dynamics.morale !== undefined) {
      team.morale = Math.max(0, Math.min(100, dynamics.morale));
    }

    if (dynamics.cohesion !== undefined) {
      team.cohesion = Math.max(0, Math.min(100, dynamics.cohesion));
    }

    if (dynamics.casualty) {
      team.casualtyCount += dynamics.casualty;
    }

    if (dynamics.tactics) {
      team.tactics = dynamics.tactics;
    }

    // Auto-adjust morale based on casualties and cohesion
    if (team.casualtyCount > 0) {
      const moralePenalty = Math.min(30, team.casualtyCount * 5);
      team.morale = Math.max(0, team.morale - moralePenalty);
    }

    return {
      teamId: team.id,
      morale: team.morale,
      cohesion: team.cohesion,
      casualties: team.casualtyCount,
      status: team.morale > 50 ? 'operational' : 'compromised'
    };
  }

  /**
   * Generate and inject mission briefing
   * @param {Object} briefing - Mission briefing data
   * @param {string} briefing.title - Mission title
   * @param {string} briefing.objective - Primary objective
   * @param {string} briefing.location - Mission location
   * @param {Array} briefing.targets - Target list
   * @param {Object} briefing.parameters - Mission parameters
   * @returns {Object} Complete mission briefing
   */
  generateMissionBriefing(briefing) {
    const mission = {
      id: `MISSION-${this.missions.size + 1}-${Date.now()}`,
      title: briefing.title || 'Classified Operation',
      objective: briefing.objective || 'Unknown',
      location: briefing.location || 'Classified',
      targets: briefing.targets || [],
      parameters: {
        priority: briefing.parameters?.priority || 'high',
        timeframe: briefing.parameters?.timeframe || '72 hours',
        rules_of_engagement: briefing.parameters?.rules_of_engagement || 'green',
        authorized_force: briefing.parameters?.authorized_force || 'lethal',
        collateral_sensitivity: briefing.parameters?.collateral_sensitivity || 'high'
      },
      briefingDate: new Date().toISOString(),
      status: 'active',
      assignedTeams: briefing.assignedTeams || [],
      intelligence: {
        enemyForces: briefing.intelligence?.enemyForces || [],
        supportingAssets: briefing.intelligence?.supportingAssets || [],
        localIntelligence: briefing.intelligence?.localIntelligence || []
      },
      estimatedCasualties: briefing.estimatedCasualties || 'unknown',
      successCriteria: briefing.successCriteria || [],
      failureConsequences: briefing.failureConsequences || []
    };

    this.missions.set(mission.id, mission);
    this.missionLog.push({ missionId: mission.id, timestamp: new Date().toISOString() });

    return mission;
  }

  /**
   * Get current active mission
   * @returns {Object|null} Current active mission or null
   */
  getCurrentMission() {
    let currentMission = null;
    this.missions.forEach(mission => {
      if (mission.status === 'active') {
        currentMission = mission;
      }
    });
    return currentMission;
  }

  /**
   * Create and track threat assessments
   * @param {Object} threat - Threat data
   * @param {string} threat.name - Threat name
   * @param {string} threat.type - Threat type (entity, artifact, conspiracy, etc.)
   * @param {number} threat.threat_level - Threat level (1-10)
   * @param {string} threat.classification - Classification level
   * @param {Array} threat.attributes - Threat attributes
   * @returns {Object} Created threat object
   */
  createThreatAssessment(threat) {
    const threatData = {
      id: `THREAT-${this.threats.size + 1}`,
      name: threat.name || 'Unknown Threat',
      type: threat.type || 'anomalous',
      threatLevel: Math.max(1, Math.min(10, threat.threat_level || 5)),
      classification: threat.classification || 'DELTA GREEN',
      attributes: threat.attributes || [],
      discovered: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      knownLocations: threat.knownLocations || [],
      capabilities: threat.capabilities || [],
      weaknesses: threat.weaknesses || [],
      agents_aware: threat.agents_aware || [],
      status: 'active',
      containment_status: threat.containment_status || 'uncontained',
      response_team: null
    };

    this.threats.set(threatData.id, threatData);
    return threatData;
  }

  /**
   * Get all active threats
   * @param {Object} filter - Filter options
   * @returns {Array} Array of active threat objects
   */
  getActiveThreats(filter = {}) {
    const threats = [];
    this.threats.forEach(threat => {
      if (threat.status === 'active') {
        if (filter.minThreatLevel && threat.threatLevel < filter.minThreatLevel) {
          return;
        }
        threats.push(threat);
      }
    });
    return threats.sort((a, b) => b.threatLevel - a.threatLevel);
  }

  /**
   * Inject narrative elements into the campaign
   * @param {Object} narrative - Narrative data
   * @param {string} narrative.type - Narrative type (scene, atmosphere, clue, revelation)
   * @param {string} narrative.content - Narrative content
   * @param {Array} narrative.triggers - Trigger conditions
   * @param {number} narrative.intensity - Intensity level (1-10)
   * @returns {Object} Injected narrative element
   */
  injectNarrative(narrative) {
    const narrativeElement = {
      id: `NARRATIVE-${Date.now()}`,
      type: narrative.type || 'scene',
      content: narrative.content || '',
      triggers: narrative.triggers || [],
      intensity: Math.max(1, Math.min(10, narrative.intensity || 5)),
      timestamp: new Date().toISOString(),
      delivered: false,
      affected_agents: narrative.affected_agents || [],
      mood: narrative.mood || 'tense',
      consequences: narrative.consequences || []
    };

    // Categorize narrative element
    if (narrativeElement.type === 'scene') {
      this.narrative.scenes.push(narrativeElement);
    } else if (narrativeElement.type === 'atmosphere') {
      this.narrative.atmosphere.push(narrativeElement);
    } else if (narrativeElement.type === 'clue') {
      this.narrative.clues.push(narrativeElement);
    } else if (narrativeElement.type === 'revelation') {
      this.narrative.revelations.push(narrativeElement);
    }

    return narrativeElement;
  }

  /**
   * Get complete narrative state
   * @returns {Object} Complete narrative state
   */
  getNarrativeState() {
    return {
      scenes: this.narrative.scenes.length,
      atmosphere: this.narrative.atmosphere.length,
      clues: this.narrative.clues.length,
      revelations: this.narrative.revelations.length,
      recentScene: this.narrative.scenes[this.narrative.scenes.length - 1] || null,
      pendingNarrative: [
        ...this.narrative.scenes,
        ...this.narrative.atmosphere,
        ...this.narrative.clues,
        ...this.narrative.revelations
      ].filter(n => !n.delivered)
    };
  }

  /**
   * Get all registered agents
   * @returns {Array} Array of all agent objects
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Get all teams
   * @returns {Array} Array of all team objects
   */
  getAllTeams() {
    return Array.from(this.teams.values());
  }

  /**
   * Generate unique callsign for agents
   * @private
   * @returns {string} Generated callsign
   */
  generateCallsign() {
    const adjectives = ['Silent', 'Swift', 'Dark', 'Gray', 'Cold', 'Sharp'];
    const nouns = ['Shadow', 'Wolf', 'Raven', 'Viper', 'Ghost', 'Wraith'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 100);
    return `${adj}${noun}-${num}`;
  }

  /**
   * Export campaign state for archival
   * @returns {Object} Complete campaign state
   */
  exportCampaignState() {
    return {
      campaignId: this.campaignId,
      gamemaster: this.gamemaster,
      exportDate: new Date().toISOString(),
      agents: this.getAllAgents(),
      teams: this.getAllTeams(),
      missions: Array.from(this.missions.values()),
      threats: Array.from(this.threats.values()),
      narrative: this.narrative,
      worldState: this.worldState,
      sanityTracking: Array.from(this.sanityTracker.entries()),
      missionLog: this.missionLog,
      contextHistory: this.contextHistory
    };
  }

  /**
   * Reset campaign for new scenario
   * @param {Object} config - Reset configuration
   */
  resetCampaign(config = {}) {
    if (config.preserveAgents !== true) {
      this.agents.clear();
      this.sanityTracker.clear();
    }
    
    if (config.preserveTeams !== true) {
      this.teams.clear();
    }

    this.missions.clear();
    this.threats.clear();
    this.narrative = {
      scenes: [],
      atmosphere: [],
      clues: [],
      revelations: []
    };
    this.missionLog = [];
    
    if (config.resetWorldState === true) {
      this.worldState = {};
    }
  }

  /**
   * Get campaign summary
   * @returns {Object} Campaign summary
   */
  getCampaignSummary() {
    return {
      campaignId: this.campaignId,
      gamemaster: this.gamemaster,
      stats: {
        total_agents: this.agents.size,
        active_agents: Array.from(this.agents.values()).filter(a => a.status === 'active').length,
        teams: this.teams.size,
        missions: this.missions.size,
        threats: this.threats.size,
        narrative_elements: Object.values(this.narrative).reduce((sum, arr) => sum + arr.length, 0)
      },
      sanity_average: this.calculateAverageSanity(),
      active_mission: this.getCurrentMission()?.title || 'None',
      threat_level: this.calculateThreatLevel(),
      campaign_duration: this.calculateCampaignDuration()
    };
  }

  /**
   * Calculate average sanity across all agents
   * @private
   * @returns {number} Average sanity
   */
  calculateAverageSanity() {
    if (this.agents.size === 0) return 0;
    const total = Array.from(this.agents.values()).reduce((sum, agent) => sum + agent.sanity, 0);
    return Math.round(total / this.agents.size);
  }

  /**
   * Calculate overall threat level
   * @private
   * @returns {number} Threat level (1-10)
   */
  calculateThreatLevel() {
    const activeThreats = this.getActiveThreats();
    if (activeThreats.length === 0) return 0;
    const avgThreat = activeThreats.reduce((sum, t) => sum + t.threatLevel, 0) / activeThreats.length;
    return Math.round(avgThreat);
  }

  /**
   * Calculate campaign duration
   * @private
   * @returns {string} Duration in readable format
   */
  calculateCampaignDuration() {
    const start = new Date(this.timestamp);
    const now = new Date();
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return `${days} days`;
  }
}

/**
 * Export for use in Node.js and browser environments
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeltaGreenContextManager;
}
