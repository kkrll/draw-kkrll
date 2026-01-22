/**
 * Monochrome Fragment Shader
 * Converts to grayscale with Levels-style control:
 * - Black point: Values below this become pure black
 * - White point: Values above this become pure white
 * - Mid point: Gamma curve adjustment (like Photoshop Levels)
 */
export const monochromeFrag = `
    in vec2 vTextureCoord;
    out vec4 finalColor;

    uniform sampler2D uTexture;

    uniform float uBlack; // e.g. 0.1
    uniform float uWhite; // e.g. 0.9
    uniform float uMid;   // e.g. 0.5 (Neutral)

    void main() {
        vec4 color = texture(uTexture, vTextureCoord);

        // 1. Desaturate (Luma)
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));

        // 2. Levels Math
        // We remap "Black -> White" to "0 -> 1"
        // Formula: (value - black) / (white - black)
        float range = max(uWhite - uBlack, 0.001); // Prevent div by zero
        float normalized = (gray - uBlack) / range;

        // Clamp to ensure we don't invert colors or go HDR
        normalized = clamp(normalized, 0.0, 1.0);

        // 3. Middle Point (Gamma Correction)
        // We calculate an exponent based on the user's "Mid" slider.
        // If Mid is 0.5, Gamma is 1.0 (Linear).
        // Moving Mid lower brightens the image (Logarithmic).
        float mid = clamp(uMid, 0.01, 0.99);
        float gamma = log(0.5) / log(mid);

        float finalVal = pow(normalized, gamma);

        finalColor = vec4(vec3(finalVal), 1.0);
    }
`;
