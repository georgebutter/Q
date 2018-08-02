/*
  Version: 0.0.0
  License: MIT
*/
const Q = function Q (configuration) {
  // Deafult settings
  const defaultConfig = {
    success: null,
    error: null,
    method: 'GET',
    url: '',
    dataType: '',
    data: null
  }
  this.config = Object.assign(defaultConfig, configuration)
  this.queue = []
  this.processing = false
  this.add = this.add.bind(this)
  this.process = this.process.bind(this)
}

Q.prototype.add = function addRequestToQueue (req) {
  const request = Object.assign({}, this.config, req)
  const defaultSuccess = this.config.success || function success (success) {
    const successEvent = new CustomEvent('Q:requestCompleted', { response: success })
    document.dispatchEvent(successEvent)
  }
  const defaultError = this.config.error || function error (error) {
    const errorEvent = new CustomEvent('Q:requestFailed', { response: error })
    document.dispatchEvent(errorEvent)
  }
  request.success = [request.success] || [defaultSuccess]
  request.error = [request.error] || [defaultError]
  this.queue.push(request)

  if (this.processing) {
    return true
  }

  try {
    const startedEvent = new Event('Q:requestStarted')
    document.dispatchEvent(startedEvent)
  } catch (error) {
    const errorEvent = new CustomEvent('Q:error', { response: error })
    document.dispatchEvent(errorEvent)
    console.error('Q:' + error)
  }

  this.processing = false
  this.process()
  return this.processing
}

Q.prototype.process = function processQueue () {
  if (!this.queue.length) {
    this.processing = false
    const completedEvent = new Event('Q:requestsCompleted')
    document.dispatchEvent(completedEvent)
    return
  }
  this.processing = true
  const request = this.queue.shift()
  request.success.push(this.process)
  request.error.push(this.process)
  try {
    // jQuery.ajax(request)
    // Create the ajax request
    this.request = new XMLHttpRequest()
    // Setup the success and error callbacks
    this.request.onreadystatechange = function requestStateChanged () {
      // If the request is completed
      if (this.readyState === 4) {
        // If the status code is okay
        console.log(this.status)
        if (this.status === 200) {
          // The response is a success
          // Execute all functions in the success array
          for (let func = 0; func < request.success.length; func += 1) {
            request.success[func](this.response)
          }
        } else {
          // The response is an error
          // Execute all functions in the error array
          for (let func = 0; func < request.error.length; func += 1) {
            request.error[func](this.response)
          }
        }
      }
    }
  } catch (error) {
    const errorEvent = new CustomEvent('Q:error', { response: error })
    document.dispatchEvent(errorEvent)
    console.error('Q:' + error)
  }
  // Open the request with the currect url and method
  this.request.open(request.method, request.url)
  // Define the response type, the default being json
  this.request.responseType = request.dataType
  // Send the request
  if(typeof request.data === 'object') {
    this.request.setRequestHeader("Content-Type", "application/json")
    this.request.send(JSON.stringify(request.data))
    return request
  }
  this.request.send(request.data)
  return request
}

export {Q}
