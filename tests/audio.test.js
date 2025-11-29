/**
 * Tests for Audio module
 */

import AudioClip from '../src/renderer/modules/audio/AudioClip';
import { generateWaveformData } from '../src/renderer/modules/audio/Waveform';
import { AUDIO_STATE, FADE_TYPE } from '../src/renderer/modules/audio/audioTypes';

describe('AudioClip', () => {
  describe('initialization', () => {
    test('should create with default values', () => {
      const clip = new AudioClip();
      
      expect(clip.id).toBeDefined();
      expect(clip.type).toBe('audio');
      expect(clip.volume).toBe(1.0);
      expect(clip.muted).toBe(false);
      expect(clip.solo).toBe(false);
      expect(clip.fadeIn.enabled).toBe(false);
      expect(clip.fadeOut.enabled).toBe(false);
      expect(clip.volumeKeyframes).toEqual([]);
    });
    
    test('should create with provided options', () => {
      const clip = new AudioClip({
        name: 'Test Audio',
        path: '/path/to/audio.mp3',
        startTime: 5,
        duration: 30,
        volume: 0.8,
        muted: true,
      });
      
      expect(clip.name).toBe('Test Audio');
      expect(clip.path).toBe('/path/to/audio.mp3');
      expect(clip.startTime).toBe(5);
      expect(clip.duration).toBe(30);
      expect(clip.volume).toBe(0.8);
      expect(clip.muted).toBe(true);
    });
  });
  
  describe('volume calculations', () => {
    test('should return 0 when muted', () => {
      const clip = new AudioClip({ muted: true, volume: 1.0 });
      expect(clip.getVolumeAtTime(0)).toBe(0);
    });
    
    test('should return base volume without keyframes', () => {
      const clip = new AudioClip({ volume: 0.75 });
      expect(clip.getVolumeAtTime(5)).toBe(0.75);
    });
    
    test('should apply fade in', () => {
      const clip = new AudioClip({
        volume: 1.0,
        duration: 10,
        fadeIn: { enabled: true, duration: 2, type: FADE_TYPE.LINEAR },
      });
      
      // At the start, should be 0
      expect(clip.getVolumeAtTime(0)).toBe(0);
      
      // Halfway through fade, should be ~0.5
      expect(clip.getVolumeAtTime(1)).toBeCloseTo(0.5, 1);
      
      // After fade, should be full volume
      expect(clip.getVolumeAtTime(3)).toBe(1.0);
    });
    
    test('should apply fade out', () => {
      const clip = new AudioClip({
        volume: 1.0,
        duration: 10,
        fadeOut: { enabled: true, duration: 2, type: FADE_TYPE.LINEAR },
      });
      
      // Before fade starts
      expect(clip.getVolumeAtTime(5)).toBe(1.0);
      
      // At the end, should be 0
      expect(clip.getVolumeAtTime(10)).toBe(0);
    });
  });
  
  describe('keyframes', () => {
    test('should add volume keyframe', () => {
      const clip = new AudioClip();
      clip.addVolumeKeyframe(2, 0.5, 'linear');
      
      expect(clip.volumeKeyframes).toHaveLength(1);
      expect(clip.volumeKeyframes[0].time).toBe(2);
      expect(clip.volumeKeyframes[0].value).toBe(0.5);
    });
    
    test('should replace keyframe at same time', () => {
      const clip = new AudioClip();
      clip.addVolumeKeyframe(2, 0.5);
      clip.addVolumeKeyframe(2.005, 0.8); // Within tolerance
      
      expect(clip.volumeKeyframes).toHaveLength(1);
      expect(clip.volumeKeyframes[0].value).toBe(0.8);
    });
    
    test('should interpolate between keyframes', () => {
      const clip = new AudioClip({ volume: 1.0 });
      clip.addVolumeKeyframe(0, 0);
      clip.addVolumeKeyframe(2, 1);
      
      expect(clip.getKeyframeVolumeAtTime(0)).toBe(0);
      expect(clip.getKeyframeVolumeAtTime(1)).toBeCloseTo(0.5, 1);
      expect(clip.getKeyframeVolumeAtTime(2)).toBe(1);
    });
    
    test('should remove keyframe', () => {
      const clip = new AudioClip();
      clip.addVolumeKeyframe(2, 0.5);
      const keyframeId = clip.volumeKeyframes[0].id;
      
      clip.removeVolumeKeyframe(keyframeId);
      expect(clip.volumeKeyframes).toHaveLength(0);
    });
  });
  
  describe('trim and split', () => {
    test('should calculate effective duration after trim', () => {
      const clip = new AudioClip({ originalDuration: 30, trimStart: 5, trimEnd: 5 });
      expect(clip.getEffectiveDuration()).toBe(20);
    });
    
    test('should split clip at given time', () => {
      const clip = new AudioClip({
        name: 'Original',
        path: '/audio.mp3',
        startTime: 0,
        duration: 10,
        originalDuration: 10,
      });
      
      const newClip = clip.split(4);
      
      expect(clip.duration).toBe(4);
      expect(newClip).not.toBeNull();
      expect(newClip.duration).toBe(6);
      expect(newClip.startTime).toBe(4);
    });
    
    test('should return null for invalid split time', () => {
      const clip = new AudioClip({ duration: 10 });
      
      expect(clip.split(0)).toBeNull();
      expect(clip.split(-1)).toBeNull();
      expect(clip.split(10)).toBeNull();
      expect(clip.split(15)).toBeNull();
    });
  });
  
  describe('serialization', () => {
    test('should serialize to JSON', () => {
      const clip = new AudioClip({
        name: 'Test',
        path: '/audio.mp3',
        volume: 0.8,
      });
      
      const json = clip.toJSON();
      
      expect(json.name).toBe('Test');
      expect(json.path).toBe('/audio.mp3');
      expect(json.volume).toBe(0.8);
      expect(json.type).toBe('audio');
    });
    
    test('should deserialize from JSON', () => {
      const data = {
        id: 'test-id',
        name: 'From JSON',
        path: '/path.mp3',
        volume: 0.6,
      };
      
      const clip = AudioClip.fromJSON(data);
      
      expect(clip.id).toBe('test-id');
      expect(clip.name).toBe('From JSON');
      expect(clip.volume).toBe(0.6);
    });
  });
});

describe('Waveform', () => {
  describe('generateWaveformData', () => {
    test('should return empty array for null buffer', () => {
      const peaks = generateWaveformData(null);
      expect(peaks).toHaveLength(0);
    });
    
    test('should generate peaks from audio buffer', () => {
      // Mock AudioBuffer
      const mockBuffer = {
        numberOfChannels: 1,
        sampleRate: 44100,
        duration: 1,
        getChannelData: () => {
          // Create test signal
          const data = new Float32Array(44100);
          for (let i = 0; i < data.length; i++) {
            data[i] = Math.sin(i * 0.01); // Sine wave
          }
          return data;
        },
      };
      
      const peaks = generateWaveformData(mockBuffer, { samplesPerPixel: 256 });
      
      expect(peaks.length).toBeGreaterThan(0);
      // Should have min and max pairs
      expect(peaks.length % 2).toBe(0);
    });
  });
});
