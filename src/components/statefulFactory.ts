export class StatefulSetFactory {
  createStatefulSet(name, project) {
    const statefulSet = {
      apiVersion: "apps/v1",
      kind: "StatefulSet",
      metadata: {
        name: `${name}-statefulset`,
        labels: {
          name: `${name}-statefulset`,
          app: project,
        },
      },
      spec: {
        selector: {
          matchLabels: {
            name: `${name}-pod`,
            app: project,
          },
        },
        replicas: 1,
        minReadySeconds: 10,
        template: {
          metadata: {
            name: `${name}-pod`,
            labels: {
              name: `${name}-pod`,
              app: project,
            },
          },
          spec: {
            terminationGracePeriodSeconds: 10,
            containers: [],
          },
        },
      },
    };
    return statefulSet;
  }
  setReplicas(statefulSet, replicas) {
    statefulSet.spec.replicas = replicas;
  }
  terminationGracePeriodSeconds(statefulSet, periodSeconds) {
    statefulSet.spec.template.spec.terminationGracePeriodSeconds =
      periodSeconds;
  }
  minReadySeconds(statefulSet, readySeconds) {
    statefulSet.spec.minReadySeconds = readySeconds;
  }

  addContainer(statefulSet, containers: any) {
    console.log(statefulSet);
    const appName = statefulSet.metadata.name.split("-")[0];
    for (let info of containers) {
      let containerEnvs = [];

      //for configmap env
      for (let env of info.env.config ? info.env.config : []) {
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
      for (let env of info.env.secret ? info.env.secret : []) {
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
      //volume mounts
      const containerVolumeMount = [];
      for (let vm of info.volumes.statefulSet ? info.volumes.statefulSet : []) {
        const obj = {
          name: vm.name,
          mountPath: vm.mountPath,
        };
        if (vm.readOnly) obj["readOnly"] = vm.readOnly;
        containerVolumeMount.push(obj);
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
      };
      if (containerEnvs.length > 0) container["env"] = containerEnvs;
      if (containerVolumeMount.length > 0)
        container["volumeMounts"] = containerVolumeMount;
      statefulSet.spec.template.spec.containers.push(container);
    }

    return this;
  }
}
