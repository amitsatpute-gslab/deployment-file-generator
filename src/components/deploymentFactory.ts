
export class DeploymentFactory {
  createDeployment(name, project) {
    const deployment = {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: {
        name: `${name}-deployment`,
        labels: {
          name: `${name}-deployment`,
          app: project,
        },
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            name: `${name}-pod`,
            app: project,
          },
        },
        template: {
          metadata: {
            name: `${name}-pod`,
            labels: {
              name: `${name}-pod`,
              app: project,
            },
          },
          spec: {
            restartPolicy: "Always",
            containers: [],
          },
        },
      },
    };

    return deployment;
  }

  setReplicas(deployment, replicas) {
    deployment.spec.replicas = replicas;
  }

  setRestartPolicy(deployment, policy: string) {
    deployment.spec.template.spec.restartPolicy = policy;
  }

  addContainer(deployment, containers: any) {
    const appName = deployment.metadata.name.split("-")[0];
    for (let info of containers) {
      let containerEnvs = [];

      //for configmap env
      for (let env of info.env.config?info.env.config:[]) {
        containerEnvs.push({
          name: env.name,
          valueFrom: {
            configMapKeyRef: {
              name: `${appName}-configmap`,
              key: `${env.name}_cfg`,
            },
          },
        });
      }
      //for secrets env
      for (let env of info.env.secret?info.env.secret:[]) {
        containerEnvs.push({
          name: env.name,
          valueFrom: {
            secretKeyRef: {
              name: `${appName}-secret`,
              key: `${env.name}_srt`,
            },
          },
        });
      }
      const container = {
        name: info.name,
        image: info.image,
        ports: [{ containerPort: info.ports[0] }],
        resources: {
          limits: {
            cpu: info.cpu ? info.cpu : "128Mi",
            memory: info.memory ? info.memory : "500m",
          },
        },
        env: containerEnvs,
      };
      deployment.spec.template.spec.containers.push(container);
    }

    return this;
  }
}
