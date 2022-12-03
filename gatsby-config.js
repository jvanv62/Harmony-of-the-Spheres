/**This is the main configuration file for a Gatsby site. 
 * This is where you can specify information about your site (metadata) like the site title 
 * and description, which Gatsby plugins you’d like to include, etc. 
 * Check out the config docs for more detail. 
 * 
 * @category Gatsby
 */

const path = require(`path`);

module.exports = {
  siteMetadata: {
    siteUrl: "https://gravitysimulator.org",
    title: `Gravity Simulator`,
    author: `Darrell Huffman`,
    lang: `en`
  },
  plugins: [
    `gatsby-plugin-typescript`,
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-less`,
    `gatsby-transformer-json`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/src/data/`
      }
    },
    {
      resolve: `gatsby-plugin-canonical-urls`,
      options: {
        siteUrl: `https://gravitysimulator.org`
      }
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: path.join(__dirname, `src`, `images`)
      }
    },
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-advanced-sitemap`,
    `gatsby-plugin-robots-txt`
  ]
};
