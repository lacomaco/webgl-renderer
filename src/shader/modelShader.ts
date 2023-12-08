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

struct CalculatedMaterial {
  vec3 ambient;
  vec3 diffuse;
  vec3 specular;
  float shininess;
};

uniform vec3 cameraPosition;
`;

export const shader = {
  vs: `# version 300 es
  layout (location = 0) in vec4 aPos;
  layout (location = 1) in vec4 aNormal;
  layout (location = 2) in vec2 aTexCoords;
  ${commonShader}

  out vec2 TexCoords;
  out vec3 v_normal;
  out vec3 v_position;

  uniform mat4 model;
  uniform mat4 view;
  uniform mat4 projection;
  uniform mat4 modelInverseTranspose;

  void main() {
    TexCoords = aTexCoords;
    gl_Position = projection * view * model * aPos;
    v_normal = normalize((modelInverseTranspose * aNormal).xyz);
    v_position = (model * aPos).xyz;
  }

`,
  fs: `# version 300 es
precision highp float;
${commonShader}

uniform Material material;
uniform Light light;

out vec4 FragColor;

in vec2 TexCoords;
in vec3 v_normal;
in vec3 v_position;

vec3 blinnPhong(Light light,CalculatedMaterial material,vec3 positionToLightDirection,vec3 toEye,vec3 lightStrength) {
  vec3 hVector = normalize(positionToLightDirection + toEye);
  float hdotn = max(dot(v_normal, hVector), 0.0);
  vec3 calcSpecular = material.specular * pow(hdotn, material.shininess);

  return calcSpecular * lightStrength + material.ambient + material.diffuse * lightStrength;
}

vec3 directLight(Light light,CalculatedMaterial material,vec3 toEye) {
  vec3 positionToLightDirection = normalize(-light.lightDirection);

  float ndotl = max(dot(v_normal, positionToLightDirection), 0.0);
  vec3 lightStrength = light.lightStrength * ndotl;

  return blinnPhong(
    light,
    material,
    positionToLightDirection,
    toEye,
    lightStrength
  );
}

void main()
{   vec3 diffuse = texture(material.texture_diffuse1, TexCoords).xyz * material.diffuse;
    vec3 specular = texture(material.texture_specular1, TexCoords).xyz * material.specular;

    vec3 toEye = cameraPosition - v_position;

    CalculatedMaterial calculated_material;

    calculated_material.ambient = material.ambient;
    calculated_material.diffuse = diffuse;
    calculated_material.specular = specular;
    calculated_material.shininess = material.shininess;


    vec3 color = directLight(
      light,
      calculated_material,
      toEye
    );

    FragColor = vec4(color.xyz,1);
}
`,
};
