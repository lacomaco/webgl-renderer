import { Renderer } from "./renderer/renderer";
import { combineMeshGroup, materialLoad, modelLoad, ModelType } from "./models/model-loader";

async function loadModel() {
    const meshDatas = await modelLoad('./src/assets/windmill/windmill.obj', ModelType.OBJ);
    const materials = await materialLoad('./src/assets/windmill/windmill.mtl', ModelType.MTL);

    const data = combineMeshGroup(meshDatas,materials);
    console.log(data);

}

loadModel();
const renderer = new Renderer();
renderer.keepRerender();