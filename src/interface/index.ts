export interface Env {
  name: string;
  value: string;
}

export interface EvnProps {
  config?: Env[];
  secret?: Env[];
}

export interface ImageProps {
  name?: string;
  image: string;
  ports?: number[];
  imagePullPolicy?: string;
  memory?: string;
  cpu?: string;
  env?: EvnProps;
}

export interface Properties {
  projectName: string;
  appName: string;
  replicas?: number;
  restartPolicy?: string;
  containers: ImageProps[];
}
