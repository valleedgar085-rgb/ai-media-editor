require('@testing-library/jest-dom');

// Mock window.electronAPI
window.electronAPI = {
  openFileDialog: jest.fn(() => Promise.resolve({ canceled: true, filePaths: [] }))
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock performance.now
if (typeof performance === 'undefined') {
  global.performance = { now: jest.fn(() => Date.now()) };
}

// Mock WebGL context
HTMLCanvasElement.prototype.getContext = jest.fn(function(type) {
  if (type === 'webgl' || type === 'experimental-webgl') {
    return {
      createShader: jest.fn(),
      shaderSource: jest.fn(),
      compileShader: jest.fn(),
      getShaderParameter: jest.fn(() => true),
      createProgram: jest.fn(),
      attachShader: jest.fn(),
      linkProgram: jest.fn(),
      getProgramParameter: jest.fn(() => true),
      useProgram: jest.fn(),
      getAttribLocation: jest.fn(() => 0),
      getUniformLocation: jest.fn(() => 0),
      createBuffer: jest.fn(),
      bindBuffer: jest.fn(),
      bufferData: jest.fn(),
      createTexture: jest.fn(),
      bindTexture: jest.fn(),
      texParameteri: jest.fn(),
      uniform1f: jest.fn(),
      viewport: jest.fn(),
      clearColor: jest.fn(),
      clear: jest.fn(),
      enableVertexAttribArray: jest.fn(),
      vertexAttribPointer: jest.fn(),
      drawArrays: jest.fn(),
      texImage2D: jest.fn(),
      deleteTexture: jest.fn(),
      deleteBuffer: jest.fn(),
      deleteProgram: jest.fn(),
      VERTEX_SHADER: 35633,
      FRAGMENT_SHADER: 35632,
      ARRAY_BUFFER: 34962,
      STATIC_DRAW: 35044,
      TEXTURE_2D: 3553,
      RGBA: 6408,
      UNSIGNED_BYTE: 5121,
      TEXTURE_WRAP_S: 10242,
      TEXTURE_WRAP_T: 10243,
      TEXTURE_MIN_FILTER: 10241,
      TEXTURE_MAG_FILTER: 10240,
      CLAMP_TO_EDGE: 33071,
      LINEAR: 9729,
      FLOAT: 5126,
      TRIANGLES: 4,
      COLOR_BUFFER_BIT: 16384,
      LINK_STATUS: 35714,
      COMPILE_STATUS: 35713,
    };
  }
  if (type === '2d') {
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      fillStyle: null,
    };
  }
  return null;
});

// Mock URL.createObjectURL
URL.createObjectURL = jest.fn(() => 'blob:mock-url');
URL.revokeObjectURL = jest.fn();
