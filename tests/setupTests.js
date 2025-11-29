import '@testing-library/jest-dom';

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock matchMedia
global.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Mock canvas context
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  drawImage: jest.fn(),
  fillText: jest.fn(),
  createShader: jest.fn(() => ({})),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  getShaderParameter: jest.fn(() => true),
  createProgram: jest.fn(() => ({})),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  getProgramParameter: jest.fn(() => true),
  getAttribLocation: jest.fn(() => 0),
  getUniformLocation: jest.fn(() => ({})),
  createBuffer: jest.fn(() => ({})),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  createTexture: jest.fn(() => ({})),
  bindTexture: jest.fn(),
  texParameteri: jest.fn(),
  viewport: jest.fn(),
  clearColor: jest.fn(),
  clear: jest.fn(),
  useProgram: jest.fn(),
  uniform1f: jest.fn(),
  uniform1i: jest.fn(),
  enableVertexAttribArray: jest.fn(),
  vertexAttribPointer: jest.fn(),
  drawArrays: jest.fn(),
  texImage2D: jest.fn(),
  deleteBuffer: jest.fn(),
  deleteTexture: jest.fn(),
  deleteProgram: jest.fn(),
  deleteShader: jest.fn(),
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  ARRAY_BUFFER: 34962,
  STATIC_DRAW: 35044,
  TRIANGLES: 4,
  FLOAT: 5126,
  TEXTURE_2D: 3553,
  TEXTURE_WRAP_S: 10242,
  TEXTURE_WRAP_T: 10243,
  TEXTURE_MIN_FILTER: 10241,
  TEXTURE_MAG_FILTER: 10240,
  CLAMP_TO_EDGE: 33071,
  LINEAR: 9729,
  RGBA: 6408,
  UNSIGNED_BYTE: 5121,
  COLOR_BUFFER_BIT: 16384,
  canvas: { width: 640, height: 360 }
}));
