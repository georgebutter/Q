
const Q = function Q(configuration) {
  const configuration = config || {};
  this.queue = [];
  this.processing = false;
  this.add = this.add.bind(this);
  this.process = this.process.bind(this);
  this.defaultSuccess = configuration.success || null;
  this.defaultError = configuration.error || null;
}

Q.prototype.add = function addRequestToQueue(req) {
  const request = {};
  const defaultSuccess = this.defaultSuccess || function success(success) {
    jQuery(document).trigger('q:requestCompleted', [success]);
  }
  const defaultError = this.defaultError || function error(error) {
    jQuery(document).trigger('q:requestFailed', [error]);
  }
  request.url = req.url || '';
  request.type = req.type || 'GET';
  request.success = [req.success] || [defaultSuccess];
  request.error = req.error || defaultError;

  this.queue.push(request);

  if (this.processing) {
    return true;
  }

  try {
    jQuery(document).trigger('q:requestStarted');
  } catch (error) {
    console.error('Queue error:' + error );
  }

  this.processing = false;
  this.process();
  return this.processing;
}

Q.prototype.process = function processQueue(req) {

  if (!this.queue.length) {
    this.processing = false;
    jQuery(document).trigger('q:requestsCompleted');
    return true;
  }
  this.processing = true;
  const request = this.queue.shift();
  request.success.push(this.process);
  try {
    jQuery.ajax(request);
  } catch (error) {
    console.error(error);
  }

  return request;
}

