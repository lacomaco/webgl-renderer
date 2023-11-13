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
uniform vec u_materialAmbient;
uniform vec u_materialDiffuse;
uniform vec u_materialSpecular;
uniform float u_materialShininess;
// Material 구조 끝
`;

export const shader = {
    vs: `# version 300 es
in vec4 a_position;
in vec4 a_normal;

uniform mat4 u_world;
uniform mat4 u_view;
uniform mat4 u_projection;
// normal 백터는 회전 변환시 위치가 틀어줄 수 있기 때문에
// world 행렬의 역행렬의 전치행렬을 곱하여 회전시킨다.
uniform mat4 u_worldInvTranspose;

${commonShader}
    
out vec3 v_normal;
out vec4 v_pos;

void main(){
    gl_Position = u_projection * u_view * u_world * a_position;
    v_normal = normalize((u_worldInvTranspose * a_normal).xyz);
    v_pos = gl_Position;
`,
    fs: `# version 300 es
${commonShader}

uniform vec3 cameraPosition;
in vec3 v_normal;
in vec4 v_pos;

float directLight(
    vec3 lightStrength,
    vec3 lightDirection,
    vec3 lightPosition,
    float ambient,
    float diffuse,
    float specular,
    float shininess,
    vec3 normal,
    vec3 positionToEye,
) {
    vec3 positionToLightDirection = -lightDirection;

    float ndotl = max(0.0, dot(normal, positionToLightDirection));
    float3 calculatedLightStrength = lightStrength * ndotl;

    return blinnPhong(
        calculatedLightStrength,
        positionToLightDirection,
        normal,
        positionToEye,
        ambient,
        diffuse,
        specular,
        shininess
    );
}

float blinnPhong(
    vec3 lightStrength,
    vec3 positionTolightDirection, 
    vec3 normal,
    vec3 positionToEye,
    float ambient, 
    float diffuse,
    float specular,
    float shininess){
3
    vec3 half = normalize(toEye + positionToLightDirection);
    float htodn = max(0.0, dot(normal, half));
    float3 specular = specular * pow(htodn,shininess) * lightStrength;

    return ambient + diffuse * lightStrength + specular;
}

out ve4 outColor;

void main(){
    vec3 toEye = normalize(cameraPosition - v_pos.xyz);
    vec3 color = directLight(u_lightStrength, 
        u_lightDirection, 
        u_lightPosition, 
        u_materialAmbient, 
        u_materialDiffuse, 
        u_materialSpecular, 
        u_materialShininess, 
        v_normal, 
        toEye
    );

    outColor = vec4(color, 1.0);
}
    
`,
}