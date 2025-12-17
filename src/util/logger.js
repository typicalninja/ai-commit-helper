import { redBright, cyan, dim, magentaBright, yellow } from "yoctocolors";

const logInFormat = (type, message) => 
    console.log(`${type}${dim(":")} ${message}`);

function getLogger(type) {
    return (message) => 
        logInFormat(type, message);
}

export default {
    info: getLogger(cyan("INFO")),
    error: getLogger(redBright("ERROR")),
    step: (message, step = "STEP") => 
        logInFormat(magentaBright(step), message),
    warn: getLogger(yellow("WARN")),
}