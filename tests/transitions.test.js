/**
 * Tests for Transitions module
 */

import Transition from '../src/renderer/modules/transitions/Transition';
import { TRANSITION_TYPE, EASING_TYPE } from '../src/renderer/modules/transitions/transitionTypes';

describe('Transition', () => {
  describe('initialization', () => {
    test('should create with default values', () => {
      const transition = new Transition();
      
      expect(transition.id).toBeDefined();
      expect(transition.type).toBe(TRANSITION_TYPE.NONE);
      expect(transition.easing).toBe(EASING_TYPE.LINEAR);
    });
    
    test('should create with provided options', () => {
      const transition = new Transition({
        type: TRANSITION_TYPE.CROSSFADE,
        duration: 2.0,
        easing: EASING_TYPE.EASE_IN_OUT,
        fromClipId: 'clip1',
        toClipId: 'clip2',
      });
      
      expect(transition.type).toBe(TRANSITION_TYPE.CROSSFADE);
      expect(transition.duration).toBe(2.0);
      expect(transition.easing).toBe(EASING_TYPE.EASE_IN_OUT);
      expect(transition.fromClipId).toBe('clip1');
      expect(transition.toClipId).toBe('clip2');
    });
  });
  
  describe('type management', () => {
    test('should set transition type', () => {
      const transition = new Transition();
      
      transition.setType(TRANSITION_TYPE.WIPE_LEFT);
      
      expect(transition.type).toBe(TRANSITION_TYPE.WIPE_LEFT);
    });
    
    test('should clamp duration when changing type', () => {
      const transition = new Transition({
        type: TRANSITION_TYPE.CROSSFADE,
        duration: 10.0, // Max for crossfade is 5.0
      });
      
      transition.setType(TRANSITION_TYPE.WIPE_LEFT); // Max is 3.0
      
      expect(transition.duration).toBeLessThanOrEqual(3.0);
    });
  });
  
  describe('progress calculation', () => {
    test('should return 0 for NONE type', () => {
      const transition = new Transition({ type: TRANSITION_TYPE.NONE });
      
      expect(transition.getProgress(0.5)).toBe(0);
      expect(transition.getProgress(1.0)).toBe(0);
    });
    
    test('should calculate linear progress', () => {
      const transition = new Transition({
        type: TRANSITION_TYPE.CROSSFADE,
        duration: 2.0,
        easing: EASING_TYPE.LINEAR,
      });
      
      expect(transition.getProgress(0)).toBe(0);
      expect(transition.getProgress(1)).toBe(0.5);
      expect(transition.getProgress(2)).toBe(1);
    });
    
    test('should clamp progress to 0-1', () => {
      const transition = new Transition({
        type: TRANSITION_TYPE.CROSSFADE,
        duration: 1.0,
      });
      
      expect(transition.getProgress(-1)).toBe(0);
      expect(transition.getProgress(10)).toBe(1);
    });
    
    test('should apply ease-in easing', () => {
      const transition = new Transition({
        type: TRANSITION_TYPE.CROSSFADE,
        duration: 2.0,
        easing: EASING_TYPE.EASE_IN,
      });
      
      // At halfway point (1s), ease-in should be less than 0.5
      const progress = transition.getProgress(1);
      expect(progress).toBeLessThan(0.5);
    });
    
    test('should apply ease-out easing', () => {
      const transition = new Transition({
        type: TRANSITION_TYPE.CROSSFADE,
        duration: 2.0,
        easing: EASING_TYPE.EASE_OUT,
      });
      
      // At halfway point (1s), ease-out should be more than 0.5
      const progress = transition.getProgress(1);
      expect(progress).toBeGreaterThan(0.5);
    });
  });
  
  describe('crossfade opacities', () => {
    test('should calculate crossfade opacities', () => {
      const transition = new Transition({ type: TRANSITION_TYPE.CROSSFADE });
      
      const start = transition.getCrossfadeOpacities(0);
      expect(start.fromOpacity).toBe(1);
      expect(start.toOpacity).toBe(0);
      
      const middle = transition.getCrossfadeOpacities(0.5);
      expect(middle.fromOpacity).toBe(0.5);
      expect(middle.toOpacity).toBe(0.5);
      
      const end = transition.getCrossfadeOpacities(1);
      expect(end.fromOpacity).toBe(0);
      expect(end.toOpacity).toBe(1);
    });
  });
  
  describe('wipe position', () => {
    test('should calculate wipe left position', () => {
      const transition = new Transition({ type: TRANSITION_TYPE.WIPE_LEFT });
      
      const pos = transition.getWipePosition(0.5);
      expect(pos.horizontal).toBe(true);
      expect(pos.reverse).toBe(true);
      expect(pos.clipX).toBe(50); // 50% wipe
    });
    
    test('should calculate wipe right position', () => {
      const transition = new Transition({ type: TRANSITION_TYPE.WIPE_RIGHT });
      
      const pos = transition.getWipePosition(0.5);
      expect(pos.horizontal).toBe(true);
      expect(pos.reverse).toBe(false);
      expect(pos.clipX).toBe(50);
    });
    
    test('should calculate wipe up position', () => {
      const transition = new Transition({ type: TRANSITION_TYPE.WIPE_UP });
      
      const pos = transition.getWipePosition(0.5);
      expect(pos.horizontal).toBe(false);
      expect(pos.reverse).toBe(true);
    });
    
    test('should calculate wipe down position', () => {
      const transition = new Transition({ type: TRANSITION_TYPE.WIPE_DOWN });
      
      const pos = transition.getWipePosition(0.5);
      expect(pos.horizontal).toBe(false);
      expect(pos.reverse).toBe(false);
    });
  });
  
  describe('fade color state', () => {
    test('should calculate fade to black state', () => {
      const transition = new Transition({ type: TRANSITION_TYPE.FADE_BLACK });
      
      const start = transition.getFadeColorState(0);
      expect(start.fadeColor).toBe('#000000');
      expect(start.colorOpacity).toBe(0);
      
      const middle = transition.getFadeColorState(0.5);
      expect(middle.colorOpacity).toBe(1);
      
      const end = transition.getFadeColorState(1);
      expect(end.colorOpacity).toBe(0);
    });
    
    test('should calculate fade to white state', () => {
      const transition = new Transition({ type: TRANSITION_TYPE.FADE_WHITE });
      
      const state = transition.getFadeColorState(0.5);
      expect(state.fadeColor).toBe('#ffffff');
    });
  });
  
  describe('shader uniforms', () => {
    test('should get shader uniforms for crossfade', () => {
      const transition = new Transition({ type: TRANSITION_TYPE.CROSSFADE });
      
      const uniforms = transition.getShaderUniforms(0.5);
      
      expect(uniforms.u_transitionProgress).toBe(0.5);
      expect(uniforms.u_fromOpacity).toBe(0.5);
      expect(uniforms.u_toOpacity).toBe(0.5);
    });
    
    test('should get shader uniforms for wipe', () => {
      const transition = new Transition({ type: TRANSITION_TYPE.WIPE_LEFT });
      
      const uniforms = transition.getShaderUniforms(0.5);
      
      expect(uniforms.u_wipePosition).toBeDefined();
      expect(uniforms.u_wipeHorizontal).toBeDefined();
    });
  });
  
  describe('serialization', () => {
    test('should serialize to JSON', () => {
      const transition = new Transition({
        type: TRANSITION_TYPE.CROSSFADE,
        duration: 1.5,
        easing: EASING_TYPE.EASE_OUT,
        fromClipId: 'clip1',
        toClipId: 'clip2',
      });
      
      const json = transition.toJSON();
      
      expect(json.type).toBe(TRANSITION_TYPE.CROSSFADE);
      expect(json.duration).toBe(1.5);
      expect(json.easing).toBe(EASING_TYPE.EASE_OUT);
      expect(json.fromClipId).toBe('clip1');
      expect(json.toClipId).toBe('clip2');
    });
    
    test('should deserialize from JSON', () => {
      const data = {
        id: 'test-id',
        type: TRANSITION_TYPE.WIPE_RIGHT,
        duration: 0.75,
        easing: EASING_TYPE.EASE_IN,
      };
      
      const transition = Transition.fromJSON(data);
      
      expect(transition.id).toBe('test-id');
      expect(transition.type).toBe(TRANSITION_TYPE.WIPE_RIGHT);
      expect(transition.duration).toBe(0.75);
    });
  });
});
