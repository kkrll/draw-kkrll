/**
 * High Contrast Fragment Shader
 * Adjusts image contrast by scaling colors around the midpoint (0.5).
 */
export const highContrastFrag = `
    in vec2 vTextureCoord;
    out vec4 finalColor;

    uniform sampler2D uTexture;
    uniform float uContrast;

    void main() {
        vec4 color = texture(uTexture, vTextureCoord);

        // Center at 0.5, scale by contrast, move back
        color.rgb = (color.rgb - 0.5) * uContrast + 0.5;

        finalColor = color;
    }
`;
