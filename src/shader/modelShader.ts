const commonShader = `
struct Light {
  vec3 lightStrength;
  vec3 lightDirection;
  vec3 lightPosition;
};

struct Material {
  sampler2D texture_diffuse1;
  sampler2D texture_specular1;
  sampler2D texture_normal1;
  vec3 ambient;
  vec3 diffuse;
  vec3 specular;
  float shininess;
};
`;

export const shader = {
  vs: `# version 300 es
  layout (location = 0) in vec4 aPos;
  layout (location = 1) in vec4 aNormal;
  layout (location = 2) in vec2 aTexCoords;
  ${commonShader}

  out vec2 TexCoords;

  uniform mat4 model;
  uniform mat4 view;
  uniform mat4 projection;

  void main() {
    TexCoords = aTexCoords;
    gl_Position = projection * view * model * aPos;
  }

`,
  fs: `# version 300 es
precision highp float;
${commonShader}

uniform Material material;

out vec4 FragColor;

in vec2 TexCoords;

void main()
{   
    FragColor = texture(material.texture_diffuse1, TexCoords) * vec4(material.diffuse, 1.0);
}
`,
};
