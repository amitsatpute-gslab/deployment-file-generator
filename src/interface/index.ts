export interface imageProps {
  name: string;
  image: string;
  ports?: number[];
  imagePullPolicy?: string;
  memory?: string;
  cpu?: string;
  env?: [];
}

export interface Properties {
  projectName: string;
  appName: string;
  replicas?: number;
  restartPolicy?: string;
  containers: imageProps[];
}
