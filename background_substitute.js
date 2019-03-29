(function () {

/**
 * FROM https://gist.github.com/Rob--W/9654450
 *
 * Implementation example of writable response bodies.
 * Based on the draft of the Streams API (19 March 2014)
 *   https://dvcs.w3.org/hg/streams-api/raw-file/tip/Overview.htm
 * Design document for response body reading/writing:
 *   https://docs.google.com/document/d/1iE6M-YSmPtMOsec7pR-ILWveQie8JQQXTm15JKEcUT8
 */
/* globals chrome, ByteStream, URL, XMLHttpRequest */
'use strict';

const console = chrome.extension.getBackgroundPage().console;

// The extension will create a writable stream and store it in this dict
// until the response body is available.
var outStreams = {};

console.log("ByteStream", typeof ByteStream);
console.log("ReadableStream", typeof ReadableStream);

// Capture all response bodies.
chrome.webRequest.onHeadersReceived.addListener(function(details) {
    var mimeType = extractMimeTypeFromHeaders(details.responseHeaders);
    var newStream = new ReadableStream(mimeType);
    // Remember stream for later
    outStreams[details.requestId] = newStream;

    const github = details.url.indexOf("github") >= 0;
    if (!github) {
        return {cancel: false};
    }
    console.log("onHeadersReceived details", details);
    console.log("webkitURL", webkitURL);
    console.log("newStream", newStream);
    //console.log("webkitURL.createObjectURL", typeof webkitURL.createObjectURL);
    //const objUrl = webkitURL.createObjectURL(newStream);
    //console.log("objUrl", typeof objUrl);
    return {
        //captureStream: true,
        //redirectUrl: objUrl
    };
}, {
    types: ['main_frame', 'sub_frame', 'xmlhttprequest'],
    urls: ['*://*/*']
}, ['blocking', 'responseHeaders']);

// Handle receipt of the stream data
chrome.webRequest.onResponseStarted.addListener(function(details) {
    // Move stream from dict to local variable
    var outStream = outStreams[details.requestId];
    delete outStreams[details.requestId];
    var inStreamUrl = details.streamUrl;

    console.log("onResponseStarted details", details);

    if (!inStreamUrl || !outStream) {
        // Either of the required parameters are missing, clean up and exit.
        if (inStreamUrl)
            URL.revokeObjectURL(inStreamUrl);
        if (outStream)
            outStream.writeAbort();
        return;
    }

    // Get the stream of the response body
    var stream;
    var x = new XMLHttpRequest();
    x.open('get', inStreamUrl);
    x.responseType = 'stream';
    x.onload = function() {
        // Get stream of response body as text.
        stream = x.response;
        stream.readBytesAs = 'text';
        collectAndWrite();
    };
    x.onerror = handleFailure;
    x.send();

    // Method to drain the input stream (received response body) and write to
    // the output stream (response body passed passed back to the browser)
    function collectAndWrite() {
        outStream.awaitSpaceAvailable().then(function() {
            stream.read().then(function(result) {
                if (result.eof) {
                    outStream.writeClose();
                } else {
                    var data = result.data;
                    // Do something with data... e.g. convert to uppercase.
                    data = data.toUpperCase();
                    outStream.write(data).then(collectAndWrite, handleFailure);
                }
            }, handleFailure);
        }, handleFailure);
    }
    // Catch-all for errors.
    function handleFailure() {
        if (stream) stream.readAbort();
        outStream.writeAbort();
    }
}, {
    types: ['main_frame', 'sub_frame', 'xmlhttprequest'],
    urls: ['*://*/*']
});

// Handle network errors

// chrome.webRequest.onErrorOccurred.addListener(function(details) {
//     var outStream = outStreams[details.requestId];
//     if (outStream) {
//         delete outStreams[details.requestId];
//         outStream.writeAbort();
//     }
// });

function extractMimeTypeFromHeaders(headers) {
    for (var i = 0; i < headers.length; ++i) {
        var header = headers[i];
        if (header.name.toLowerCase() === 'content-type') {
            return header.value.split(';')[0];
        }
    }
    return 'text/plain';
}

}());