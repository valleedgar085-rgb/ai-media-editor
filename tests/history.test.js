/**
 * Tests for History (undo/redo) module
 */

import { HistoryManager } from '../src/renderer/modules/history/HistoryManager';
import { ACTION_TYPE } from '../src/renderer/modules/history/historyTypes';

describe('HistoryManager', () => {
  let history;
  
  beforeEach(() => {
    history = new HistoryManager();
  });
  
  describe('initialization', () => {
    test('should start with empty stacks', () => {
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
    });
    
    test('should have default max size', () => {
      expect(history.maxSize).toBe(100);
    });
    
    test('should accept custom max size', () => {
      const customHistory = new HistoryManager({ maxSize: 50 });
      expect(customHistory.maxSize).toBe(50);
    });
  });
  
  describe('push and undo/redo', () => {
    test('should push action to undo stack', () => {
      let value = 0;
      
      history.pushAction({
        type: ACTION_TYPE.UPDATE_ITEM,
        undo: () => { value = 0; },
        redo: () => { value = 1; },
      });
      
      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);
    });
    
    test('should undo action', () => {
      let value = 0;
      
      history.pushAction({
        type: ACTION_TYPE.UPDATE_ITEM,
        undo: () => { value = 0; },
        redo: () => { value = 1; },
      });
      
      value = 1;
      history.undo();
      
      expect(value).toBe(0);
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(true);
    });
    
    test('should redo action', () => {
      let value = 0;
      
      history.pushAction({
        type: ACTION_TYPE.UPDATE_ITEM,
        undo: () => { value = 0; },
        redo: () => { value = 1; },
      });
      
      value = 1;
      history.undo();
      history.redo();
      
      expect(value).toBe(1);
      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);
    });
    
    test('should clear redo stack on new action', () => {
      history.pushAction({
        type: ACTION_TYPE.UPDATE_ITEM,
        undo: () => {},
        redo: () => {},
      });
      
      history.undo();
      expect(history.canRedo()).toBe(true);
      
      history.pushAction({
        type: ACTION_TYPE.UPDATE_ITEM,
        undo: () => {},
        redo: () => {},
      });
      
      expect(history.canRedo()).toBe(false);
    });
    
    test('should limit undo stack size', () => {
      const smallHistory = new HistoryManager({ maxSize: 3 });
      
      for (let i = 0; i < 5; i++) {
        smallHistory.pushAction({
          type: ACTION_TYPE.UPDATE_ITEM,
          undo: () => {},
          redo: () => {},
        });
      }
      
      expect(smallHistory.undoStack.length).toBe(3);
    });
  });
  
  describe('batch operations', () => {
    test('should collect actions in batch mode', () => {
      let a = 0, b = 0;
      
      history.startBatch();
      
      history.pushAction({
        type: ACTION_TYPE.UPDATE_ITEM,
        undo: () => { a = 0; },
        redo: () => { a = 1; },
      });
      
      history.pushAction({
        type: ACTION_TYPE.UPDATE_ITEM,
        undo: () => { b = 0; },
        redo: () => { b = 1; },
      });
      
      history.endBatch('Update A and B');
      
      // Should have only one action in undo stack
      expect(history.undoStack.length).toBe(1);
      expect(history.undoStack[0].type).toBe(ACTION_TYPE.BATCH);
    });
    
    test('should undo all batch actions together', () => {
      let a = 0, b = 0;
      
      history.startBatch();
      
      history.pushAction({
        type: ACTION_TYPE.UPDATE_ITEM,
        undo: () => { a = 0; },
        redo: () => { a = 1; },
      });
      
      history.pushAction({
        type: ACTION_TYPE.UPDATE_ITEM,
        undo: () => { b = 0; },
        redo: () => { b = 1; },
      });
      
      history.endBatch();
      
      a = 1;
      b = 1;
      
      history.undo();
      
      expect(a).toBe(0);
      expect(b).toBe(0);
    });
    
    test('should cancel batch without committing', () => {
      history.startBatch();
      
      history.pushAction({
        type: ACTION_TYPE.UPDATE_ITEM,
        undo: () => {},
        redo: () => {},
      });
      
      history.cancelBatch();
      
      expect(history.canUndo()).toBe(false);
    });
  });
  
  describe('record helper', () => {
    test('should record action with before/after state', () => {
      let state = { value: 'initial' };
      
      history.record(ACTION_TYPE.UPDATE_ITEM, {
        before: { value: 'initial' },
        after: { value: 'updated' },
        restore: (s) => { state = { ...s }; },
      });
      
      state.value = 'updated';
      
      history.undo();
      expect(state.value).toBe('initial');
      
      history.redo();
      expect(state.value).toBe('updated');
    });
    
    test('should execute action if provided', () => {
      let executed = false;
      
      history.record(ACTION_TYPE.UPDATE_ITEM, {
        execute: () => { executed = true; },
        before: false,
        after: true,
        restore: () => {},
      });
      
      expect(executed).toBe(true);
    });
  });
  
  describe('labels', () => {
    test('should get undo label', () => {
      history.pushAction({
        type: ACTION_TYPE.ADD_ITEM,
        label: 'Add Video',
        undo: () => {},
        redo: () => {},
      });
      
      expect(history.getUndoLabel()).toBe('Add Video');
    });
    
    test('should get redo label', () => {
      history.pushAction({
        type: ACTION_TYPE.REMOVE_ITEM,
        label: 'Delete Clip',
        undo: () => {},
        redo: () => {},
      });
      
      history.undo();
      
      expect(history.getRedoLabel()).toBe('Delete Clip');
    });
    
    test('should use default label if not provided', () => {
      history.pushAction({
        type: ACTION_TYPE.ADD_ITEM,
        undo: () => {},
        redo: () => {},
      });
      
      expect(history.getUndoLabel()).toBe('Add Item');
    });
  });
  
  describe('listeners', () => {
    test('should notify listeners on push', () => {
      const listener = jest.fn();
      history.addListener(listener);
      
      history.pushAction({
        type: ACTION_TYPE.UPDATE_ITEM,
        undo: () => {},
        redo: () => {},
      });
      
      expect(listener).toHaveBeenCalled();
    });
    
    test('should notify listeners on undo/redo', () => {
      const listener = jest.fn();
      
      history.pushAction({
        type: ACTION_TYPE.UPDATE_ITEM,
        undo: () => {},
        redo: () => {},
      });
      
      history.addListener(listener);
      
      history.undo();
      expect(listener).toHaveBeenCalledTimes(1);
      
      history.redo();
      expect(listener).toHaveBeenCalledTimes(2);
    });
    
    test('should unsubscribe listener', () => {
      const listener = jest.fn();
      const unsubscribe = history.addListener(listener);
      
      unsubscribe();
      
      history.pushAction({
        type: ACTION_TYPE.UPDATE_ITEM,
        undo: () => {},
        redo: () => {},
      });
      
      expect(listener).not.toHaveBeenCalled();
    });
  });
  
  describe('clear', () => {
    test('should clear all history', () => {
      history.pushAction({
        type: ACTION_TYPE.UPDATE_ITEM,
        undo: () => {},
        redo: () => {},
      });
      
      history.undo();
      
      history.clear();
      
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
    });
  });
  
  describe('summary', () => {
    test('should get history summary', () => {
      history.pushAction({
        type: ACTION_TYPE.ADD_ITEM,
        label: 'Add Clip',
        undo: () => {},
        redo: () => {},
      });
      
      history.pushAction({
        type: ACTION_TYPE.UPDATE_ITEM,
        label: 'Update',
        undo: () => {},
        redo: () => {},
      });
      
      history.undo();
      
      const summary = history.getSummary();
      
      expect(summary.undoCount).toBe(1);
      expect(summary.redoCount).toBe(1);
      expect(summary.canUndo).toBe(true);
      expect(summary.canRedo).toBe(true);
      expect(summary.undoLabel).toBe('Add Clip');
      expect(summary.redoLabel).toBe('Update');
    });
  });
});
