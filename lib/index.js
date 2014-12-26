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

	var payment = new Gateway.Strategy('paypal-web', 0.054, 0.33, opts.url, opts);

	payment.add('create', function (options, callback) {
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
			method : opts.showMethod || opts.showMethod,
			id : opts.id
		};


		paypalPayment.redirect_urls.return_url = options.return_url || payment.url('return', data );
		paypalPayment.redirect_urls.cancel_url = options.cancel_url || payment.url('cancel', data );

		if( options.items ){
			for (var i = options.items.length - 1; i >= 0; i--) {
				paypalPayment.transactions[i].currency = options.items[i].currency;
				paypalPayment.transactions[i].amount.total = options.items[i].amount;
				paypalPayment.transactions[i].description = options.items[i].description;
				paypalPayment.transactions[i].title = options.items[i].title;
			};
		} else {
			if( options.items[i].currency )
				paypalPayment.transactions[0].currency = options.items[i].currency;
			paypalPayment.transactions[0].amount.total = options.items[i].amount;
			paypalPayment.transactions[0].description = options.items[i].description;
			paypalPayment.transactions[0].title = options.items[i].title;
		}

		paypal.payment.create(paypalPayment, {}, function (err, resp) {
			if(err) return callback(err);
			var link = resp.links;
			for (var i = 0; i < link.length; i++) {
				if (link[i].rel === 'approval_url') {
					res.redirect(link[i].href);
				}
			}
		});
	});

	payment.add('payment', function (req, data, options, cb) {
		var payer = { payer_id : req.query.PayerID };
		paypal.payment.execute(order.payment_id, payer, {}, function (err, resp) {
			if(err) return cb(err);
			cb(err, resp);
		});
	});

	return payment;
};