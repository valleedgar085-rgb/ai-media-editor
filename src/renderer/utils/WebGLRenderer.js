/**
 * WebGL helper for GPU-accelerated rendering with color adjustments
 */

// Vertex shader - passes through position and texture coordinates
const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

// Fragment shader - applies color adjustments
const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform float u_brightness;
  uniform float u_contrast;
  uniform float u_saturation;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    
    // Apply brightness (-1 to 1)
    color.rgb += u_brightness;
    
    // Apply contrast (-1 to 1)
    color.rgb = (color.rgb - 0.5) * (1.0 + u_contrast) + 0.5;
    
    // Apply saturation (-1 to 1)
    float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color.rgb = mix(vec3(luminance), color.rgb, 1.0 + u_saturation);
    
    // Clamp values to valid range
    color.rgb = clamp(color.rgb, 0.0, 1.0);
    
    gl_FragColor = color;
  }
`;

/**
 * WebGL context options
 */
const WEBGL_CONTEXT_OPTIONS = {
  alpha: false,
  antialias: false,
  preserveDrawingBuffer: true,
};

/**
 * WebGL Renderer class for GPU-accelerated media rendering
 */
class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.program = null;
    this.texture = null;
    this.uniformLocations = {};
    this.attributeLocations = {};
    this.positionBuffer = null;
    this.texCoordBuffer = null;
    this.initialized = false;
    
    this.init();
  }
  
  /**
   * Initialize WebGL context and shaders
   */
  init() {
    // Get WebGL context
    this.gl = this.canvas.getContext('webgl', WEBGL_CONTEXT_OPTIONS) 
           || this.canvas.getContext('experimental-webgl', WEBGL_CONTEXT_OPTIONS);
    
    if (!this.gl) {
      console.warn('WebGL not supported, falling back to 2D canvas');
      return;
    }
    
    const gl = this.gl;
    
    // Create shaders
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    
    if (!vertexShader || !fragmentShader) {
      console.error('Failed to compile shaders');
      return;
    }
    
    // Create program
    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);
    
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('Failed to link program:', gl.getProgramInfoLog(this.program));
      return;
    }
    
    gl.useProgram(this.program);
    
    // Get attribute and uniform locations
    this.attributeLocations.position = gl.getAttribLocation(this.program, 'a_position');
    this.attributeLocations.texCoord = gl.getAttribLocation(this.program, 'a_texCoord');
    this.uniformLocations.texture = gl.getUniformLocation(this.program, 'u_texture');
    this.uniformLocations.brightness = gl.getUniformLocation(this.program, 'u_brightness');
    this.uniformLocations.contrast = gl.getUniformLocation(this.program, 'u_contrast');
    this.uniformLocations.saturation = gl.getUniformLocation(this.program, 'u_saturation');
    
    // Create position buffer (full-screen quad)
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);
    
    // Create texture coordinate buffer
    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 1,
      1, 1,
      0, 0,
      0, 0,
      1, 1,
      1, 0,
    ]), gl.STATIC_DRAW);
    
    // Create texture
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    
    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // Set default uniform values
    gl.uniform1f(this.uniformLocations.brightness, 0);
    gl.uniform1f(this.uniformLocations.contrast, 0);
    gl.uniform1f(this.uniformLocations.saturation, 0);
    
    this.initialized = true;
  }
  
  /**
   * Compile a shader
   * @param {number} type - Shader type (VERTEX_SHADER or FRAGMENT_SHADER)
   * @param {string} source - Shader source code
   * @returns {WebGLShader|null}
   */
  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }
  
  /**
   * Update canvas size
   * @param {number} width
   * @param {number} height
   */
  setSize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    
    if (this.gl) {
      this.gl.viewport(0, 0, width, height);
    }
  }
  
  /**
   * Set filter values
   * @param {Object} filters - Filter values { brightness, contrast, saturation }
   */
  setFilters(filters) {
    if (!this.gl || !this.initialized) return;
    
    const gl = this.gl;
    
    // Convert from -100 to 100 range to shader range (-1 to 1)
    if (filters.brightness !== undefined) {
      gl.uniform1f(this.uniformLocations.brightness, filters.brightness / 100);
    }
    if (filters.contrast !== undefined) {
      gl.uniform1f(this.uniformLocations.contrast, filters.contrast / 100);
    }
    if (filters.saturation !== undefined) {
      gl.uniform1f(this.uniformLocations.saturation, filters.saturation / 100);
    }
  }
  
  /**
   * Render a video/image frame
   * @param {HTMLVideoElement|HTMLImageElement|HTMLCanvasElement} source - Source element
   */
  render(source) {
    if (!this.gl || !this.initialized) {
      // Fallback to 2D canvas rendering
      this.render2D(source);
      return;
    }
    
    const gl = this.gl;
    
    // Update texture with source
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    
    // Clear and draw
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Set up position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.attributeLocations.position);
    gl.vertexAttribPointer(this.attributeLocations.position, 2, gl.FLOAT, false, 0, 0);
    
    // Set up texture coordinate attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.enableVertexAttribArray(this.attributeLocations.texCoord);
    gl.vertexAttribPointer(this.attributeLocations.texCoord, 2, gl.FLOAT, false, 0, 0);
    
    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  
  /**
   * Fallback 2D canvas rendering
   * @param {HTMLVideoElement|HTMLImageElement|HTMLCanvasElement} source
   */
  render2D(source) {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Calculate aspect-fit dimensions
    const sourceWidth = source.videoWidth || source.width;
    const sourceHeight = source.videoHeight || source.height;
    const canvasAspect = this.canvas.width / this.canvas.height;
    const sourceAspect = sourceWidth / sourceHeight;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (sourceAspect > canvasAspect) {
      drawWidth = this.canvas.width;
      drawHeight = this.canvas.width / sourceAspect;
      offsetX = 0;
      offsetY = (this.canvas.height - drawHeight) / 2;
    } else {
      drawHeight = this.canvas.height;
      drawWidth = this.canvas.height * sourceAspect;
      offsetX = (this.canvas.width - drawWidth) / 2;
      offsetY = 0;
    }
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);
  }
  
  /**
   * Clean up WebGL resources
   */
  dispose() {
    if (!this.gl) return;
    
    const gl = this.gl;
    
    if (this.texture) gl.deleteTexture(this.texture);
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.texCoordBuffer) gl.deleteBuffer(this.texCoordBuffer);
    if (this.program) gl.deleteProgram(this.program);
    
    this.gl = null;
    this.initialized = false;
  }
  
  /**
   * Check if WebGL is available
   * @returns {boolean}
   */
  isWebGLAvailable() {
    return this.initialized && this.gl !== null;
  }
}

export default WebGLRenderer;
