"use strict";
var path = require('path'),
fs  =  require('fs'),
PPTX = require('nodejs-pptx');
var v,d,onlyQA;
var EXT = {
    "linkcheck": ".linkcheck.md",
    "qa": ".qa.md",
    "out": ".out.md",
    "ref": ".ref.md"
};
exports.EXT = EXT;


exports.add = function(manifestJSON, relPathManifest, verbose,debug,qaContent){
    v = verbose || false;
    d = debug || false;
    onlyQA = qaContent || false;
    var inputJSON = manifestJSON.input;
    var outputFileStr = relPathManifest +"/"+ manifestJSON.output;
    var outputLinkcheckFileStr = outputFileStr.replace(".md",EXT.linkcheck);
    var qaRegex;
    if(onlyQA) qaRegex = new RegExp(manifestJSON.qa.exclude);
    if(onlyQA && v) console.log("QA exclude regex: " + qaRegex);

    var pptx = new PPTX.Composer();

    //Iterate through all of the input files in manifest apply options
    var fileArr= [];
    var refFileArr= [];
    Object.keys(inputJSON).forEach(function(inputKey) {
        var inputFileStr = relPathManifest +"/"+ inputKey;
        console.log("*********"+inputFileStr+"*********");

        if(onlyQA && qaRegex.test(inputFileStr)){
            console.warn("Skipping " +inputKey + " for QA");
            return;
        } 
        if (!fs.existsSync(inputFileStr)){
            console.warn(inputKey + " does not exist. Skipping.");
            return;
        }  
        
        //TODO
        await pptx.load(`./existing.pptx`); // load a pre-existing PPTX
        await pptx.compose(async pres => {
        let slide = pres.getSlide(5);
        slide.moveTo(2);
        });
    });

    console.log("++++++++++++++++++++")
    //Merge lists and output single markdown file
    var mergedFileArr = fileArr.concat(refFileArr);
    
    console.log("List of files to merge:\n    " + mergedFileArr.join("\n    "));
    if(onlyQA){
        createSingleFile(mergedFileArr, outputFileStr.replace(".md",EXT.qa));    
    } else {
        createSingleFile(mergedFileArr, outputFileStr);
    }

    //Remove temp files
    findFiles('./',/\.temp$/,function(tempFilename){
        fs.unlinkSync(tempFilename);
    });
}


// Helper method to find all .temp files and do something with them
function findFiles(startPath,filter,callback){
    if (!fs.existsSync(startPath)){
        console.log("no dir ",startPath);
        return;
    }
    var files=fs.readdirSync(startPath);
    for(var i=0;i<files.length;i++){
        var filename=path.join(startPath,files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()){
            findFiles(filename,filter,callback); //recurse
        }
        else if (filter.test(filename)) callback(filename);
    };
}