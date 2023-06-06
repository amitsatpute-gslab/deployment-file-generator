import fs from "fs";
import { DeploymentFactory } from "./components/deploymentFactory";
import { ConfigMapsFactory } from "./components/configMapFactory";
import { SecretsFactory } from "./components/secretsFactory";
import { ServiceFactory } from "./components/serviceFactory";
import { generateYAMLFiles } from "./utils/utils";

var args = process.argv.splice(2);

if (args[0] && args[0].split(".")[1].toLowerCase() == "json") {
  const data: any = JSON.parse(fs.readFileSync(args[0], "utf-8"));

  //Deployment
  const factory = new DeploymentFactory();
  const myDeployment = factory.createDeployment(data.appName, data.projectName);
  factory.addContainer(myDeployment, data.containers);
  if (data.replicas) factory.setReplicas(myDeployment, 2);
  if (data.restartPolicy) factory.setRestartPolicy(myDeployment, "Once");
  generateYAMLFiles(`./${data.appName}-deployment.yaml`,myDeployment)

  //Configmap
  const cmFactory = new ConfigMapsFactory();
  const myConfigMap = cmFactory.createConfigMap(data.appName, data.projectName);
  if (data.containers) {
    for (let container of data.containers) {
      cmFactory.setData(myConfigMap, container.env.config);
    }
  }
  generateYAMLFiles(`./${data.appName}-configmap.yaml`,myConfigMap)

  //Secrets
  const srtFactory = new SecretsFactory();
  const mySecret = srtFactory.createSecrets(data.appName, data.projectName);
  if (data.containers) {
    for (let container of data.containers) {
      srtFactory.setData(mySecret, container.env.secret);
    }
  } 
  generateYAMLFiles(`./${data.appName}-secret.yaml`,mySecret)

  //Service
  const srvFactory = new ServiceFactory();
  const myService = srvFactory.createService(data.appName, data.projectName);
  if (data.containers) {
    srvFactory.setTargetPorts(myService, data.containers[0].ports[0]);
  } 
  generateYAMLFiles(`./${data.appName}-service.yaml`,myService)

  console.log(`Deployments files are generated for "${data.appName}"`);
} else {
  console.log(
    "Please provide json file : npm run start:generator <your-file.json>"
  );
}
