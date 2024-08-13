const querystring = require('querystring');
const Cache = require('./cache');
const utils = require('./utils');
const { Logger } = require("../../../utils/log");

// A shared cache to keep track of html5player js functions.
exports.cache = new Cache();

// distube sig

const matchRegex = (regex, str) => {
  // (`match: ${regex}`)
const match = str.match(new RegExp(regex, 's'));
if (!match) throw new Error(`Could not match ${regex}`);
return match;
};

const matchGroup1 = (regex, str) => matchRegex(regex, str)[1];

const N_ARGUMENT=" ncode"
const SCVR = '[a-zA-Z0-9$_]';
const FNR = `${SCVR}+`;
const AAR = '\\[(\\d+)]';
const N_TRANSFORM_NAME_REGEXPS = [
  // NewPipeExtractor regexps
  `${SCVR}+="nn"\\[\\+${
    SCVR}+\\.${SCVR}+],${
    SCVR}+=${SCVR
  }+\\.get\\(${SCVR}+\\)\\)&&\\(${
    SCVR}+=(${SCVR
  }+)\\[(\\d+)]`,
  `${SCVR}+="nn"\\[\\+${
    SCVR}+\\.${SCVR}+],${
    SCVR}+=${SCVR}+\\.get\\(${
    SCVR}+\\)\\).+\\|\\|(${SCVR
  }+)\\(""\\)`,
  `\\(${SCVR}=String\\.fromCharCode\\(110\\),${
    SCVR}=${SCVR}\\.get\\(${
    SCVR}\\)\\)&&\\(${SCVR
  }=(${FNR})(?:${AAR})?\\(${
    SCVR}\\)`,
  `\\.get\\("n"\\)\\)&&\\(${SCVR
  }=(${FNR})(?:${AAR})?\\(${
    SCVR}\\)`,
  // Skick regexps
  '(\\w+).length\\|\\|\\w+\\(""\\)',
  '\\w+.length\\|\\|(\\w+)\\(""\\)',
];

// LavaPlayer regexps
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

const getFuncName = (body, regexps) => {
  // adapted from distube
  let fn;
  for (const regex of regexps) {
    try {
      fn = matchGroup1(regex, body);
      try {
        fn = matchGroup1(`${fn.replace(/\$/g, '\\$')}=\\[([a-zA-Z0-9$\\[\\]]{2,})\\]`, body);
      } catch (err) {
        // Function name is not inside an array
      }
      break;
    } catch (err) {
      continue;
    }
  }
  if (!fn || fn.includes('[')) throw Error();
  return fn;
};

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
    // adapted from distube
    const nFuncName = getFuncName(body, N_TRANSFORM_NAME_REGEXPS);
      const funcPattern = `(${
        nFuncName.replace(/\$/g, '\\$')
      // eslint-disable-next-line max-len
      }=\\s*function([\\S\\s]*?\\}\\s*return (([\\w$]+?\\.join\\(""\\))|(Array\\.prototype\\.join\\.call\\([\\w$]+?,[\\n\\s]*(("")|(\\("",""\\)))\\)))\\s*\\}))`;
      const nTransformFunc = `var ${matchGroup1(funcPattern, body)};`;
      const callerFunc = `return ${nFuncName}(${N_ARGUMENT});`;
      functions.push(`${nTransformFunc}${callerFunc}`)
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
  let decipherScript, nTransformScript;
  try {
    decipherScript = functions.length ? new Function('sig', functions[0]) : null;
    nTransformScript = functions.length > 1 ? new Function('ncode', functions[1]) : null;
  } catch (err) {
    Logger.error(`Sig.js, error to extract the functions: ${err}\n${functions}`)
    throw "Error to extract the functions"
  }

  formats.forEach(format => {
    exports.setDownloadURL(format, decipherScript, nTransformScript);
    decipheredFormats[format.url] = format;
  });

  return decipheredFormats;
};