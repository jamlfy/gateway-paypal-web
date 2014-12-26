#Gateway for paypal web

	var Gateway = require('gateway');
	var paypalGateway = require('gateway-paypal-web');

	Gateway.use( paypalGateway({
		client_id : '-- MY ID --',
		client_secret : '-- MY SECRET --',
	}));
