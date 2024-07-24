const URL = require("./__REACT_NATIVE_YTDL_CUSTOM_MODULES__/url").URL;
const querystring = require('querystring');
const Cache = require('./cache');
const utils = require('./utils');

// A shared cache to keep track of html5player js functions.
exports.cache = new Cache();

const matchRegex = (regex, str) => {
  const match = str.match(new RegExp(regex, 's'));
  if (!match) throw new Error(`Could not match ${regex}`);
  return match;
};

const matchFirst = (regex, str) => matchRegex(regex, str)[0];

const N_TRANSFORM_REGEXP = 'function\\(\\s*(\\w+)\\s*\\)\\s*\\{' +
'var\\s*(\\w+)=(?:\\1\\.split\\(""\\)|String\\.prototype\\.split\\.call\\(\\1,""\\)),' +
'\\s*(\\w+)=(\\[.*?]);\\s*\\3\\[\\d+]' +
'(.*?try)(\\{.*?})catch\\(\\s*(\\w+)\\s*\\)\\s*\\' +
'{\\s*return"enhanced_except_([A-z0-9-]+)"\\s*\\+\\s*\\1\\s*}' +
'\\s*return\\s*(\\2\\.join\\(""\\)|Array\\.prototype\\.join\\.call\\(\\2,""\\))};';

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
        functionBody = `${extractManipulations(functionBody)};${functionBody};${functionName}(sig);`;
        functions.push(functionBody);
      }
    }
  };
  const extractNCode = () => {
    // solved using the https://github.com/distubejs/ytdl-core/commit/3df824e57fe4ce3037a91efd124b729dea38c01f
    const nFunc = matchFirst(N_TRANSFORM_REGEXP, body);
    const N_TRANSFORM_FUNC_NAME = 'nCodeExtractor'
    const N_ARGUMENT = 'ncode'
    const resultFunc = `var ${N_TRANSFORM_FUNC_NAME}=${nFunc}`;
    const callerFunc = `return ${N_TRANSFORM_FUNC_NAME}(${N_ARGUMENT});`;
    functions.push(resultFunc + callerFunc)
    return
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
    // console.log(`setDownloadURL decipher args ${args}`);
    // console.log(`args s ${args.s}`);
    if (!args.s || !decipherScript) return args.url;
    const components = new URL(decodeURIComponent(args.url));
    // console.log(`setDownloadURL decipher components ${components}`);
    // const sig = decipherCodeFunction(decodeURIComponent(args.s))
    const sig = decipherScript(decodeURIComponent(args.s))
    // console.log(`sig: ${sig}`);
    components.searchParams.set(args.sp ? args.sp : 'signature', sig)
    // console.log(`setDownloadURL decipher components search ${components.toString()}`);
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
  // console.log(`URL: ${format.url}`)
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
  const decipherScript = functions.length ? new Function('sig', functions[0].replace(/(\w+)\(sig\);/g, 'return $1(sig);')) : null;
  const nTransformScript = functions.length > 1 ? new Function('ncode', functions[1]) : null;

  if (__DEV__) {
    // used to update the scripts
    console.log("Sig scripts: ");
    console.log("decipherScript");
    console.log(decipherScript ? functions[0].replace(/(\w+)\(sig\);/g, 'return $1(sig);') : 'erro to extract decipher script');
    console.log("nTransformScript");
    console.log(nTransformScript ? functions[1] : 'erro to extract nTransform script');
  }
  
  formats.forEach(format => {
    exports.setDownloadURL(format, decipherScript, nTransformScript);
    decipheredFormats[format.url] = format;
  });

  return decipheredFormats;
};