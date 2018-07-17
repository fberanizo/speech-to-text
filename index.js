"use strict";

const path = require("path");
const speech = require("@google-cloud/speech");
const dojot = require("@dojot/flow-node");


class DataHandler extends dojot.DataHandlerBase {
    constructor() {
        super();
        this.streams = {};
    }

    /**
     * Returns full path to html file
     * @return {string} String with the path to the node representation file
     */
    getNodeRepresentationPath() {
        return path.resolve(__dirname, "speech-to-text.html");
    }

    /**
     * Returns node metadata information
     * This may be used by orchestrator as a liveliness check
     * @return {object} Metadata object
     */
    getMetadata() {
        return {
            "id": "google/speech-to-text",
            "name": "speech-to-text",
            "module": "speech-to-text",
            "version": "1.0.0",
        }
    }

    /**
     * Returns object with locale data (for the given locale)
     * @param  {[string]} locale Locale string, such as "en-US"
     * @return {[object]}        Locale settings used by the module
     */
    getLocaleData(locale) {
        return {}
    }

    /**
     * Statelessly handle a single given message, using given node configuration parameters
     *
     * This method should perform all computation required by the node, transforming its inputs
     * into outputs. When such processing is done, the node should issue a call to the provided
     * callback, notifying either failure to process the message with given config, or the set
     * of transformed messages to be sent to the flow"s next hop.
     *
     * @param  {[type]}       config   Node configuration to be used for this message
     * @param  {[type]}       message  Message to be processed
     * @param  {Function}     callback Callback to call upon processing completion
     * @return {[undefined]}
     */
    handleMessage(config, message, callback) {
        try {
            // The audio sample to detect speecj
            let audio = "";
            switch (config.audioType) {
                case "str":
                    audio = config.audio;
                    break;
                case "msg":
                    audio = this._get(config.audio, message);
                    break;
                default:
                    return callback(new Error("Invalid audio type: " + config.audioType));
            }

            if (this.streams[config.name] === undefined) {
                this.streams[config.name] = {stream: null, responses: []};
                const client = new speech.SpeechClient({
                    credentials: {
                        client_email: config._credentials_client_email,
                        private_key: config._credentials_private_key
                    },
                    projectId: config._credentials_project_id
                });

                const request = {
                    "audio": {
                        content: audio,
                    },
                    "config": {
                        encoding: config.audioEncoding,
                        sampleRateHertz: parseInt(config.sampleRate),
                        languageCode: config.languageCode,
                    },
                    "interimResults": false
                };

                this.streams[config.name].stream = client.streamingRecognize(request).on("data", response => {
                    // enqueues the response
                    this.streams[config.name].responses.push(response);
                }).on("error", err => {
                    delete this.streams[config.name];
                    return callback(err);
                });
            }

            this.streams[config.name].stream.write(request);

            if (this.streams[config.name].responses.length > 0) {
                // dequeues the response
                let response = this.streams[config.name].responses.shift();
                this._set(config.response, response, message);
            }

            return callback(undefined, [message]);

        } catch (err) {
            delete this.streams[config.name];
            return callback(err);
        }
    }
}
const main = new dojot.DojotHandler(new DataHandler());
main.init();
