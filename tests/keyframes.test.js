/**
 * Tests for Keyframes module
 */

import KeyframeTrack from '../src/renderer/modules/keyframes/KeyframeTrack';
import { KEYFRAME_PROPERTY, EASING_PRESET, PROPERTY_RANGE } from '../src/renderer/modules/keyframes/keyframeTypes';

describe('KeyframeTrack', () => {
  describe('initialization', () => {
    test('should create with property', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      expect(track.property).toBe(KEYFRAME_PROPERTY.OPACITY);
      expect(track.keyframes).toEqual([]);
      expect(track.enabled).toBe(true);
    });
    
    test('should use property range', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      expect(track.range.min).toBe(0);
      expect(track.range.max).toBe(1);
      expect(track.range.default).toBe(1);
    });
    
    test('should allow disabling', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY, { enabled: false });
      
      expect(track.enabled).toBe(false);
    });
  });
  
  describe('adding keyframes', () => {
    test('should add keyframe', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      const keyframe = track.addKeyframe(1.0, 0.5);
      
      expect(track.count).toBe(1);
      expect(keyframe.time).toBe(1.0);
      expect(keyframe.value).toBe(0.5);
      expect(keyframe.easing).toBe(EASING_PRESET.LINEAR);
    });
    
    test('should add keyframe with easing', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      const keyframe = track.addKeyframe(1.0, 0.5, EASING_PRESET.EASE_IN);
      
      expect(keyframe.easing).toBe(EASING_PRESET.EASE_IN);
    });
    
    test('should clamp value to property range', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      const keyframe = track.addKeyframe(1.0, 2.0); // Max is 1.0
      
      expect(keyframe.value).toBe(1.0);
    });
    
    test('should replace keyframe at same time', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      track.addKeyframe(1.0, 0.3);
      track.addKeyframe(1.0, 0.8);
      
      expect(track.count).toBe(1);
      expect(track.keyframes[0].value).toBe(0.8);
    });
    
    test('should sort keyframes by time', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      track.addKeyframe(3.0, 0.9);
      track.addKeyframe(1.0, 0.3);
      track.addKeyframe(2.0, 0.6);
      
      expect(track.keyframes[0].time).toBe(1.0);
      expect(track.keyframes[1].time).toBe(2.0);
      expect(track.keyframes[2].time).toBe(3.0);
    });
  });
  
  describe('removing keyframes', () => {
    test('should remove keyframe by id', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      const keyframe = track.addKeyframe(1.0, 0.5);
      track.removeKeyframe(keyframe.id);
      
      expect(track.count).toBe(0);
    });
  });
  
  describe('updating keyframes', () => {
    test('should update keyframe', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      const keyframe = track.addKeyframe(1.0, 0.5);
      
      track.updateKeyframe(keyframe.id, {
        time: 2.0,
        value: 0.8,
        easing: EASING_PRESET.EASE_OUT,
      });
      
      expect(track.keyframes[0].time).toBe(2.0);
      expect(track.keyframes[0].value).toBe(0.8);
      expect(track.keyframes[0].easing).toBe(EASING_PRESET.EASE_OUT);
    });
    
    test('should return null for invalid id', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      const result = track.updateKeyframe('invalid-id', { value: 0.5 });
      
      expect(result).toBeNull();
    });
  });
  
  describe('value interpolation', () => {
    test('should return default value when disabled', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY, { enabled: false });
      
      track.addKeyframe(1.0, 0.5);
      
      expect(track.getValueAtTime(1.0)).toBe(1); // Default for opacity
    });
    
    test('should return default value with no keyframes', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      expect(track.getValueAtTime(1.0)).toBe(1); // Default for opacity
    });
    
    test('should return value before first keyframe', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      track.addKeyframe(2.0, 0.5);
      
      expect(track.getValueAtTime(1.0)).toBe(0.5);
    });
    
    test('should return value after last keyframe', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      track.addKeyframe(1.0, 0.3);
      
      expect(track.getValueAtTime(5.0)).toBe(0.3);
    });
    
    test('should interpolate between keyframes (linear)', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      track.addKeyframe(0, 0);
      track.addKeyframe(2, 1);
      
      expect(track.getValueAtTime(0)).toBe(0);
      expect(track.getValueAtTime(1)).toBe(0.5);
      expect(track.getValueAtTime(2)).toBe(1);
    });
    
    test('should interpolate with ease-in', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      track.addKeyframe(0, 0, EASING_PRESET.EASE_IN);
      track.addKeyframe(2, 1);
      
      // At midpoint, ease-in should be less than 0.5
      expect(track.getValueAtTime(1)).toBeLessThan(0.5);
    });
    
    test('should interpolate with ease-out', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      track.addKeyframe(0, 0, EASING_PRESET.EASE_OUT);
      track.addKeyframe(2, 1);
      
      // At midpoint, ease-out should be more than 0.5
      expect(track.getValueAtTime(1)).toBeGreaterThan(0.5);
    });
    
    test('should step at keyframe with step easing', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      track.addKeyframe(0, 0, EASING_PRESET.STEP);
      track.addKeyframe(2, 1);
      
      // Should stay at 0 until reaching keyframe
      expect(track.getValueAtTime(1)).toBe(0);
      expect(track.getValueAtTime(2)).toBe(1);
    });
  });
  
  describe('keyframe queries', () => {
    test('should get keyframe at time', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      track.addKeyframe(1.0, 0.5);
      
      const keyframe = track.getKeyframeAtTime(1.0);
      expect(keyframe).not.toBeNull();
      expect(keyframe.value).toBe(0.5);
    });
    
    test('should get keyframe within tolerance', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      track.addKeyframe(1.0, 0.5);
      
      const keyframe = track.getKeyframeAtTime(1.03, 0.05);
      expect(keyframe).not.toBeNull();
    });
    
    test('should return null outside tolerance', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      track.addKeyframe(1.0, 0.5);
      
      const keyframe = track.getKeyframeAtTime(1.1, 0.05);
      expect(keyframe).toBeNull();
    });
    
    test('should get keyframes in range', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      track.addKeyframe(1.0, 0.3);
      track.addKeyframe(2.0, 0.5);
      track.addKeyframe(3.0, 0.7);
      track.addKeyframe(4.0, 0.9);
      
      const keyframes = track.getKeyframesInRange(1.5, 3.5);
      
      expect(keyframes).toHaveLength(2);
      expect(keyframes[0].time).toBe(2.0);
      expect(keyframes[1].time).toBe(3.0);
    });
  });
  
  describe('clear', () => {
    test('should clear all keyframes', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      track.addKeyframe(1.0, 0.5);
      track.addKeyframe(2.0, 0.7);
      
      track.clear();
      
      expect(track.count).toBe(0);
    });
  });
  
  describe('serialization', () => {
    test('should serialize to JSON', () => {
      const track = new KeyframeTrack(KEYFRAME_PROPERTY.OPACITY);
      
      track.addKeyframe(1.0, 0.5, EASING_PRESET.EASE_IN);
      
      const json = track.toJSON();
      
      expect(json.property).toBe(KEYFRAME_PROPERTY.OPACITY);
      expect(json.enabled).toBe(true);
      expect(json.keyframes).toHaveLength(1);
      expect(json.keyframes[0].time).toBe(1.0);
      expect(json.keyframes[0].value).toBe(0.5);
    });
    
    test('should deserialize from JSON', () => {
      const data = {
        property: KEYFRAME_PROPERTY.BRIGHTNESS,
        enabled: true,
        keyframes: [
          { id: 'kf1', time: 0, value: 0, easing: EASING_PRESET.LINEAR },
          { id: 'kf2', time: 1, value: 50, easing: EASING_PRESET.EASE_OUT },
        ],
      };
      
      const track = KeyframeTrack.fromJSON(data);
      
      expect(track.property).toBe(KEYFRAME_PROPERTY.BRIGHTNESS);
      expect(track.count).toBe(2);
      expect(track.keyframes[0].id).toBe('kf1');
    });
  });
});
