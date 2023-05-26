import YAML from "yaml";
import fs from "fs";
import { Properties, ImageProps } from "../interface";

export enum TYPE {
  "Deployment",
  "ConfigMap",
  "Secret",
  "POD",
  "Service",
}
export class TemplateBuilder {
  mainTemplate: any;
  props: Properties;
  configMapTemplate: any;
  secretMapsTemplate: any;
  serviceTemplate: any;

  constructor(apiVersion: string) {
    this.mainTemplate = {
      apiVersion: apiVersion,
      kind: "Deployment",
    };

    this.configMapTemplate = {
      apiVersion: "v1",
      kind: "ConfigMap",
    };

    this.secretMapsTemplate = {
      apiVersion: "v1",
      kind: "Secret",
      type: "Opaque",
    };

    this.serviceTemplate = {
      apiVersion: "v1",
      kind: "Service",
    };
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

  _metadata(type: number): any {
    let postFix =
      type == TYPE.Deployment
        ? "deployment"
        : type == TYPE.ConfigMap
        ? "configmap"
        : type == TYPE.Secret
        ? "secret"
        : type == TYPE.Service
        ? "service"
        : "pod";

    return {
      name: `${this.props.appName}-${postFix}`,
      labels: {
        name: `${this.props.appName}-${postFix}`,
        app: `${this.props.projectName}`,
      },
    };
  }

  metadata(type: number): any {
    this.validate();
    if (type === TYPE.Deployment) {
      this.mainTemplate.metadata = this._metadata(type);
    } else if (type === TYPE.ConfigMap) {
      this.configMapTemplate.metadata = this._metadata(type);
    } else if (type === TYPE.Secret) {
      this.secretMapsTemplate.metadata = this._metadata(type);
    } else if (type === TYPE.Service) {
      this.serviceTemplate.metadata = this._metadata(type);
    } else {
      throw new Error("Type not valid...");
    }
  }

  _selector(type:number = TYPE.Deployment) {
    const data = {
      matchLabels: {
        name: `${this.props.appName}-pod`,
        app: `${this.props.projectName}`,
      },
    }
    return type==TYPE.Deployment?data:data.matchLabels;
  }

  _generateContainerConfig(): any {
    const images: ImageProps[] = this.props.containers;
    const configList = [];
    const imgConfig: any = {};
    for (const data of images) {
      imgConfig.name = data.name ? data.name : this.props.appName;
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
      if (data.env) {
        let envVariables = [];
        if (data.env.config) {
          for (let env of data.env.config) {
            envVariables.push({
              name: env.name,
              valueFrom: {
                configMapKeyRef: {
                  name: `${this.props.appName}-configmap`,
                  key: `${env.name}_cfg`,
                },
              },
            });
          }
        }
        if (data.env.secret) {
          for (let env of data.env.secret) {
            envVariables.push({
              name: env.name,
              valueFrom: {
                secretKeyRef: {
                  name: `${this.props.appName}-secret`,
                  key: `${env.name}_srt`,
                },
              },
            });
          }
        }
        imgConfig.env = envVariables;
      }

      configList.push(imgConfig);
    }
    return configList;
  }

  _servicePorts() {
    const images = this.props.containers;
    const ports = [];
    if (images) {
      for (let image of images) {
        for (const _port of image.ports) {
          ports.push({
            port: 80,
            targetPort: _port,
          });
        }
      }
    }

    return ports;
  }

  template(): any {
    const _template = {
      metadata: this._metadata(TYPE.POD),
      restartPolicy: this.props.restartPolicy
        ? this.props.restartPolicy
        : "Always",
      containers: this._generateContainerConfig(),
    };

    return _template;
  }

  spec(type: number): any {
    if (type == TYPE.Deployment) {
      this.mainTemplate.spec = {
        selector: this._selector(),
        replicas: this.props.replicas ? this.props.replicas : 1,
        template: this.template(),
      };
    } else if (type == TYPE.Service) {
      this.serviceTemplate.spec = {
        selector: this._selector(TYPE.Service),
        ports: this._servicePorts(),
      };
    }
  }

  generateMaps(type: number): any {
    const images: ImageProps[] = this.props.containers;
    const data = {};
    for (let image of images) {
      if (type == TYPE.ConfigMap && image.env.config) {
        for (let config of image.env.config) {
          data[`${config.name}_cfg`] = config.value;
        }
      }
      if (type == TYPE.Secret && image.env.secret) {
        for (let config of image.env.secret) {
          data[`${config.name}_srt`] = Buffer.from(config.value).toString('base64');
        }
      }
    }

    if (type == TYPE.ConfigMap) this.configMapTemplate.data = data;
    if (type == TYPE.Secret) this.secretMapsTemplate.data = data;
  }

  toJsonFormat() {
    this.metadata(TYPE.Deployment);
    this.spec(TYPE.Deployment);
    return this.mainTemplate;
  }

  toYamlFormat(type: number): any {
    this.metadata(type);
    let content = {};
    if (type == TYPE.Deployment) {
      this.spec(TYPE.Deployment);
      content = this.mainTemplate;
    }
    if (type == TYPE.ConfigMap) {
      this.generateMaps(TYPE.ConfigMap);
      content = this.configMapTemplate;
    }
    if (type == TYPE.Secret) {
      this.generateMaps(TYPE.Secret);
      content = this.secretMapsTemplate;
    }
    if (type == TYPE.Service) {
      this.spec(TYPE.Service);
      content = this.serviceTemplate;
    }
    const doc = new YAML.Document();
    let _jsonObj = JSON.parse(JSON.stringify(content));
    doc.contents = _jsonObj;
    return doc.toString();
  }

  toYamlFile(path: string) {
    const deploymentContent = this.toYamlFormat(TYPE.Deployment);
    fs.writeFileSync(`${path}/deployment.yaml`, deploymentContent);

    const configMapContent = this.toYamlFormat(TYPE.ConfigMap);
    fs.writeFileSync(
      `${path}/${this.props.appName}-configmap.yaml`,
      configMapContent
    );

    const secretMapContent = this.toYamlFormat(TYPE.Secret);
    fs.writeFileSync(
      `${path}/${this.props.appName}-secret.yaml`,
      secretMapContent
    );

    const serviceContent = this.toYamlFormat(TYPE.Service);
    fs.writeFileSync(
      `${path}/${this.props.appName}-service.yaml`,
      serviceContent
    );
  }
}
