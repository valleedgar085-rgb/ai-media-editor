/**
 * History Manager - Implements undo/redo functionality
 */

import { ACTION_TYPE, HISTORY_LIMITS } from './historyTypes';

/**
 * Generate unique action ID
 */
const generateId = () => `action-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * History Manager class
 */
class HistoryManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize || HISTORY_LIMITS.MAX_HISTORY_SIZE;
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = new Set();
    this.isExecuting = false;
    this.batchMode = false;
    this.batchActions = [];
  }

  /**
   * Add a listener for history changes
   * @param {Function} listener - Callback function
   * @returns {Function} - Unsubscribe function
   */
  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of history change
   */
  notifyListeners() {
    this.listeners.forEach(listener => listener({
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoLabel: this.getUndoLabel(),
      redoLabel: this.getRedoLabel(),
    }));
  }

  /**
   * Check if undo is available
   * @returns {boolean}
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   * @returns {boolean}
   */
  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Get label for undo action
   * @returns {string}
   */
  getUndoLabel() {
    if (this.undoStack.length === 0) return '';
    const action = this.undoStack[this.undoStack.length - 1];
    return action.label || this.getDefaultLabel(action.type);
  }

  /**
   * Get label for redo action
   * @returns {string}
   */
  getRedoLabel() {
    if (this.redoStack.length === 0) return '';
    const action = this.redoStack[this.redoStack.length - 1];
    return action.label || this.getDefaultLabel(action.type);
  }

  /**
   * Get default label for action type
   * @param {string} type - Action type
   * @returns {string}
   */
  getDefaultLabel(type) {
    const labels = {
      [ACTION_TYPE.ADD_ITEM]: 'Add Item',
      [ACTION_TYPE.REMOVE_ITEM]: 'Remove Item',
      [ACTION_TYPE.MOVE_ITEM]: 'Move Item',
      [ACTION_TYPE.REORDER_ITEMS]: 'Reorder Items',
      [ACTION_TYPE.UPDATE_ITEM]: 'Update Item',
      [ACTION_TYPE.UPDATE_AUDIO_SETTINGS]: 'Update Audio',
      [ACTION_TYPE.ADD_KEYFRAME]: 'Add Keyframe',
      [ACTION_TYPE.REMOVE_KEYFRAME]: 'Remove Keyframe',
      [ACTION_TYPE.UPDATE_KEYFRAME]: 'Update Keyframe',
      [ACTION_TYPE.ADD_TRANSITION]: 'Add Transition',
      [ACTION_TYPE.REMOVE_TRANSITION]: 'Remove Transition',
      [ACTION_TYPE.UPDATE_TRANSITION]: 'Update Transition',
      [ACTION_TYPE.UPDATE_FILTERS]: 'Update Filters',
      [ACTION_TYPE.RESET_FILTERS]: 'Reset Filters',
      [ACTION_TYPE.CLEAR_ALL]: 'Clear All',
      [ACTION_TYPE.LOAD_PROJECT]: 'Load Project',
      [ACTION_TYPE.BATCH]: 'Multiple Changes',
    };
    return labels[type] || 'Action';
  }

  /**
   * Start batch mode - collect multiple actions as one undo step
   */
  startBatch() {
    this.batchMode = true;
    this.batchActions = [];
  }

  /**
   * End batch mode and commit collected actions
   * @param {string} label - Label for the batch action
   */
  endBatch(label = 'Multiple Changes') {
    if (!this.batchMode || this.batchActions.length === 0) {
      this.batchMode = false;
      this.batchActions = [];
      return;
    }
    
    const batchAction = {
      id: generateId(),
      type: ACTION_TYPE.BATCH,
      label,
      actions: [...this.batchActions],
      timestamp: Date.now(),
    };
    
    this.batchMode = false;
    this.batchActions = [];
    
    this.pushAction(batchAction);
  }

  /**
   * Cancel batch mode without committing
   */
  cancelBatch() {
    this.batchMode = false;
    this.batchActions = [];
  }

  /**
   * Push an action to the history
   * @param {Object} action - Action object with type, undo, redo functions
   */
  pushAction(action) {
    // Skip if we're executing an undo/redo
    if (this.isExecuting) return;
    
    const historyAction = {
      id: generateId(),
      ...action,
      timestamp: Date.now(),
    };
    
    // If in batch mode, collect the action
    if (this.batchMode) {
      this.batchActions.push(historyAction);
      return;
    }
    
    // Push to undo stack
    this.undoStack.push(historyAction);
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Limit stack size
    while (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
    
    this.notifyListeners();
  }

  /**
   * Record an action with automatic undo/redo capture
   * @param {string} type - Action type
   * @param {Object} options - Action options
   * @param {Function} options.execute - Execute function
   * @param {*} options.before - State before execution
   * @param {*} options.after - State after execution
   * @param {Function} options.restore - Function to restore state
   * @param {string} options.label - Action label
   */
  record(type, options) {
    const { execute, before, after, restore, label } = options;
    
    // Execute the action first if provided
    if (execute) {
      execute();
    }
    
    // Create action with undo/redo functions
    const action = {
      type,
      label,
      undo: () => restore(before),
      redo: () => restore(after),
      before,
      after,
    };
    
    this.pushAction(action);
  }

  /**
   * Undo the last action
   * @returns {boolean} - Whether undo was performed
   */
  undo() {
    if (!this.canUndo()) return false;
    
    this.isExecuting = true;
    
    try {
      const action = this.undoStack.pop();
      
      if (action.type === ACTION_TYPE.BATCH) {
        // Undo batch actions in reverse order
        for (let i = action.actions.length - 1; i >= 0; i--) {
          const subAction = action.actions[i];
          if (subAction.undo) {
            subAction.undo();
          }
        }
      } else if (action.undo) {
        action.undo();
      }
      
      this.redoStack.push(action);
      this.notifyListeners();
      return true;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Redo the last undone action
   * @returns {boolean} - Whether redo was performed
   */
  redo() {
    if (!this.canRedo()) return false;
    
    this.isExecuting = true;
    
    try {
      const action = this.redoStack.pop();
      
      if (action.type === ACTION_TYPE.BATCH) {
        // Redo batch actions in order
        for (const subAction of action.actions) {
          if (subAction.redo) {
            subAction.redo();
          }
        }
      } else if (action.redo) {
        action.redo();
      }
      
      this.undoStack.push(action);
      this.notifyListeners();
      return true;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Clear all history
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notifyListeners();
  }

  /**
   * Get history summary
   * @returns {Object}
   */
  getSummary() {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoLabel: this.getUndoLabel(),
      redoLabel: this.getRedoLabel(),
    };
  }
}

// Singleton instance
const historyManager = new HistoryManager();

export default historyManager;
export { HistoryManager };
