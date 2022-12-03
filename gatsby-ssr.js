/**This file is where Gatsby expects to find any usage of the Gatsby server-side rendering APIs (if any). 
 * These allow customization of default Gatsby settings affecting server-side rendering.
 * @category Gatsby
 */

import wrapWithProvider from "./wrap-with-provider";
export const wrapRootElement = wrapWithProvider;
