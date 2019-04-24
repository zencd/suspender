"use strict";

import {Utils, ResourceOnDemand} from '../utils.js';
import {EXT_URLS} from '../background.js';

let parkHtmlResource = null;
let parkCssResource = null;

const minifyText = (s) => Utils.stripCrLf(s).trim();

export function getParkHtmlText() {
    // XXX imported symbols aren't yet available at the root level, so creating an instance here
    parkHtmlResource = parkHtmlResource || new ResourceOnDemand(EXT_URLS.parkHtml, minifyText);
    return parkHtmlResource.get();
}

export function getParkCssText() {
    // XXX imported symbols aren't yet available at the root level, so creating an instance here
    parkCssResource = parkCssResource || new ResourceOnDemand(EXT_URLS.parkCss, minifyText);
    return parkCssResource.get();
}