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
            describe: "Fixes a compiled javascript file so its compatible with javascript. This requires a ts-utils folder (with typescript & its compiled javascript) and a utils folder (only has the web compatible javascript). \nExample: juf -fix rgba\nEntering this command will make it search for ./ts-utils/rgba.js, fix it, then write the fixed version to ./utils/rgba.js. if -r flag is added, ./ts-utils/rgba.js is removed.\nIf you want to select a file nested within a directory, simply type 'directory/fileName' and the code will select 'ts-utils/directory/fileName.js' and 'utils/fileName.js' \nNOTE: in the utils folder, a line with `//jufSAVE` alone MUST be present. That and every line under it will be saved when the command is ran.", 
            type: "boolean", 
            demandOption: false, 
        },
        "r": {
            alias:"remove", 
            describe: "Paired with -f, it also removes the compiled javascript file.", 
            type: "boolean", 
            demandOption: false, 
        },
        "w": {
          alias:"wipe", 
          describe: "Removes all the auto-compiled javascript files in ./ts-utils; More accurately, it removes/unlinks all the files ending in .js. Folders nested within /ts-utils that end with .js will also get targeted for deletion.",
          type: "boolean", 
          demandOption: false, 
        }
      })      
      .help(true)  
      .argv;

// console.log(yargs.argv)


if (yargs.argv.f || yargs.argv.fix) {
    // console.log(yargs.argv._)

    let keyword = yargs.argv._[0]
    let compiledJavascriptDir = cwd + "/ts-utils/" + keyword + ".js"
    let jsUtilsJsDir = cwd + "/utils/" + keyword + ".js"
    if (keyword.includes("/")) {
      let splitKeyword = keyword.split("/")
      jsUtilsJsDir = cwd + "/utils/" + splitKeyword[splitKeyword.length - 1] + ".js"
    }

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

if (yargs.argv.w || yargs.argv.wipe) {
    let tsUtilsDir = cwd + "/ts-utils/"

    unlinkAllJsInFolder(tsUtilsDir)

}

function unlinkAllJsInFolder(dir) {

  fs.readdir(dir, (err, files) => {
    if (err) throw err 
    
    // console.log("DIR:" + dir)
    // console.log("FILES: " + files.join(" "))

    for (const file of files)  {
      if (file.includes(".js")) {
        fs.unlink(dir + file, (err) => {
          if (err) throw err
        })

      }
      else if (!file.includes(".")) {
        // console.log("recursive " + file)
        unlinkAllJsInFolder(dir + file + "/")
      }
    }
  })


}