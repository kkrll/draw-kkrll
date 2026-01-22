/**
 * Motion Blur Fragment Shader
 * Creates directional blur by sampling along a velocity vector.
 */
export const motionBlurFrag = `
    in vec2 vTextureCoord;
    out vec4 finalColor;

    uniform sampler2D uTexture;
    uniform float uVelocity;
    uniform float uAngle;

    void main() {
        float rad = radians(uAngle);
        vec2 dir = vec2(cos(rad), sin(rad));
        vec4 color = vec4(0.0);
        float samples = 20.0;

        for (float i = 0.0; i < 20.0; i++) {
            float offset = (i - 10.0) * (uVelocity / 1000.0);
            color += texture(uTexture, vTextureCoord + (dir * offset));
        }

        finalColor = color / samples;
    }
`;
