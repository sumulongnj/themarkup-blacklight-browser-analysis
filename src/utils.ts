import fs from "fs";
import { join } from "path";
import { getPublicSuffix, getDomain } from "tldts";
import { BlacklightEvent } from "./types";
export const getFirstPartyPs = firstPartyUri => {
  return getPublicSuffix(firstPartyUri);
};

export const isFirstParty = (firstPartyPs, testUri) => {
  return firstPartyPs === testUri;
};

const deleteFolderRecursive = function(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file) {
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

export const clearDir = outDir => {
  if (fs.existsSync(outDir)) {
    deleteFolderRecursive(outDir);
  }
  fs.mkdirSync(outDir);
};

export const loadJSONSafely = str => {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.log("couldnt load json", str);
    return {};
  }
};
export const groupBy = key => array =>
  array.reduce((objectsByKeyValue, obj) => {
    const value = obj[key];
    objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
    return objectsByKeyValue;
  }, {});

export function serializeCanvasCallMap(inputMap) {
  let obj = {};

  inputMap.forEach(function(value, key) {
    obj[key] = Array.from(value);
  });

  return obj;
}
export function mapToObj(inputMap) {
  let obj = {};

  inputMap.forEach(function(value, key) {
    obj[key] = value;
  });

  return obj;
}
// Go through the stack trace and get the first filename.
// If no fileName is found return the source of the last function in
// the trace
export const getScriptUrl = (item: BlacklightEvent) => {
  const { stack } = item;

  for (let i = 0; i < stack.length; i++) {
    if (stack[i].hasOwnProperty("fileName")) {
      return stack[i].fileName;
    } else {
      if (i === stack.length - 1) {
        return stack[i].source;
      }
    }
  }
};

export const loadEventData = (dir, filename = "inspection-log.ndjson") => {
  return fs
    .readFileSync(join(dir, filename), "utf-8")
    .split("\n")
    .filter(m => m)
    .map(m => loadJSONSafely(m));
};
// Not using this atm but leaving it in because it might be useful in the future
export const getStackType = (stack, firstPartyDomain) => {
  let hasFirstParty = false;
  let hasThirdParty = false;
  stack.forEach(s => {
    if (s.hasOwnProperty("fileName")) {
      const scriptDomain = getDomain(s.fileName);
      if (scriptDomain === firstPartyDomain) {
        hasFirstParty = true;
      } else {
        hasThirdParty = true;
      }
    }
  });
  if (hasFirstParty && !hasThirdParty) {
    return "first-party-only";
  } else if (hasThirdParty && !hasFirstParty) {
    return "third-party-only";
  } else {
    return "mixed";
  }
};
export function isBase64(str) {
  if (str === "" || str.trim() === "") {
    return false;
  }
  try {
    return btoa(atob(str)) == str;
  } catch (err) {
    return false;
  }
}
