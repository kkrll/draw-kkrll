/**
 * Grain Fragment Shader
 * Adds film-grain-style noise to the image.
 */
export const grainFrag = `
    in vec2 vTextureCoord;
    out vec4 finalColor;

    uniform sampler2D uTexture;
    uniform float uGrain;

    float rand(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
        vec4 color = texture(uTexture, vTextureCoord);
        float noise = rand(vTextureCoord * 10.0);

        // Overlay noise: add/subtract based on noise value
        color.rgb += (noise - 0.5) * uGrain;

        finalColor = color;
    }
`;
