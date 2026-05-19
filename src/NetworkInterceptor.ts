import ApiLoggerService from './ApiLoggerService';

export function initializeNetworkInterceptor() {
  const XHR = global.XMLHttpRequest;
  if (!XHR) return;

  const originalOpen = XHR.prototype.open;
  const originalSend = XHR.prototype.send;
  const originalSetRequestHeader = XHR.prototype.setRequestHeader;

  // @ts-ignore
  XHR.prototype.open = function (method: string, url: string) {
    (this as any).__apiLoggerMethod = method;
    (this as any).__apiLoggerUrl = url;
    (this as any).__apiLoggerRequestHeaders = {};
    (this as any).__apiLoggerStartTime = Date.now();
    (this as any).__apiLoggerScreenName =
      ApiLoggerService.getCurrentScreenName();
    // @ts-ignore
    return originalOpen.apply(this, arguments);
  };

  // @ts-ignore
  XHR.prototype.setRequestHeader = function (header: string, value: string) {
    (this as any).__apiLoggerRequestHeaders[header] = value;
    // @ts-ignore
    return originalSetRequestHeader.apply(this, arguments);
  };

  // @ts-ignore
  XHR.prototype.send = function (data: any) {
    (this as any).__apiLoggerRequestBody = data;

    this.addEventListener('load', async () => {
      const self = this as any;
      const endTime = Date.now();
      const duration = endTime - (self.__apiLoggerStartTime || endTime);

      let responseBody: any;
      try {
        // Try to get text response first (most reliable for JSON)
        let text = '';
        try {
          text = this.responseText;
        } catch (e) {
          // responseText access can throw if responseType is not '' or 'text'
        }

        if (text) {
          try {
            responseBody = JSON.parse(text);
          } catch (e) {
            responseBody = text;
          }
        } else if (
          typeof this.response === 'object' &&
          this.response !== null
        ) {
          // Handle cases where response is already an object (e.g. responseType = 'json')
          // Clone it to avoid reference issues
          try {
            responseBody = JSON.parse(JSON.stringify(this.response));
          } catch (e) {
            responseBody = this.response;
          }
        } else {
          responseBody = this.response;
        }
      } catch (e) {
        responseBody = '[Error capturing response]';
      }

      // Handle React Native Blob responses
      if (
        responseBody &&
        typeof responseBody === 'object' &&
        ((responseBody._data && responseBody.blobId) ||
          this.response instanceof Blob)
      ) {
        try {
          const blob =
            this.response instanceof Blob ? this.response : responseBody;
          const reader = new FileReader();
          const textBody = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(blob);
          });

          try {
            responseBody = JSON.parse(textBody as string);
          } catch (e) {
            responseBody = textBody;
          }
        } catch (e) {
          // Fallback if Blob reading fails
        }
      }

      let requestBody = self.__apiLoggerRequestBody;
      if (typeof requestBody === 'string') {
        try {
          requestBody = JSON.parse(requestBody);
        } catch (e) {}
      }

      const responseHeaders: Record<string, string> = {};
      const headerString = this.getAllResponseHeaders();
      if (headerString) {
        headerString.split('\r\n').forEach((line) => {
          const [key, ...value] = line.split(': ');
          if (key && value) {
            responseHeaders[key] = value.join(': ');
          }
        });
      }

      ApiLoggerService.addLog({
        id: Math.random().toString(36).substring(7),
        method: self.__apiLoggerMethod,
        url: self.__apiLoggerUrl,
        requestHeaders: self.__apiLoggerRequestHeaders,
        requestBody: requestBody,
        responseHeaders: responseHeaders,
        responseBody: responseBody,
        statusCode: this.status,
        timestamp: self.__apiLoggerStartTime || endTime,
        duration: Math.max(0, duration),
        isError: this.status < 200 || this.status >= 300,
        // @ts-ignore
        screenName: self.__apiLoggerScreenName,
      });
    });

    this.addEventListener('error', () => {
      const self = this as any;
      const endTime = Date.now();
      const duration = endTime - (self.__apiLoggerStartTime || endTime);

      ApiLoggerService.addLog({
        id: Math.random().toString(36).substring(7),
        method: self.__apiLoggerMethod,
        url: self.__apiLoggerUrl,
        requestHeaders: self.__apiLoggerRequestHeaders,
        requestBody: self.__apiLoggerRequestBody,
        statusCode: this.status,
        timestamp: self.__apiLoggerStartTime || endTime,
        duration: Math.max(0, duration),
        isError: true,
        // @ts-ignore
        screenName: self.__apiLoggerScreenName,
      });
    });

    // @ts-ignore
    return originalSend.apply(this, arguments);
  };
}
