var _urlQueryParamsHash = { };
var _urlLocation = new String(document.location);  // copy so that original isn't modified
if (/\?/.test(_urlLocation)) {
    // Remove everything up to and including the '?'
    _urlLocation = _urlLocation.replace(/^.*\?/, "");

    // Separate the key/value pairs
    var _urlParams = _urlLocation.split("&");

    // For each key/value pair, store in lookup hash
    for (var i = 0; i < _urlParams.length; ++i) {
        var _urlParamPair = _urlParams[i].split("=");
        _urlQueryParamsHash[_urlParamPair[0]] = _urlParamPair[1];
    }
}

function getQueryParam(paramName) {
    return _urlQueryParamsHash[paramName];
}
