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
    "dojo/_base/declare",
    "dojo/json",
    "esri/lang"
], function (
    declare,
    JSON,
    esriLang
) {

    //========================================================================================================================//

    return declare([], {

        version: "1.0",
        // simulation
        //product: "arcgis-navigator.html",
        //paramPrefix: "?payload=",
        // real
        product: "arcgis-navigator",
        paramPrefix: "://?payload=",

        stops: [],          // collection of (name + lat,lon in WGS84 decimal degrees) and/or (name + geocodeable address)
        callback: {
            url: location.href,
            prompt: "Return"
        },

        start: null,        // start in "stop" format; defaults to current position
        navigate: null,     // defaults to false
        optimize: null,     // defaults to app setting
        travelMode: null,   // defaults to default travel mode if available

        lastStatus: "",

        //--------------------------------------------------------------------------------------------------------------------//


        /**
         * Encapsulates the construction of an applink.
         * @constructor
         * @class
         * @name applink_arcgis-navigator_1_0
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
         * @memberOf applink_arcgis-navigator_1_0#
         */
        setCallbackPrompt: function (prompt) {
            this.callback.prompt = prompt;
        },

        /**
         * Sets the starting location for the navigation.
         * @param {object|null} start Starting location in the stop format: {name, latitude, longitude} or
         *                 {name, address} (or null to use the default start: the current position);
         *                 latitude & longitude are in decimal degrees; address is a string
         * @memberOf applink_arcgis-navigator_1_0#
         */
        setStart: function (start) {
            this.start = start;
        },

        /**
         * Adds a stop for the navigation; stops are visited in the order added.
         * @param {object} stop Location in the stop format: {name, latitude, longitude} or {name, address};
         *                 latitude & longitude are in decimal degrees; address is a string
         * @memberOf applink_arcgis-navigator_1_0#
         */
        addStop: function (stop) {
            this.stops.push(stop);
        },

        /**
         * Removes all navigation stops, including the final destination.
         * @memberOf applink_arcgis-navigator_1_0#
         */
        clearStops: function () {
            this.stops = [];
        },

        /**
         * Sets one or more of the options.
         * @param {object} options Structure containing one or more of the attributes travelmode, optimize, navigate;
         *                 travelmode is a string with a mode keyword or null to use default travel mode if available;
         *                 optimize is a nullable boolean indicating if the route is to be optimized, where null
         *                 defaults to app setting; navigate is a boolean indicating if navigation should commence
         *                 when Navigator opens up, where null is the same as false; initial values for all three
         *                 are null; options omitted from this argument are not changed
         * @memberOf applink_arcgis-navigator_1_0#
         */
        setOptions: function (options) {
            if (esriLang.isDefined(options)) {
                if (options.hasOwnProperty("travelmode")) {
                    this.travelmode = options.travelmode;
                }
                if (options.hasOwnProperty("optimize")) {
                    this.optimize = options.optimize;
                }
                if (options.hasOwnProperty("navigate")) {
                    this.navigate = options.navigate;
                }
            }
        },

        /**
         * Generates the URL encapsulating the request.
         * @return {string|null} Generated url or null in case either no stops were defined or the payload
         * could not be converted to JSON; for null case, reason can be retrieved by calling getLastStatus()
         * @memberOf applink_arcgis-navigator_1_0#
         */
        getURL: function () {
            var url = null;
            this.lastStatus = "";

            if (this.stops.length > 0) {
                // Add required parameters
                var payload = {
                    version: this.version,
                    stops: this.stops,
                    callback: this.callback
                };

                // Add optional parameters
                if (esriLang.isDefined(this.travelmode)) {
                    payload.travelmode = this.travelmode;
                }
                if (esriLang.isDefined(this.optimize)) {
                    payload.optimize = this.optimize;
                }
                if (esriLang.isDefined(this.navigate)) {
                    payload.navigate = this.navigate;
                }
                if (esriLang.isDefined(this.start)) {
                    payload.start = this.start;
                }

                // Create the applink URL
                try {
                    url = this.product + this.paramPrefix +
                        encodeURIComponent(JSON.stringify(payload));
                    this.lastStatus = "OK";
                } catch (ignore) {
                    this.lastStatus = "Unable to build payload";
                }
            } else {
                this.lastStatus = "No stops defined";
            }

            return url;
        },

        /**
         * Returns the status message from the last call to getURL.
         * @return {string} Status string
         * @memberOf applink_arcgis-navigator_1_0#
         */
        getLastStatus: function () {
            return this.lastStatus;
        }

    });

    //========================================================================================================================//

});
