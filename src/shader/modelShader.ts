/*
 * 메모용
 * v: 정점
 * vt: 텍스쳐 좌표
 * vn: 법선 벡터
 * f: 면 (index)
 * f 1 2 3 [1,2,3 인덱스]
 * f 1/1 2/2 3/3 [1,2,3 정점/텍스쳐 좌표]
 * f 1/1/1 2/2/2 3/3/3 [1,2,3 정점/텍스쳐 좌표/법선 벡터]
 * f 1//1 2//2 3//3 [1,2,3 정점//법선 벡터]
 *
 * mtllib: 재질 파일
 */

const commonShader = `
// Light 구조
uniform vec3 u_lightStrength;
uniform vec3 u_lightDirection;
uniform vec3 u_lightPosition;
// Light 구조 끝

// Material 구조
uniform vec3 u_materialAmbient;
uniform vec3 u_materialDiffuse;
uniform vec3 u_materialSpecular;
uniform float u_materialShininess;
// Material 구조 끝

// image
uniform int u_ambientuse;
uniform int u_diffuseuse;
uniform int u_specularuse;
uniform int u_normaluse;

uniform sampler2D u_ambientMap;
uniform sampler2D u_diffuseMap;
uniform sampler2D u_specularMap;
uniform sampler2D u_normalMap;
`;

export const shader = {
  vs: `# version 300 es
  layout (location = 0) in vec4 aPos;
  layout (location = 1) in vec4 aNormal;
  layout (location = 2) in vec2 aTexCoords;

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

struct Material {
  sampler2D texture_diffuse1;
};

uniform Material material;

out vec4 FragColor;

in vec2 TexCoords;

void main()
{    
    FragColor = texture(material.texture_diffuse1, TexCoords);
}
`,
};
