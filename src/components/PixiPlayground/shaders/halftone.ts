/**
 * Halftone Fragment Shader
 * Creates a dot-matrix halftone effect by sampling luminance
 * and rendering metaball-style dots.
 */
export const halftoneFrag = `
    in vec2 vTextureCoord;
    out vec4 finalColor;

    uniform sampler2D uTexture;
    uniform float uGridSize;
    uniform float uSpread;
    uniform vec2 uResolution;

    float getDotSize(vec2 cell) {
        vec2 cellCenterUV = (cell * uGridSize + (uGridSize * 0.5)) / uResolution;
        vec4 color = texture(uTexture, clamp(cellCenterUV, 0.0, 1.0));
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        return (1.0 - gray) * (uGridSize * 0.65);
    }

    void main() {
        vec2 pixelCoord = vTextureCoord * uResolution;
        vec2 currentCell = floor(pixelCoord / uGridSize);

        float influence = 0.0;

        for(float x = -1.0; x <= 1.0; x++) {
            for(float y = -1.0; y <= 1.0; y++) {
                vec2 neighborCell = currentCell + vec2(x, y);
                vec2 neighborCenter = (neighborCell * uGridSize) + (uGridSize * 0.5);
                float radius = getDotSize(neighborCell);
                float dist = distance(pixelCoord, neighborCenter);

                float meta = smoothstep(radius + (uGridSize * uSpread), radius, dist);
                influence += meta;
            }
        }

        if (influence > 0.6) {
             finalColor = vec4(0.1, 0.1, 0.1, 1.0);
        } else {
             finalColor = vec4(0.95, 0.95, 0.9, 1.0);
        }
    }
`;
