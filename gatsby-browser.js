
/** This file is where Gatsby expects to find any usage of the Gatsby browser APIs (if any). 
 * These allow customization/extension of default Gatsby settings affecting the browser.
 * 
 * @category Gatsby

 */

import wrapWithProvider from "./wrap-with-provider";

/**
 * @function onRouteUpdate
 * @param {string} prevLocation ???
 * @returns {string} the pathname of the previous location or null
 */
export const onRouteUpdate = ({ prevLocation }) => {
  window.PREVIOUS_PATH = prevLocation ? prevLocation.pathname : null;
};

export /** @type {*} */
  const wrapRootElement = wrapWithProvider;
