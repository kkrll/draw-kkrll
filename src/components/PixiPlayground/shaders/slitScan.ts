export const slitScanFrag = `
  in vec2 vTextureCoord;
  uniform sampler2D uTexture;

  uniform float uLines;    // How many horizontal slices? (e.g. 50.0)
  uniform float uOffset;   // How much to shift them? (e.g. 0.1)
  uniform float uPhase;    // Move the wave up/down (e.g. 0.0 - 10.0)
  uniform float uFreq;     // How many waves? (e.g. 5.0)

  void main() {
      // 1. Determine the "Row Index"
      float row = floor(vTextureCoord.y * uLines);

      // 2. Calculate the Shift
      // We use the row index to drive a sine wave.
      // This ensures every pixel in the row gets the EXACT same shift.
      float phase = (row / uLines) * uFreq;
      float shift = sin(phase + uPhase) * uOffset;

      // 3. Apply Shift
      vec2 displacedUV = vec2(vTextureCoord.x + shift, vTextureCoord.y);

      gl_FragColor = texture2D(uTexture, displacedUV);
  }
`;
