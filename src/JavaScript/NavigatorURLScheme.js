/*
 | Copyright 2016 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
define([
    "dojo/_base/array",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "esri/lang"
], function (
    array,
    declare,
    lang,
    esriLang
) {

    //========================================================================================================================//

    return declare([], {

        _version: "1.0",
        _product: "arcgis-navigator",
        _paramPrefix: "://",

        _stops: [],          // collection of (name + lat,lon in WGS84 decimal degrees) and/or (name + geocodeable address)
        _callback: {
            url: location.href,
            prompt: null
        },

        _start: null,        // start in "stop" format; defaults to current position
        _navigate: null,     // defaults to false
        _optimize: null,     // defaults to app setting
        _travelMode: null,   // defaults to map's default travel mode

        _lastStatus: "",

        //--------------------------------------------------------------------------------------------------------------------//


        /**
         * Encapsulates the construction of an applink.
         * @constructor
         * @class
         * @name NavigatorURLScheme
         * @classdesc
         * @param {object} [config] Library configuration; its only parameter is the optional callbackPrompt string
         */
        constructor: function (config) {
            if (config && config.callbackPrompt) {
                this.setCallbackPrompt(config.callbackPrompt);
            }
        },

        /**
         * Sets the prompt for the destination app's link back.
         * @param {string} prompt The string to use in the link
         * @memberOf NavigatorURLScheme#
         */
        setCallbackPrompt: function (prompt) {
            this._callback.prompt = prompt;
        },

        /**
         * Sets the URL for the destination app's link back.
         * @param {string} url The URL to use; library defaults to location.href
         * @memberOf NavigatorURLScheme#
         */
        setCallbackURL: function (url) {
            this._callback.url = url;
        },

        /**
         * Sets the starting location for the navigation.
         * @param {object|null} start Starting location in the stop format: {[name,] latitude, longitude} or
         *                 {[name,] address} (or null to use the default start--the current position);
         *                 latitude & longitude are in decimal degrees; address is a string; name is optional
         * @memberOf NavigatorURLScheme#
         */
        setStart: function (start) {
            this._start = start;
        },

        /**
         * Adds a stop for the navigation; stops are visited in the order added.
         * @param {object} stop Location in the stop format: {[name,] latitude, longitude} or
         *                 {[name,] address} (or null to use the default start--the current position);
         *                 latitude & longitude are in decimal degrees; address is a string; name is optional
         * @memberOf NavigatorURLScheme#
         */
        addStop: function (stop) {
            this._stops.push(stop);
        },

        /**
         * Removes all navigation stops, including the final destination.
         * @memberOf NavigatorURLScheme#
         */
        clearStops: function () {
            this._stops = [];
        },

        /**
         * Sets one or more of the options.
         * @param {object} options Structure containing one or more of the attributes travelmode, optimize, navigate;
         *                 travelmode is a string with a mode keyword or null to use map's default travel mode;
         *                 optimize is a nullable boolean indicating if the route is to be optimized, where null
         *                 defaults to app setting; navigate is a boolean indicating if navigation should commence
         *                 when Navigator opens up, where null is the same as false; initial values for all three
         *                 are null; options omitted from this argument are not changed
         *                 Available travel modes are "Driving Time", "Driving Distance", "Trucking Time",
         *                 "Trucking Distance", "Walking Time", "Walking Distance", "Rural Driving Time",
         *                 "Rural Driving Distance"
         * @memberOf NavigatorURLScheme#
         */
        setOptions: function (options) {
            if (esriLang.isDefined(options)) {
                if (options.hasOwnProperty("travelmode")) {
                    this._travelmode = options.travelmode;
                }
                if (options.hasOwnProperty("optimize")) {
                    this._optimize = options.optimize;
                }
                if (options.hasOwnProperty("navigate")) {
                    this._navigate = options.navigate;
                }
            }
        },

        /**
         * Generates the URL encapsulating the request.
         * @return {string|null} Generated url or null in case either no stops were defined or the payload
         * could not be constructed; for null case, reason can be retrieved by calling getLastStatus()
         * @memberOf NavigatorURLScheme#
         */
        getURL: function () {
            var url = null, urlParams = "";
            this._lastStatus = "";

            if (this._stops.length > 0) {
                // Add required parameters
                array.forEach(this._stops, lang.hitch(this, function (stop) {
                    urlParams += this._addStopParam("stop", stop);
                }));

                // Add optional parameters
                if (esriLang.isDefined(this._start)) {
                    urlParams += this._addStopParam("start", this._start);
                }

                if (esriLang.isDefined(this._travelmode)) {
                    urlParams += "&travelmode=" + encodeURIComponent(this._travelmode);
                }
                if (esriLang.isDefined(this._optimize)) {
                    urlParams += "&optimize=" + this._optimize.toString();
                }
                if (esriLang.isDefined(this._navigate)) {
                    urlParams += "&navigate=" + this._navigate.toString();
                }

                if (esriLang.isDefined(this._callback.url)) {
                    urlParams += "&callback=" + encodeURIComponent(this._callback.url);
                }
                if (esriLang.isDefined(this._callback.prompt)) {
                    urlParams += "&callbackprompt=" + encodeURIComponent(this._callback.prompt);
                }

                // Create the applink URL after clearing first parameter separator
                try {
                    url = this._product + this._paramPrefix + urlParams.replace("&", "?");
                    this._lastStatus = "OK";
                } catch (ignore) {
                    this._lastStatus = "Unable to build payload";
                }
            } else {
                this._lastStatus = "No stops defined";
            }

            return url;
        },

        /**
         * Returns the status message from the last call to getURL.
         * @return {string} Status string
         * @memberOf NavigatorURLScheme#
         */
        getLastStatus: function () {
            return this._lastStatus;
        },

        //--------------------------------------------------------------------------------------------------------------------//

        _addStopParam: function (stopTag, stop) {
            var urlParam;

            if (esriLang.isDefined(stop.address)) {
                urlParam = "&" + stopTag + "=" + encodeURIComponent(stop.address);
            } else {
                urlParam = "&" + stopTag + "=" + stop.latitude + "," + stop.longitude;
            }
            if (esriLang.isDefined(stop.name) && stop.name.length > 0) {
                urlParam += "&" + stopTag + "name=" + encodeURIComponent(stop.name);
            }

            return urlParam;
        }

    });

    //========================================================================================================================//

});
