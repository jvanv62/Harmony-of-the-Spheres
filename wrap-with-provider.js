/** takes an element and makes it an object?? 
 *  Used by gatsby-ssr and gatsby-browser
 * @category Gatsby
*/

import React from "react";
import { Provider } from "react-redux";
import createStore from "./src/state/store";

/** sets up a provider to wrap something 
 * calls createStore
 * @returns html with Provider whose store contains the element
 */
export default ({ element }) => {
  const store = createStore;

  return <Provider store={store}>{element}</Provider>;
};
