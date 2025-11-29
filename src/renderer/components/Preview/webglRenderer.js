// Vertex shader for WebGL rendering
export const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

// Fragment shader with brightness, contrast, saturation controls
export const fragmentShaderSource = `
  precision mediump float;
  
  varying vec2 v_texCoord;
  uniform sampler2D u_image;
  uniform float u_brightness;
  uniform float u_contrast;
  uniform float u_saturation;
  
  vec3 adjustBrightness(vec3 color, float brightness) {
    return color * brightness;
  }
  
  vec3 adjustContrast(vec3 color, float contrast) {
    return ((color - 0.5) * contrast) + 0.5;
  }
  
  vec3 adjustSaturation(vec3 color, float saturation) {
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    vec3 grayscale = vec3(luminance);
    return mix(grayscale, color, saturation);
  }
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    
    vec3 adjusted = color.rgb;
    adjusted = adjustBrightness(adjusted, u_brightness);
    adjusted = adjustContrast(adjusted, u_contrast);
    adjusted = adjustSaturation(adjusted, u_saturation);
    
    // Clamp values to valid range
    adjusted = clamp(adjusted, 0.0, 1.0);
    
    gl_FragColor = vec4(adjusted, color.a);
  }
`;

/**
 * Create and compile a shader
 */
export function createShader(gl, type, source) {
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
 * Create a WebGL program from vertex and fragment shaders
 */
export function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  
  return program;
}

/**
 * Initialize WebGL context with the filter shader program
 */
export function initWebGL(canvas) {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true
  });
  
  if (!gl) {
    console.error('WebGL not supported');
    return null;
  }
  
  // Create shaders
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  
  if (!vertexShader || !fragmentShader) {
    return null;
  }
  
  // Create program
  const program = createProgram(gl, vertexShader, fragmentShader);
  
  if (!program) {
    return null;
  }
  
  // Get attribute and uniform locations
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
  const imageLocation = gl.getUniformLocation(program, 'u_image');
  const brightnessLocation = gl.getUniformLocation(program, 'u_brightness');
  const contrastLocation = gl.getUniformLocation(program, 'u_contrast');
  const saturationLocation = gl.getUniformLocation(program, 'u_saturation');
  
  // Create buffers
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1
  ]), gl.STATIC_DRAW);
  
  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0, 1,
    1, 1,
    0, 0,
    0, 0,
    1, 1,
    1, 0
  ]), gl.STATIC_DRAW);
  
  // Create texture
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
  return {
    gl,
    program,
    positionBuffer,
    texCoordBuffer,
    positionLocation,
    texCoordLocation,
    imageLocation,
    brightnessLocation,
    contrastLocation,
    saturationLocation,
    texture
  };
}

/**
 * Render a frame with filters applied
 */
export function renderFrame(webglContext, source, filters) {
  const {
    gl,
    program,
    positionBuffer,
    texCoordBuffer,
    positionLocation,
    texCoordLocation,
    imageLocation,
    brightnessLocation,
    contrastLocation,
    saturationLocation,
    texture
  } = webglContext;
  
  // Update texture with source
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  
  // Set viewport
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
  // Clear
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // Use program
  gl.useProgram(program);
  
  // Set uniforms (convert from 0-200 scale to shader-friendly values)
  gl.uniform1f(brightnessLocation, filters.brightness / 100);
  gl.uniform1f(contrastLocation, filters.contrast / 100);
  gl.uniform1f(saturationLocation, filters.saturation / 100);
  
  // Set position attribute
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  
  // Set texcoord attribute
  gl.enableVertexAttribArray(texCoordLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
  
  // Set texture
  gl.uniform1i(imageLocation, 0);
  
  // Draw
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

/**
 * Clean up WebGL resources
 */
export function cleanupWebGL(webglContext) {
  if (!webglContext) return;
  
  const { gl, program, positionBuffer, texCoordBuffer, texture } = webglContext;
  
  gl.deleteBuffer(positionBuffer);
  gl.deleteBuffer(texCoordBuffer);
  gl.deleteTexture(texture);
  gl.deleteProgram(program);
}
