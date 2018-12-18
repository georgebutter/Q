"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

/*
  Version: 0.0.4
  Author: DotDev
*/
var Q = function Q(configuration) {
  this.version = '0.0.4'; // Deafult settings

  var defaultConfig = {
    method: 'GET',
    url: null,
    dataType: '',
    data: null,
    completedAllRequestsEvent: 'Q:requestsCompleted',
    completedRequestEvent: 'Q:requestCompleted',
    failedRequestEvent: 'Q:requestFailed',
    requestStartedEvent: 'Q:requestStarted',
    errorEvent: 'Q:error'
  };
  this.config = _extends(defaultConfig, configuration);

  this.config.success = this.config.success || function success(success) {
    var successEvent = new CustomEvent(this.config.completedRequestEvent, {
      response: success
    });
    document.dispatchEvent(successEvent);
  }.bind(this);

  this.config.error = this.config.error || function error(error) {
    var errorEvent = new CustomEvent(this.config.failedRequestEvent, {
      response: error
    });
    document.dispatchEvent(errorEvent);
  }.bind(this);

  this.queue = [];
  this.processing = false;
  this.add = this.add.bind(this);
  this.process = this.process.bind(this);
};

Q.prototype.add = function addRequestToQueue(req) {
  var request = _extends({}, this.config, req);

  if (!request.url) {
    var errorEvent = new CustomEvent(this.config.errorEvent, {
      response: 'Q: No url provided'
    });
    document.dispatchEvent(errorEvent);
  }

  var defaultSuccess = this.config.success;
  var defaultError = this.config.error;
  request.success = [request.success] || [defaultSuccess];
  request.error = [request.error] || [defaultError];
  this.queue.push(request); // Check to see if the queue is already running

  if (this.processing) {
    return true;
  }

  try {
    var startedEvent = new Event(this.config.requestStarted);
    document.dispatchEvent(startedEvent);
  } catch (error) {
    var _errorEvent = new CustomEvent(this.config.errorEvent, {
      response: error
    });

    document.dispatchEvent(_errorEvent);
  }

  this.processing = false;
  this.process();
  return this.processing;
};

Q.prototype.process = function processQueue() {
  if (!this.queue.length) {
    this.processing = false;
    var completedEvent = new Event(this.config.completedAllRequestsEvent);
    document.dispatchEvent(completedEvent);
    return;
  }

  this.processing = true;
  var request = this.queue.shift();
  request.success.push(this.process);
  request.error.push(this.process);

  try {
    // jQuery.ajax(request)
    // Create the ajax request
    this.request = new XMLHttpRequest(); // Setup the success and error callbacks

    this.request.onreadystatechange = function requestStateChanged() {
      // If the request is completed
      if (this.readyState === 4) {
        // If the status code is okay
        if (this.status === 200) {
          // The response is a success
          // Execute all functions in the success array
          for (var func = 0; func < request.success.length; func += 1) {
            request.success[func](this.response);
          }
        } else {
          // The response is an error
          // Execute all functions in the error array
          for (var _func = 0; _func < request.error.length; _func += 1) {
            request.error[_func](this.response);
          }
        }
      }
    };
  } catch (error) {
    var errorEvent = new CustomEvent(this.config.errorEvent, {
      response: error
    });
    document.dispatchEvent(errorEvent);
  } // Open the request with the currect url and method


  this.request.open(request.method, request.url); // Define the response type, the default being json

  this.request.responseType = request.dataType; // Send the request

  if (_typeof(request.data) === 'object') {
    this.request.setRequestHeader('Content-Type', 'application/json');
    this.request.send(JSON.stringify(request.data));
    return request;
  }

  this.request.send(request.data);
  return request;
};

var _default = Q;
exports.default = _default;