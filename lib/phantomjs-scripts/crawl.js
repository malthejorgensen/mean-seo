'use strict';

/**
 * Module dependencies
 */
var page = require("webpage").create(),
	system = require('system'),
	url = system.args[system.args.length - 1];

/**
 * PhantomJS script
 */
page.open(url, function(status) {
	// If PhantomJS successfully crawled
	if (status !== "success") {
		console.log("===! Unable to access network\n");
		console.log(status);
	} else {
		console.log(page.content);
	}

	// Exiting PhantomJS process
	phantom.exit();
});
