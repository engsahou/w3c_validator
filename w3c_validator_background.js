// proxy parameters
// https://github.com/monojp/w3c_proxy
var content_type = "Content-Type: text/html";
// user configurable params (TODO: create user config page)
var proxy_url = "http://validator.herndl.org/";
var url = "https://validator.w3.org/nu/";

// validator parameters
// https://github.com/validator/validator/wiki/Service:-Common-parameters;
var out = "json"
// user configurable params (TODO: create user config page)
var showsource = "yes";
var level = "";
var nsfilter = "";
var schema = "";
var laxtype = "yes";
var parser = "none";
var asciiquotes = "yes";
var callback = "";

// show pageAction only if this regex validates for the document url
var regex_tab_url = /http(s){0,1}:\/\/.*/g;

// animation helpers
var page_action_animate_id = null;
var page_action_animate_count = 0;
var page_action_animation_interval = 100;
function page_action_animate_start(tabId) {
	page_action_animate_id = setInterval(function() {
		chrome.pageAction.setIcon({path: "icons/loader/frame_" + page_action_animate_count
				+ ".png", tabId: tabId});
		page_action_animate_count++;
		if (page_action_animate_count > 8) {
			page_action_animate_count = 0;
		}
	}, page_action_animation_interval);
}
function page_action_animate_stop(tabId) {
	// clear interval and set default icon
	clearInterval(page_action_animate_id);
	chrome.pageAction.setIcon({path: {
		"19": "icons/icon19.png",
		"38": "icons/icon38.png",
	}, tabId: tabId});
}

// validation helper that queries the proxy via AJAX and sends the response to the content script
function validate(data, tabId) {
	var xhr = new XMLHttpRequest();

	xhr.open("POST", proxy_url + "?url=" + encodeURIComponent(url) + "&content_type="
			+ encodeURIComponent(content_type) + "&out=" + encodeURIComponent(out)
			+ "&showsource=" + encodeURIComponent(showsource) + "&level="
			+ encodeURIComponent(level) + "&nsfilter=" + encodeURIComponent(nsfilter) + "&schema="
			+ encodeURIComponent(schema) + "&laxtype=" + encodeURIComponent(laxtype) + "&parser="
			+ encodeURIComponent(parser) + "&asciiquotes=" + encodeURIComponent(asciiquotes)
			+ "&callback=" + encodeURIComponent(callback));

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.status == 200) {
				page_action_animate_stop(tabId);
				chrome.tabs.sendMessage(tabId, { action: "validate_response",
						response: xhr.responseText});
			} else {
				page_action_animate_stop(tabId);
				console.error("Error: %s (%i)", "Unexpected response", xhr.status);
			}
		}
	}

	xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xhr.send("data=" + encodeURIComponent(data));
	page_action_animate_start(tabId);
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (changeInfo.status == "complete" && regex_tab_url.exec(tab.url)) {
		chrome.pageAction.show(tabId);
	}
});

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	if (typeof tabs[0] != "undefined" && regex_tab_url.exec(tabs[0].url)) {
		chrome.pageAction.show(tabs[0].id);
	}
});

chrome.pageAction.onClicked.addListener(function(tab) {
	chrome.tabs.sendMessage(tab.id, { action: "validate" }, function(html) {
		validate(html, tab.id);
	});
});