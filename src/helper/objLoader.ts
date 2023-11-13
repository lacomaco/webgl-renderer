// @see https://webgl2fundamentals.org/webgl/lessons/ko/
type Vertex = [number, number, number];
type Texcoord = [number, number];
type Normal = [number, number, number];
type Color = [number, number, number];

export interface GeometryData {
  position: Vertex[];
  texcoord: Texcoord[];
  normal: Normal[];
  color: Color[];
}

export interface Geometry {
  object: string;
  groups: string[];
  material: string;
  data: GeometryData;
}

export interface ParsedOBJ {
  geometries: Geometry[];
  materialLibs: string[];
}

function parseMapArgs(unparsedArgs: any) {
    // TODO: handle options
    return unparsedArgs;
  }

export function parseOBJ(text: string): ParsedOBJ {
    // because indices are base 1 let's just fill in the 0th data
    const objPositions: Vertex[] = [[0, 0, 0]];
    const objTexcoords: Texcoord[] = [[0, 0]];
    const objNormals: Normal[] = [[0, 0, 0]];
    const objColors:Color[] = [[0, 0, 0]];
  
    // same order as `f` indices
    const objVertexData: (Vertex[] | Texcoord[] | Normal[] | Color[])[] = [
      objPositions,
      objTexcoords,
      objNormals,
      objColors,
    ];
  
    // same order as `f` indices
    let webglVertexData: (number[][]) = [
      [],   // positions
      [],   // texcoords
      [],   // normals
      [],   // colors
    ];
  
    const materialLibs: string[] = [];
    const geometries: Geometry[] = [];
    let geometry: Geometry | undefined;
    let groups: string[] = ['default'];
    let material: string = 'default';
    let object: string = 'default';
  
    const noop = () => {};
  
    function newGeometry() {
      // If there is an existing geometry and it's
      // not empty then start a new one.
      if (geometry && geometry.data.position.length) {
        geometry = undefined;
      }
    }
  
    function setGeometry() {
      if (!geometry) {
        const position: number[] = [];
        const texcoord: number[] = [];
        const normal: number[] = [];
        const color: number[] = [];
        webglVertexData = [
          position,
          texcoord,
          normal,
          color,
        ];
        geometry = {
          object,
          groups,
          material,
          data: {
            position: position as any,
            texcoord: texcoord as any,
            normal: normal as any,
            color: color as any,
          },
        };
        geometries.push(geometry);
      }
    }
  
    function addVertex(vert:any) {
      const ptn = vert.split('/');
      ptn.forEach((objIndexStr:any, i:any) => {
        if (!objIndexStr) {
          return;
        }
        const objIndex = parseInt(objIndexStr);
        const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
        webglVertexData[i].push(...objVertexData[i][index]);
        // if this is the position index (index 0) and we parsed
        // vertex colors then copy the vertex colors to the webgl vertex color data
        if (i === 0 && objColors.length > 1) {
          geometry!.data.color.push(...objColors[index] as any);
        }
      });
    }
  
    const keywords = {
      v(parts: any) {
        // if there are more than 3 values here they are vertex colors
        if (parts.length > 3) {
          objPositions.push(parts.slice(0, 3).map(parseFloat));
          objColors.push(parts.slice(3).map(parseFloat));
        } else {
          objPositions.push(parts.map(parseFloat));
        }
      },
      vn(parts: any) {
        objNormals.push(parts.map(parseFloat));
      },
      vt(parts: any) {
        // should check for missing v and extra w?
        objTexcoords.push(parts.map(parseFloat));
      },
      f(parts: any) {
        setGeometry();
        const numTriangles = parts.length - 2;
        for (let tri = 0; tri < numTriangles; ++tri) {
          addVertex(parts[0]);
          addVertex(parts[tri + 1]);
          addVertex(parts[tri + 2]);
        }
      },
      s: noop,    // smoothing group
      mtllib(parts: any, unparsedArgs: any) {
        // the spec says there can be multiple filenames here
        // but many exist with spaces in a single filename
        materialLibs.push(unparsedArgs);
      },
      usemtl(parts: any, unparsedArgs: any) {
        material = unparsedArgs;
        newGeometry();
      },
      g(parts: any) {
        groups = parts;
        newGeometry();
      },
      o(parts: any, unparsedArgs: any) {
        object = unparsedArgs;
        newGeometry();
      },
    };
  
    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
      const line = lines[lineNo].trim();
      if (line === '' || line.startsWith('#')) {
        continue;
      }
      const m = keywordRE.exec(line);
      if (!m) {
        continue;
      }
      const [, keyword, unparsedArgs] = m;
      const parts = line.split(/\s+/).slice(1);
      const handler = (keywords as any)[keyword] as any;
      if (!handler) {
        console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
        continue;
      }
      handler(parts, unparsedArgs);
    }
  
    // remove any arrays that have no entries.
    for (const geometry of geometries) {
      (geometry as any).data = Object.fromEntries(
          Object.entries(geometry.data).filter(([, array]) => array.length > 0));
    }
  
    return {
      geometries,
      materialLibs,
    };
}

export interface Material {
    shininess?: number;
    ambient?: number[];
    diffuse?: number[];
    specular?: number[];
    emissive?: number[];
    ambientMap?: string;
    diffuseMap?: string;
    specularMap?: string;
    normalMap?: string;
    opticalDensity?: number;
    opacity?: number;
    illum?: number;
}

interface Materials {
    [key: string]: Material;
}

export function parseMTL(text: string): Materials {
  const materials = {};
  let material: any;

  const keywords = {
    newmtl(parts: any, unparsedArgs: any) {
      material = {};
      (materials as any)[unparsedArgs] = material;
    },
    /* eslint brace-style:0 */
    Ns(parts: any)       { material.shininess      = parseFloat(parts[0]); },
    Ka(parts: any)       { material.ambient        = parts.map(parseFloat); },
    Kd(parts: any)       { material.diffuse        = parts.map(parseFloat); },
    Ks(parts: any)       { material.specular       = parts.map(parseFloat); },
    Ke(parts: any)       { material.emissive       = parts.map(parseFloat); },
    //
    map_Ka(parts: any, unparsedArgs: any)   { material.ambientMap = parseMapArgs(unparsedArgs); },
    // Diffuse Map <-텍스처
    map_Kd(parts: any, unparsedArgs: any)   { material.diffuseMap = parseMapArgs(unparsedArgs); },
    // Specular Map <- 광택
    map_Ns(parts: any, unparsedArgs: any)   { material.specularMap = parseMapArgs(unparsedArgs); },
    // Bump map <- 요철같은 세세한 질감
    map_Bump(parts: any, unparsedArgs: any) { material.normalMap = parseMapArgs(unparsedArgs); },
    Ni(parts: any)       { material.opticalDensity = parseFloat(parts[0]); },
    d(parts: any)        { material.opacity        = parseFloat(parts[0]); },
    illum(parts: any)    { material.illum          = parseInt(parts[0]); },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = (keywords as any)[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }

  return materials;
}

export async function loadOBJ(url: string) {
  const modelInfo = await fetch(url).then(res => res.json());
  const promises = [];

  if(modelInfo.obj){
    promises.push(
      fetch(modelInfo.obj).then(res => res.text()).then(text => parseOBJ(text))
    );
  }

  if(modelInfo.mtl){
    promises.push(
      fetch(modelInfo.mtl).then(res => res.text()).then(text => parseMTL(text))
    );
  }

  const [obj, mtl] = await Promise.all(promises);

  return {
    obj: obj as ParsedOBJ,
    mtl: mtl as Materials,
  }
}