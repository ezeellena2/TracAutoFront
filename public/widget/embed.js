/**
 * TracAuto Embeddable Widget Loader
 * 
 * Usage: Include this script on your page with the required data attributes:
 *   <script src="https://app.tracauto.com/widget/embed.js" 
 *           data-api-key="YOUR_API_KEY" 
 *           data-container="container-id" 
 *           async></script>
 * 
 * The widget fetches configuration from the TracAuto API and renders
 * a lightweight iframe or content block in the specified container.
 */
(function () {
  'use strict';

  // Find the current script tag to extract config
  var scripts = document.querySelectorAll('script[data-api-key]');
  var currentScript = scripts[scripts.length - 1];

  if (!currentScript) {
    console.error('[TracAuto Widget] Missing data-api-key attribute');
    return;
  }

  var apiKey = currentScript.getAttribute('data-api-key');
  var containerId = currentScript.getAttribute('data-container');
  var baseUrl = currentScript.src.replace('/widget/embed.js', '');

  if (!apiKey) {
    console.error('[TracAuto Widget] API key is required');
    return;
  }

  if (!containerId) {
    console.error('[TracAuto Widget] data-container attribute is required');
    return;
  }

  // Wait for DOM to be ready
  function onReady(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  onReady(function () {
    var container = document.getElementById(containerId);
    if (!container) {
      console.error('[TracAuto Widget] Container element not found: ' + containerId);
      return;
    }

    // Show loading state
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:200px;font-family:system-ui,-apple-system,sans-serif;color:#666;font-size:14px;">Cargando widget...</div>';

    // Fetch widget configuration
    var endpoint = baseUrl + '/api/widget/publico/' + encodeURIComponent(apiKey);

    fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': window.location.origin
      }
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (err) {
            throw new Error(err.detail || err.title || 'Error loading widget');
          });
        }
        return response.json();
      })
      .then(function (data) {
        renderWidget(container, data, baseUrl, apiKey);
      })
      .catch(function (error) {
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100px;font-family:system-ui,-apple-system,sans-serif;color:#ef4444;font-size:13px;background:#fef2f2;border-radius:8px;padding:16px;">' +
          '<span>⚠️ ' + escapeHtml(error.message) + '</span></div>';
        console.error('[TracAuto Widget]', error);
      });
  });

  function renderWidget(container, data, baseUrl, apiKey) {
    var visualConfig = {};
    try {
      if (data.configuracionVisualJson) {
        visualConfig = JSON.parse(data.configuracionVisualJson);
      }
    } catch (e) {
      // ignore parse errors, use defaults
    }

    var primaryColor = visualConfig.primaryColor || '#3b82f6';
    var bgColor = visualConfig.backgroundColor || '#ffffff';
    var borderColor = visualConfig.borderColor || '#e5e7eb';
    var textColor = visualConfig.textColor || '#1f2937';
    var borderRadius = visualConfig.borderRadius || '12px';

    // Render a styled container with an iframe pointing to the widget view
    var iframeSrc = baseUrl + '/widget/view?apiKey=' + encodeURIComponent(apiKey) + '&type=' + data.tipoWidget;

    container.innerHTML = '';

    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'border:1px solid ' + borderColor + ';border-radius:' + borderRadius + ';overflow:hidden;background:' + bgColor + ';box-shadow:0 1px 3px rgba(0,0,0,0.1);';

    // Header bar
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:' + primaryColor + ';color:white;font-family:system-ui,-apple-system,sans-serif;font-size:12px;';
    header.innerHTML = '<span style="font-weight:600;">' + escapeHtml(data.organizacionNombre) + '</span>' +
      '<span style="opacity:0.7;font-size:10px;">Powered by TracAuto</span>';
    wrapper.appendChild(header);

    // Content area - iframe
    var iframe = document.createElement('iframe');
    iframe.src = iframeSrc;
    iframe.style.cssText = 'width:100%;min-height:400px;border:none;display:block;';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('title', 'TracAuto Widget - ' + data.organizacionNombre);
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    wrapper.appendChild(iframe);

    container.appendChild(wrapper);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
