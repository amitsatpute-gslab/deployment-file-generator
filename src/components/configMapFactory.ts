export class ConfigMapsFactory {
  createConfigMap(name, project) {
    const configMap = {
      apiVersion: "v1",
      kind: "ConfigMap",
      metadata: {
        name: `${name}-configmap`,
        labels: {
          name: `${name}-configmap`,
          app: project,
        },
      },
      data: {},
    };

    return configMap;
  }

  setApiVersion(configMap, apiVersion: string) {
    configMap.apiVersion = apiVersion;
  }

  setData(configMap,data){   
    for(let info of data?data:[]){
        configMap.data[`${info.name}_cfg`] = info.value
    }    
  }
}
