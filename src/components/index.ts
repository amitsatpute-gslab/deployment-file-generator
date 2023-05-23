import YAML from "yaml";
import fs from "fs";
import { Properties, imageProps } from "../interface";

class mainTemplate {
  apiVersion: any;
  kind: any;
  constructor(apiVersion, kind) {
    this.apiVersion = apiVersion;
    this.kind = kind;
  }
}

class mainTemplateBuilder {
  mainTemplate: any;
  apiVersion: any;
  kind: any;
  metadataFlag: boolean;
  props: Properties;

  constructor(apiVersion: string, kind: string) {
    this.mainTemplate = new mainTemplate(apiVersion, kind);
    this.apiVersion = apiVersion;
    this.kind = kind;
    this.metadataFlag = true;
  }

  setProps(props: Properties) {
    this.props = props;
  }

  validate() {
    if (!(this.props.appName && this.props.projectName))
      throw new Error(
        "Please set project name and app name using setPorps(projectName, appName)"
      );
  }

  _metadata(): any {
    let postFix = "deployment";
    if (!this.metadataFlag) {
      postFix = "pod";
    }
    this.metadataFlag = false;
    return {
      name: `${this.props.appName}-${postFix}`,
      labels: {
        name: `${this.props.appName}-${postFix}`,
        app: `${this.props.projectName}`,
      },
    };
  }

  metadata(): any {
    this.validate();
    this.mainTemplate.metadata = this._metadata();
    return this;
  }

  _selector() {
    return {
      matchLabels: {
        name: `${this.props.appName}-pod`,
        app: `${this.props.projectName}`,
      },
    };
  }

  _generateContainerConfig(images: imageProps[]): any {
    const configList = [];
    const imgConfig: any = {};
    for (const data of images) {
      imgConfig.name = data.name;
      imgConfig.image = data.image;
      if (data.imagePullPolicy)
        imgConfig.imagePullPolicy = data.imagePullPolicy;
      if (data.ports) {
        let _ports = [];
        for (const _port of data.ports) {
          _ports.push({
            containerPort: _port,
          });
        }
        imgConfig.ports = _ports;
      }
      imgConfig.resources = {
        limits: {
          memory: data.memory,
          cpu: data.cpu,
        },
      };

      // env setting code here

      configList.push(imgConfig);
    }
    return configList;
  }

  template(): any {
    const _template = {
      metadata: this._metadata,
      restartPolicy: this.props.restartPolicy
        ? this.props.restartPolicy
        : "Always",
      containers: this._generateContainerConfig(this.props.containers),
    };

    return _template;
  }

  spec(): any {
    this.mainTemplate.spec = {
      selector: this._selector(),
      replicas: this.props.replicas ? this.props.replicas : 1,
      template: this.template(),
    };

    return this;
  }

  build(): any {
    return this.mainTemplate;
  }

  toYamlFormat(jsonObj:any): any {      
    const doc = new YAML.Document();
    let _jsonObj = JSON.parse(JSON.stringify(jsonObj))    
    doc.contents = _jsonObj;
    return doc.toString()
  }

  toYamlFile(path:string,jsonObj:any){
    const content = this.toYamlFormat(jsonObj)
    fs.writeFileSync(`${path}/deployment.yaml`, content);
  }

}

let tmp = new mainTemplateBuilder("app/v1", "Development");
tmp.setProps({
  appName: "orders",
  projectName: "micro-shop",
  replicas: 1,
  restartPolicy: "Always",  

  containers: [
    {
      name: "orders",
      image: "order:latest",
      memory:"128mi",
      cpu:"500M",
      ports:[3000]
    },
  ],
});
tmp.metadata();
tmp.spec();
console.log(tmp.build());
let jsn = tmp.build()
tmp.toYamlFormat(jsn)
tmp.toYamlFile('.',jsn)