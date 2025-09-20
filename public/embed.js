(function () {
	function ready(fn) {
		if (document.readyState !== 'loading') {
			fn();
		} else {
			document.addEventListener('DOMContentLoaded', fn);
		}
	}

	function parseBool(v) {
		if (v === undefined || v === null) return false;
		const s = String(v).toLowerCase();
		return s === 'true' || s === '1' || s === 'yes';
	}
	function num(v, def) {
		var n = parseInt(v, 10);
		return isNaN(n) ? def : n;
	}

	function buildUrl(origin, formId, hideHeaders, el) {
		let url = origin.replace(/\/$/, '') + '/form/' + encodeURIComponent(formId) + '?embed=true';
		if (hideHeaders) url += '&hideHeaders=true';
		const customCss = el.getAttribute('data-custom-css');
		if (customCss) url += '&customCss=' + customCss; // Already encoded
		return url;
	}

	function createIframe(src, opts) {
		var iframe = document.createElement('iframe');
		iframe.src = src;
		iframe.style.border = '0';
		if (opts.borderRadius != null) iframe.style.borderRadius = opts.borderRadius + 'px';
		if (opts.widthUnit === '%') iframe.style.width = (opts.width || 100) + '%';
		else iframe.style.width = (opts.width || 600) + 'px';
		if (opts.heightMode === 'auto') iframe.style.height = 'auto';
		else iframe.style.height = (opts.heightValue || 600) + 'px';
		return iframe;
	}

	function createModal(src, dims) {
		var overlay = document.createElement('div');
		overlay.style.position = 'fixed';
		overlay.style.inset = '0';
		overlay.style.background = 'rgba(0,0,0,.5)';
		overlay.style.display = 'none';
		overlay.style.alignItems = 'center';
		overlay.style.justifyContent = 'center';
		overlay.style.zIndex = '9999';

		var modal = document.createElement('div');
		modal.style.background = '#fff';
		modal.style.borderRadius = '12px';
		modal.style.boxShadow = '0 10px 30px rgba(0,0,0,.2)';
		modal.style.position = 'relative';
		modal.style.width = dims.w + 'px';
		modal.style.height = dims.h + 'px';
		modal.style.maxWidth = '95vw';
		modal.style.maxHeight = '90vh';

		var close = document.createElement('button');
		close.setAttribute('aria-label', 'Fechar');
		close.innerHTML =
			'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
		close.style.position = 'absolute';
		close.style.top = '8px';
		close.style.right = '10px';
		close.style.background = 'transparent';
		close.style.border = 'none';
		close.style.fontSize = '22px';
		close.style.lineHeight = '1';
		close.style.cursor = 'pointer';
		close.style.color = '#6b7280';

		var iframe = document.createElement('iframe');
		iframe.src = src;
		iframe.style.width = '100%';
		iframe.style.height = '100%';
		iframe.style.border = '0';
		iframe.style.borderRadius = '12px';

		modal.appendChild(close);
		modal.appendChild(iframe);
		overlay.appendChild(modal);

		close.addEventListener('click', function () {
			overlay.style.display = 'none';
		});
		overlay.addEventListener('click', function (e) {
			if (e.target === overlay) {
				overlay.style.display = 'none';
			}
		});

		document.body.appendChild(overlay);
		return overlay;
	}

	function initEmbed(el) {
		var formId = el.getAttribute('data-id') || el.getAttribute('data-opforms-id');
		if (!formId) return;
		var mode = el.getAttribute('data-mode') || 'card';
		var width = num(el.getAttribute('data-width'), 100);
		var widthUnit = el.getAttribute('data-width-unit') || '%';
		var heightMode = el.getAttribute('data-height') || 'auto';
		var heightValue = num(el.getAttribute('data-height-value'), 600);
		var hideHeaders = parseBool(el.getAttribute('data-hide-headers'));
		var origin = el.getAttribute('data-origin') || location.origin || '';

		var url = buildUrl(origin, formId, hideHeaders, el);

		if (mode === 'card' || mode === 'fullwidth') {
			var iframe = createIframe(url, {
				width: width,
				widthUnit: widthUnit,
				heightMode: heightMode,
				heightValue: heightValue,
				borderRadius: num(el.getAttribute('data-border-radius'), 8),
			});
			el.innerHTML = '';
			// Add a fallback in case the iframe fails to load
			iframe.onerror = function () {
				el.innerHTML =
					'<div style="padding: 20px; text-align: center; color: #666; font-family: sans-serif;">Formulário indisponível.</div>';
			};
			iframe.onload = function () {
				// Clear any potential error message if it loads successfully
			};
			el.appendChild(iframe);
			return;
		}

		if (mode === 'popup') {
			var popupSize = el.getAttribute('data-popup-size') || 'medio';
			var dims = (function () {
				if (popupSize === 'grande') return { w: 900, h: 640 };
				if (popupSize === 'pequeno') return { w: 420, h: 360 };
				return { w: 680, h: 520 };
			})();
			var textButton = parseBool(el.getAttribute('data-text-button'));
			var btnText = el.getAttribute('data-button-text') || 'experimente';
			var btnColor = el.getAttribute('data-button-color') || '#2563eb';
			var fontSize = num(el.getAttribute('data-font-size'), 17);
			var radius = num(el.getAttribute('data-border-radius'), 100);

			el.style.display = 'flex';
			el.style.alignItems = 'center';
			el.style.justifyContent = 'center';
			var btn = document.createElement('button');
			btn.textContent = btnText;
			btn.style.background = textButton ? 'transparent' : btnColor;
			btn.style.color = textButton ? btnColor : '#fff';
			btn.style.border = textButton ? 'none' : 'none';
			btn.style.borderRadius = radius + 'px';
			btn.style.fontSize = fontSize + 'px';
			btn.style.padding = textButton ? '0' : '10px 16px';
			btn.style.boxShadow = textButton ? 'none' : '';
			btn.style.cursor = 'pointer';

			var overlay = createModal(url, dims);
			btn.addEventListener('click', function () {
				overlay.style.display = 'flex';
			});
			el.innerHTML = '';
			el.appendChild(btn);
			return;
		}
	}

	ready(function () {
		var nodes = document.querySelectorAll('[data-opforms]');
		for (var i = 0; i < nodes.length; i++) initEmbed(nodes[i]);
	});
})();
