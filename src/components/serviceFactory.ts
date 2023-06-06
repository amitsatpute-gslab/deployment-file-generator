export class ServiceFactory {
  createService(name, project) {
    const service = {
      apiVersion: "v1",
      kind: "Service",
      metadata: {
        name: `${name}-service`,
        labels: {
          name: `${name}-service`,
          app: project,
        },
      },
      spec: {
        selector: {
          name: `${name}-pod`,
          app: project,
        },
        ports: [
          {            
            port: 80,
          },
        ],
      },
    };

    return service;
  }

  setPort(service, portNumber) {
    service.spec.ports[0]["port"] = portNumber;
  }
  setTargetPorts(service, portNumber) {
    service.spec.ports[0]["targetPort"] = portNumber;
  }
  setProtocol(service, protocol) {
    service.spec.ports[0]["protocol"] = protocol;
  }
  setNodePort(service, portNumber) {
    if (!(portNumber >= 30000 && portNumber <= 32767))
      throw new Error(
        "nodePort will allocate a port from a range (default: 30000-32767)"
      );
    service.spec.ports[0]["nodePort"] = portNumber;
  }
}
