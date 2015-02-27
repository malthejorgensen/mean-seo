'use strict';

/*!
 * MEAN - SEO
 * Ported from https://github.com/meanjs/mean-seo
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	browser = require('./browser'),
	Cache = require('./cache');

/**
 * Module default options
 */
var defaultOptions = {
	cacheClient: 'disk',
	cacheDuration: 2 * 60 * 60 * 24 * 1000,
	cacheFolder: __dirname + '/../tmp/mean-seo/cache'
};


//
// From prerender.io: https://github.com/prerender/prerender-node/blob/master/index.js
//
// googlebot, yahoo, and bingbot are not in this list because
// we support _escaped_fragment_ and want to ensure people aren't
// penalized for cloaking.
var crawlerUserAgents = [
	// 'googlebot',
	// 'yahoo',
	// 'bingbot',
	'baiduspider',
	'facebookexternalhit',
	'twitterbot',
	'rogerbot',
	'linkedinbot',
	'embedly',
	'quora link preview',
	'showyoubot',
	'outbrain',
	'pinterest',
	'developers.google.com/+/web/snippet',
	'slackbot',
	'vkShare',
	'W3C_Validator'
];
var extensionsToIgnore = [
	'.js',
	'.css',
	'.xml',
	'.less',
	'.png',
	'.jpg',
	'.jpeg',
	'.gif',
	'.pdf',
	'.doc',
	'.txt',
	'.ico',
	'.rss',
	'.zip',
	'.mp3',
	'.rar',
	'.exe',
	'.wmv',
	'.doc',
	'.avi',
	'.ppt',
	'.mpg',
	'.mpeg',
	'.tif',
	'.wav',
	'.mov',
	'.psd',
	'.ai',
	'.xls',
	'.mp4',
	'.m4a',
	'.swf',
	'.dat',
	'.dmg',
	'.iso',
	'.flv',
	'.m4v',
	'.torrent'
];

/**
 * SEO:
 *
 * Renders static pages for crawlers
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */
module.exports = function SEO(options) {
	//Initialize local variables
	options = _.merge(defaultOptions, options || {});
	var cache = new Cache(options);
	
	return function SEO(req, res, next) {
		var escapedFragment = req.query._escaped_fragment_;

		var isBotUserAgent = false;
		var userAgent = req.headers['user-agent'];
		for (var i = 0; i < crawlerUserAgents.length; i++) {
			if (userAgent.toLowerCase().indexOf(crawlerUserAgents[i].toLowerCase()) !== -1) {
				isBotUserAgent = true;
				break;
			}
		}
		var isHTML = true;
		for (var i = 0; i < extensionsToIgnore.length; i++) {
			var extension = extensionsToIgnore[i];
			var x = req.url.indexOf(extension);
			if (x === req.url.length - extension.length) {
				isHTML = false;
				break;
			}
		}

		// If the request came from a crawler
		if (escapedFragment !== undefined || (isBotUserAgent && isHTML)) {
			var url, key;
			if (escapedFragment && escapedFragment.length > 0) {
				// If the request is in # style.
				url = req.protocol + '://' + req.get('host') + req.path + '#!/' + escapedFragment;
				// Use the escapedFragment as the key.
				key = escapedFragment;
			} else {
				// If the request is in HTML5 pushstate style.
				url = req.protocol + '://' + req.get('host') + req.originalUrl;
				// Rename key to stop Phantom from going into an infinite loop.
				url = url.replace('_escaped_fragment_', 'fragment_data');
				// Use the url as the key.
				key = url;
			}

			cache.get(key, function(err, page) {
				if (err) {
					//If not in cache crawl page
					browser.crawl(url, function(err, html) {
						if (err) {
							next(err);
						} else {
							//Save page to cache 
							cache.set(key, html, function(err, res) {
								if (err) {
									next(err);
								}
							});

							//And output the result
							res.send(html);
						}
					});
				} else {
					//If page was found in cache, output the result					
					res.send(page.content);
				}
			});
		} else {
			next();
		}
	};
};
