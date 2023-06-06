import YAML from "yaml";
import fs from "fs";

export function generateYAMLFiles(path: string, content) {
  const doc = new YAML.Document();
  let _jsonObj = JSON.parse(JSON.stringify(content));
  doc.contents = _jsonObj;
  fs.writeFileSync(`${path}`, doc.toString());
}
