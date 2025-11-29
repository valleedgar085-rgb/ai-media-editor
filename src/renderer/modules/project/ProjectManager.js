/**
 * Project Manager - Handles project save/load, autosave, and state persistence
 */

import { PROJECT_VERSION, AUTOSAVE_SETTINGS, DEFAULT_PROJECT, STORAGE_KEYS } from './projectTypes';

/**
 * Generate unique project ID
 */
const generateId = () => `project-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Project Manager class
 */
class ProjectManager {
  constructor() {
    this.currentProject = null;
    this.isDirty = false;
    this.autosaveTimer = null;
    this.lastSaveTime = null;
    this.listeners = new Set();
    this.autosaveEnabled = true;
    this.debugMode = false; // Set to true to enable debug logging
  }

  /**
   * Log a message (only in debug mode)
   * @param {string} message - Message to log
   * @param {string} level - Log level ('log', 'warn', 'error')
   */
  log(message, level = 'log') {
    if (this.debugMode || level === 'warn' || level === 'error') {
      console[level](`[ProjectManager] ${message}`);
    }
  }

  /**
   * Add a listener for project changes
   * @param {Function} listener - Callback function
   * @returns {Function} - Unsubscribe function
   */
  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    const summary = this.getSummary();
    this.listeners.forEach(listener => listener(summary));
  }

  /**
   * Create a new project
   * @param {Object} options - Project options
   * @returns {Object} - New project
   */
  createNew(options = {}) {
    this.currentProject = {
      ...DEFAULT_PROJECT,
      id: generateId(),
      name: options.name || DEFAULT_PROJECT.name,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      settings: {
        ...DEFAULT_PROJECT.settings,
        ...(options.settings || {}),
      },
      tracks: [],
      transitions: [],
      filters: { ...DEFAULT_PROJECT.filters },
    };
    
    this.isDirty = false;
    this.startAutosave();
    this.notifyListeners();
    
    return this.currentProject;
  }

  /**
   * Load a project from JSON
   * @param {Object|string} data - Project data or JSON string
   * @returns {Object} - Loaded project
   */
  load(data) {
    const project = typeof data === 'string' ? JSON.parse(data) : data;
    
    // Migrate if needed
    const migratedProject = this.migrateProject(project);
    
    this.currentProject = {
      ...DEFAULT_PROJECT,
      ...migratedProject,
      modified: new Date().toISOString(),
    };
    
    this.isDirty = false;
    this.startAutosave();
    this.notifyListeners();
    
    return this.currentProject;
  }

  /**
   * Load project from file
   * @param {File} file - File object
   * @returns {Promise<Object>} - Loaded project
   */
  async loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const project = this.load(e.target.result);
          project.name = file.name.replace(/\.json$/i, '');
          resolve(project);
        } catch (error) {
          reject(new Error(`Failed to parse project file: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Migrate project to current version
   * @param {Object} project - Project data
   * @returns {Object} - Migrated project
   */
  migrateProject(project) {
    // Version comparison and migration logic
    const version = project.version || '0.0.0';
    
    // Future migrations would go here
    // if (version < '1.1.0') { ... }
    
    return {
      ...project,
      version: PROJECT_VERSION,
    };
  }

  /**
   * Save the current project to JSON
   * @returns {string} - JSON string
   */
  save() {
    if (!this.currentProject) {
      throw new Error('No project to save');
    }
    
    this.currentProject.modified = new Date().toISOString();
    this.currentProject.version = PROJECT_VERSION;
    this.isDirty = false;
    this.lastSaveTime = Date.now();
    this.notifyListeners();
    
    return JSON.stringify(this.currentProject, null, 2);
  }

  /**
   * Save project to file (triggers download)
   * @param {string} filename - Filename
   */
  saveToFile(filename = null) {
    const json = this.save();
    const name = filename || `${this.currentProject.name || 'project'}.json`;
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Update project state from editor store
   * @param {Object} state - Editor store state
   */
  updateFromStore(state) {
    if (!this.currentProject) {
      this.createNew();
    }
    
    this.currentProject.tracks = state.tracks || [];
    this.currentProject.filters = state.filters || DEFAULT_PROJECT.filters;
    this.currentProject.transitions = state.transitions || [];
    
    this.markDirty();
  }

  /**
   * Mark project as dirty (modified)
   */
  markDirty() {
    this.isDirty = true;
    this.notifyListeners();
  }

  /**
   * Start autosave timer
   */
  startAutosave() {
    this.stopAutosave();
    
    if (!this.autosaveEnabled) return;
    
    this.autosaveTimer = setInterval(() => {
      this.performAutosave();
    }, AUTOSAVE_SETTINGS.INTERVAL_MS);
  }

  /**
   * Stop autosave timer
   */
  stopAutosave() {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
  }

  /**
   * Enable or disable autosave
   * @param {boolean} enabled
   */
  setAutosaveEnabled(enabled) {
    this.autosaveEnabled = enabled;
    if (enabled) {
      this.startAutosave();
    } else {
      this.stopAutosave();
    }
  }

  /**
   * Perform autosave
   */
  performAutosave() {
    if (!this.isDirty || !this.currentProject) return;
    
    // Check minimum interval
    if (this.lastSaveTime && 
        (Date.now() - this.lastSaveTime) < AUTOSAVE_SETTINGS.MIN_CHANGE_INTERVAL_MS) {
      return;
    }
    
    try {
      const json = this.save();
      const key = `${STORAGE_KEYS.AUTOSAVE_PREFIX}${this.currentProject.id}`;
      
      // Save to localStorage
      localStorage.setItem(key, json);
      localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, this.currentProject.id);
      
      this.log('Project autosaved');
    } catch (error) {
      this.log(`Autosave failed: ${error.message}`, 'warn');
    }
  }

  /**
   * Get list of autosaves
   * @returns {Array}
   */
  getAutosaves() {
    const autosaves = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEYS.AUTOSAVE_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          autosaves.push({
            id: key.replace(STORAGE_KEYS.AUTOSAVE_PREFIX, ''),
            name: data.name,
            modified: data.modified,
          });
        } catch (e) {
          // Skip invalid entries
        }
      }
    }
    
    return autosaves.sort((a, b) => new Date(b.modified) - new Date(a.modified));
  }

  /**
   * Load autosave by ID
   * @param {string} id - Autosave ID
   * @returns {Object|null}
   */
  loadAutosave(id) {
    const key = `${STORAGE_KEYS.AUTOSAVE_PREFIX}${id}`;
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    return this.load(data);
  }

  /**
   * Revert to last saved state
   */
  revert() {
    if (!this.currentProject) return;
    
    const autosave = this.loadAutosave(this.currentProject.id);
    if (autosave) {
      this.currentProject = autosave;
      this.isDirty = false;
      this.notifyListeners();
    }
  }

  /**
   * Clean up old autosaves
   */
  cleanupAutosaves() {
    const autosaves = this.getAutosaves();
    
    // Keep only MAX_AUTOSAVES most recent
    if (autosaves.length > AUTOSAVE_SETTINGS.MAX_AUTOSAVES) {
      const toDelete = autosaves.slice(AUTOSAVE_SETTINGS.MAX_AUTOSAVES);
      toDelete.forEach(save => {
        localStorage.removeItem(`${STORAGE_KEYS.AUTOSAVE_PREFIX}${save.id}`);
      });
    }
  }

  /**
   * Get project summary
   * @returns {Object}
   */
  getSummary() {
    return {
      hasProject: !!this.currentProject,
      projectId: this.currentProject?.id,
      projectName: this.currentProject?.name,
      isDirty: this.isDirty,
      lastModified: this.currentProject?.modified,
      autosaveEnabled: this.autosaveEnabled,
    };
  }

  /**
   * Get current project data for export
   * @returns {Object|null}
   */
  getProjectData() {
    return this.currentProject ? { ...this.currentProject } : null;
  }
}

// Singleton instance
const projectManager = new ProjectManager();

export default projectManager;
export { ProjectManager };
