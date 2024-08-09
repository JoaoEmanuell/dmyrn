const URL = require("./__REACT_NATIVE_YTDL_CUSTOM_MODULES__/url").URL;
const querystring = require('querystring');
const Cache = require('./cache');
const utils = require('./utils');
const { Logger } = require("../../../utils/log");

// A shared cache to keep track of html5player js functions.
exports.cache = new Cache();

/**
 * Extract signature deciphering and n parameter transform functions from html5player file.
 *
 * @param {string} html5playerfile
 * @param {Object} options
 * @returns {Promise<Array.<string>>}
 */
exports.getFunctions = (html5playerfile, options) => exports.cache.getOrSet(html5playerfile, async() => {
  const body = await utils.exposedMiniget(html5playerfile, options).text();
  const functions = exports.extractFunctions(body);
  if (!functions || !functions.length) {
    throw Error('Could not extract functions');
  }
  exports.cache.set(html5playerfile, functions);
  return functions;
});

/**
 * Extracts the actions that should be taken to decipher a signature
 * and tranform the n parameter
 *
 * @param {string} body
 * @returns {Array.<string>}
 */
exports.extractFunctions = body => {
  const functions = [];
  const extractManipulations = caller => {
    const functionName = utils.between(caller, `a=a.split("");`, `.`);
    if (!functionName) return '';
    const functionStart = `var ${functionName}={`;
    const ndx = body.indexOf(functionStart);
    if (ndx < 0) return '';
    const subBody = body.slice(ndx + functionStart.length - 1);
    return `var ${functionName}=${utils.cutAfterJS(subBody)}`;
  };
  const extractDecipher = () => {
    const functionName = utils.between(body, `a.set("alr","yes");c&&(c=`, `(decodeURIC`);
    if (functionName && functionName.length) {
      const functionStart = `${functionName}=function(a)`;
      const ndx = body.indexOf(functionStart);
      if (ndx >= 0) {
        const subBody = body.slice(ndx + functionStart.length);
        let functionBody = `var ${functionStart}${utils.cutAfterJS(subBody)}`;
        functionBody = `${extractManipulations(functionBody)};${functionBody};return ${functionName}(sig);`;
        functions.push(functionBody);
      }
    }
  };
  const extractNCode = () => {
    // adapted from https://github.com/fent/node-ytdl-core/issues/1301#issuecomment-2265135782
    const alphanum = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTVUWXYZ.$_0123456789';
    let functionName = '';
    let clue = body.indexOf('enhanced_except');
    if (clue < 0) clue = body.indexOf('String.prototype.split.call(a,"")');
    if (clue < 0) clue = body.indexOf('Array.prototype.join.call(b,"")');
    if (clue > 0) {
        let nstart = body.lastIndexOf('=function(a){', clue) - 1;
        while (nstart && alphanum.includes(body.charAt(nstart))) {
	    functionName = body.charAt(nstart) + functionName;
	    nstart--;
        }
    }
    if (functionName && functionName.length) {
      const functionStart = `${functionName}=function(a)`;
      const ndx = body.indexOf(functionStart);
      if (ndx >= 0) {
        const subBody = body.slice(ndx + functionStart.length);
        const functionBody = `var ${functionStart}${utils.cutAfterJS(subBody)};return ${functionName}(ncode);`;
        functions.push(functionBody)
      }
    }
  };
  extractDecipher();
  extractNCode();
  return functions;
};

/**
 * Apply decipher and n-transform to individual format
 *
 * @param {Object} format
 * @param {vm.Script} decipherScript
 * @param {vm.Script} nTransformScript
 */
exports.setDownloadURL = (format, decipherScript, nTransformScript) => {
  const decipher = url => {
    const args = querystring.parse(url);
    // Logger.debug(`setDownloadURL decipher args ${args}`);
    // Logger.debug(`args s ${args.s}`);
    if (!args.s || !decipherScript) return args.url;
    const components = new URL(decodeURIComponent(args.url));
    // Logger.debug(`setDownloadURL decipher components ${components}`);
    // const sig = decipherCodeFunction(decodeURIComponent(args.s))
    const sig = decipherScript(decodeURIComponent(args.s))
    // Logger.debug(`sig: ${sig}`);
    components.searchParams.set(args.sp ? args.sp : 'signature', sig)
    // Logger.debug(`setDownloadURL decipher components search ${components.toString()}`);
    return components.toString();
  };
  const ncode = url => {
    const components = new URL(decodeURIComponent(url));
    const n = components.searchParams.get('n');
    if (!n || !nTransformScript) return url;
    const ncodeObject = nTransformScript(n)
    components.searchParams.set('n', ncodeObject);
    return components.toString();
  };
  const cipher = !format.url;
  const url = format.url || format.signatureCipher || format.cipher;
  format.url = cipher ? ncode(decipher(url)) : ncode(url);
  // Logger.debug(`URL: ${format.url}`)
  delete format.signatureCipher;
  delete format.cipher;
};

/**
 * Applies decipher and n parameter transforms to all format URL's.
 *
 * @param {Array.<Object>} formats
 * @param {string} html5player
 * @param {Object} options
 */
exports.decipherFormats = async(formats, html5player, options) => {
  let decipheredFormats = {};
  let functions = await exports.getFunctions(html5player, options);
  // get the functions and transform in a javascript function, modified the html5player functions to add a return for main function in code.
  const decipherScript = functions.length ? new Function('sig', functions[0]) : null;
  const nTransformScript = functions.length > 1 ? new Function('ncode', functions[1]) : null;

  if (__DEV__) {
    // used to update the scripts
    Logger.debug("Sig scripts: ");
    Logger.debug("decipherScript");
    Logger.debug(decipherScript ? 'Decipher extraction work with success' : 'erro to extract decipher script');
    Logger.debug("nTransformScript");
    Logger.debug(nTransformScript ? 'nTransform extraction work with success' : 'erro to extract nTransform script');
  }
  
  formats.forEach(format => {
    exports.setDownloadURL(format, decipherScript, nTransformScript);
    decipheredFormats[format.url] = format;
  });

  return decipheredFormats;
};