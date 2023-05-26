# Deployment-File-Generator (dfg)

Generates kubernetes deployments file for application.
> *Note: Currently its generates only basic deploymet files*

Build project:
```bash
npm run build
```
Generate files:
```bash
npm run start:dfg <input-file>.json
```
It will create following files:
- 	**deployment.yaml**
- 	**configmap.yaml**
- 	**secret.yaml**
- 	**service.yaml**



Input file example:

**input.json**
```json
{
  "appName": "orders",
  "projectName": "micro-shop",
  "replicas": 1,                          //optional
  "restartPolicy": "Always",              //optional

  "containers": [
    {
      "image": "order:latest",
      "memory": "128mi",
      "cpu": "500M",
      "ports": [3000],
      "env": {
        "config": [
          {
            "name": "DATABASE_USER",
            "value": "root"
          },
          {
            "name": "DATABASE_NAME",
            "value": "Admin"
          }
        ],
        "secret": [
          {
            "name": "DATABASE_PASSWORD",
            "value": "password"
          }
        ]
      }
    }
  ]
}
```