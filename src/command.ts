import { TemplateBuilder } from "./components";
import fs from "fs";

var args = process.argv.splice(2);

if(args[0]&&(args[0].split(".")[1].toLowerCase()=="json")){
    const data :any = JSON.parse(fs.readFileSync(args[0], "utf-8"));

    let tmp = new TemplateBuilder("app/v1");
    tmp.setProps(data);
    
    tmp.toYamlFile(".");
    console.log(`Deployment files are generated for "${data.appName}"`)
}
else{
    console.log("Please provide json file : npm run start:generator <your-file.json>")
}

