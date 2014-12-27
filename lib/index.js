const gateway = require('gateway');
var paypal = require('paypal-sdk');
module.exports = function (opts) {
	if( typeof opts != 'object' || !opts.client_id || !opts.client_secret )
		throw new Error('The configuration is dont exist');

	paypal.configure({
		'mode': opts.mode || 'sandbox', //sandbox or live
		'client_id': opts.client_id,
		'client_secret': opts.client_secret
	});

	var payment = new Gateway.Strategy('paypal-web', opts.porcent || 0.054, opts.more 0.33, opts.url, opts);

	payment.add('create', function (options, callback) {
		var paymentData = payment.data();
		var paypalPayment = {
			"intent": "sale",
			"payer": {
				"payment_method": "paypal"
			},
			"redirect_urls": {},
			"transactions": [{
				"amount": {
						"currency": opts.currency || 'USD'
					}
				}
			]
		};

		var data = {
			method : opts.showMethod || options.showMethod,
			id : options.id
		};


		paypalPayment.redirect_urls.return_url = options.return_url || payment.url('success', data );
		paypalPayment.redirect_urls.cancel_url = options.cancel_url || payment.url('cancel', data );

		if( options.items ){
			for (var i = options.items.length - 1; i >= 0; i--) {
				paypalPayment.transactions[i].currency = options.items[i].currency;
				paypalPayment.transactions[i].amount.total = options.items[i].amount;
				if( options.add )
					paypalPayment.transactions[i].amount.total = ( options.items[i].amount * paymentData.aditional ) + options.items[i].amount;
				paypalPayment.transactions[i].description = options.items[i].description;
				paypalPayment.transactions[i].title = options.items[i].title;
			};
		} else {
			paypalPayment.transactions[0].amount.total = options.items[i].amount;
			if( options.add )
				paypalPayment.transactions[0].amount.total = ( options.items[i].amount * paymentData.aditional ) + options.items[i].amount;
			if( options.items[i].currency )
				paypalPayment.transactions[0].currency = options.items[i].currency;
			paypalPayment.transactions[0].description = options.items[i].description;
			paypalPayment.transactions[0].title = options.items[i].title;
		}

		paypal.payment.create(paypalPayment, function (err, resp) {
			if(err) return callback(err);
			options._raw = resp;

			var link = resp.links;
			for (var i = 0; i < link.length; i++) {
				if (link[i].rel === 'approval_url') {
					options.link.push(link[i].href);
				}
			}

			options.date = new Date( resp.start_date );
			options.system = {
				id : resp.plan.id,
				name : paymentData.name,
				state : resp.plan.merchant_preferences.state,
				url : {
					success :resp.plan.merchant_preferences.return_url,
					cancel : resp.plan.merchant_preferences.cancel_url
				},
			};


			callback(options);
		});
	});

	payment.add('payment', function (req, params, data, cb) {
		var payer = {
			payer_id : ''
		};

		if( req.query[ params.id ] )
			payer.payer_id = req.query[ params.id ];

		if( req.params[ params.id ] )
			payer.payer_id = req.params[ params.id ];

		var data = { id : data };
		paypal.payment.execute(data, payer, function (err, doc) {
			if(err) return cb(err);
			data._raw = doc;
			data.method = payment.data().name;
			data.uuid = doc.id;
			data.state = doc.state;
			data.time = {
				create : new Date(doc.create_time),
				update : new Date(doc.update_time),
			};
			data.payer = doc.payer.payer_info;
			data.payer.id = doc.payer.payer_info.payer_id;
			cb(err, data);
		});
	});

	return payment;
};