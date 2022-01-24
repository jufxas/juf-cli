#! /usr/bin/env node

// https://dev.to/rushankhan1/build-a-cli-with-node-js-4jbi
// https://devhints.io/yargs


function codeFixer(Code) {
  let code = Code 
  let splitCode = code.split("\n")
  let lookFor = []
  for (let i = 0; i < splitCode.length; i++) {
    if (splitCode[i].includes("require")) {
      let splitMore = splitCode[i].split(" ")
      lookFor.push(splitMore[1])
    } else if (splitCode[i].includes("exports.") && splitCode[i].includes(" = {")) { // edge case 
      splitCode[i] = splitCode[i].replace("exports.","const ")
    }
  }
  splitCode = splitCode.filter(x => !x.includes("exports") && !x.includes("require"))
  code = splitCode.join("\n")
  for (const word in lookFor) {
    code = code.replace(new RegExp(lookFor[word] + ".","g"),"")
  }
  return code
}

/* 
**
**
**
*/

const yargs = require("yargs"); 
const usage = "\nUsage: juf -f <Optional: -r> <file name without dot, e.g., main>";
const fs = require("fs")
const cwd = process.cwd()

// juf --help 
const options = yargs  
      .usage(usage)  
      .options({
        "f": {
            alias:"fix", 
            describe: "Fixes a compiled javascript file so its compatible with javascript. This requires a ts-utils folder (with typescript & its compiled javascript) and a utils folder (only has the web compatible javascript). \nExample: juf -fix rgba\nEntering this command will make it search for ./ts-utils/rgba.js, fix it, then write the fixed version to ./utils/rgba.js. if -r flag is added, ./ts-utils/rgba.js is removed.\nNOTE: in the utils folder, a line with `//jufSAVE` alone MUST be present. That and every line under it will be saved when the command is ran.", 
            type: "boolean", 
            demandOption: false, 
        },
        "r": {
            alias:"remove", 
            describe: "Paired with -f, it also removes the compiled javascript file.", 
            type: "boolean", 
            demandOption: false, 
        },
      })      
      .help(true)  
      .argv;

// console.log(yargs.argv)


if (yargs.argv.f || yargs.argv.fix) {
    // console.log(yargs.argv._)

    let keyword = yargs.argv._[0]
    let compiledJavascriptDir = cwd + "/ts-utils/" + keyword + ".js"
    let jsUtilsJsDir = cwd + "/utils/" + keyword + ".js"

    fs.readFile(compiledJavascriptDir, "utf8", (err, data) => {
        if (err) throw err 
        let fixedJs = codeFixer(data)

        fs.readFile(jsUtilsJsDir, "utf8", (err, data) => {
          if (err) throw err 
          let dataToSave = []
          let previousJs = data.split("\n")
          let saveData = false 

          for (const line of previousJs) {
            if (line.trim() === "//jufSAVE") saveData = true 
            if (saveData) dataToSave.push(line)
          }

          if (!saveData) throw `//jufSAVE was not found anywhere in ${jsUtilsJsDir}. This is a requirement.`
          dataToSave = dataToSave.join("\n")


          fs.writeFile(jsUtilsJsDir, fixedJs + "\n" + dataToSave, (err) => {
            if (err) throw err
          })

        })

        

    })

   // intentional nesting since i didn't want you to be able to just remove files without fixing first
    if (yargs.argv.r || yargs.argv.remove)  {
        let keyword = yargs.argv._[0]
        let compiledJavascriptDir = cwd + "/ts-utils/" + keyword + ".js"
        fs.unlink(compiledJavascriptDir, (err) => {
            if (err) throw err
        })
    }

}
