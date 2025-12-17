import { redBright, cyan, dim, magentaBright, yellow } from "yoctocolors";

function getLogger(type) {
    return (message) => 
        console.log(`${type}${dim(":")} ${message}`); 
}

export default {
    info: getLogger(cyan("INFO")),
    error: getLogger(redBright("ERROR")),
    step: getLogger(magentaBright("STEP")),
    warn: getLogger(yellow("WARN")),
}