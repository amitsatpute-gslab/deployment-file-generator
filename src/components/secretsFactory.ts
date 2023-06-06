export class SecretsFactory {
    createSecrets(name, project) {
      const secrets = {
        apiVersion: "v1",
        kind: "Secret",
        type: "Opaque",
        metadata: {
          name: `${name}-secret`,
          labels: {
            name: `${name}-secret`,
            app: project,
          },
        },
        data: {},
      };
  
      return secrets;
    }
  
    setApiVersion(secrets, apiVersion: string) {
        secrets.apiVersion = apiVersion;
    }
  
    setData(secrets,data){      
      for(let info of data?data:[]){
        secrets.data[`${info.name}_srt`] = Buffer.from(info.value).toString('base64')
      }    
    }
  }
  