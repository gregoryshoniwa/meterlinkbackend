const mysql = require("mysql");
const express = require("express");
const bodyparser = require("body-parser");
const path = require("path");
const multer = require("multer");
var async = require('async');
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
var cors = require('cors');

const accountSid = 'AC645703074216a114b1ff713dc509f3fd'; 
const authToken = '2591f44dcc2a89e93cbf74afa415d8e5'; 
const client = require('twilio')(accountSid, authToken); 
//import twilio from 'twilio';
var twilio = require('twilio');

twilio(accountSid,authToken);
var MR = twilio.twiml;



var app = express();
// app.use(bodyparser.json());
// app.use(bodyparser.urlencoded({
// 	extended: true
//   }));
app.use(bodyparser.json({limit: '50mb'}));
app.use(bodyparser.urlencoded({limit: '50mb', extended: true}));
app.use(cors());


var contiflow = mysql.createPool({
  connectionLimit : 5000,
  multipleStatements: "true",
  host: "127.0.0.1",
  user: "root",
  password: "JesusChrist@@11",
  database: "meterlink",
  port: 3306
});

var contiflowTran = mysql.createConnection({
  connectionLimit : 5000,
  multipleStatements: "true",
  host: "127.0.0.1",
  user: "root",
  password: "JesusChrist@@11",
  database: "meterlink",
  port: 3306
});

contiflow.getConnection(err => {
  if (!err) {
    console.log("MeterLink connection Successful.");
  } else {
    console.log(
      "MeterLink connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
    );
  }
});


 



app.listen(process.env.PORT || 8082, () =>
  console.log("Express Server is running at port 8082")
);



//Whatsapp Bot


app.post("/sendWhatsAppMessage", (req, res) => {
  
	client.messages 
      .create({ 
         body: req.body.message, 
         from: `whatsapp:+14155238886`,       
		 to: `whatsapp:${req.body.cell}`,
		 
		 
       }) 
      .then(message => {
		 // console.log(message.sid)}
		  res.json({data_id:message.sid,data:message})
	  }) 
      .done();
});


app.post("/getWhatsAppMessage", (req, res) => {
	
	 const twiml = new MR.MessagingResponse();
	 const q = req.body.Body;
     
	 twiml.message(`This is the message you send :  ${q}`);

	 res.set('Content-Type', 'text/xml');
	 res.status(200).send(twiml.toString());
	 
 });

 
app.post("/getWhatsAppMessageStatus", (req, res) => {
	
	const twiml = new MR.MessagingResponse();
	const q = req.body.Body;
	//console.log(req.body)
	twiml.message(`success`);

	res.set('Content-Type', 'text/xml');
	res.status(200).send(twiml.toString());
 });

 
app.post("/getWhatsAppMessageError", (req, res) => {
	
	const twiml = new MR.MessagingResponse();
	const q = req.body.Body;
	console.log(req.body)
	twiml.message(`success`);

	res.set('Content-Type', 'text/xml');
	res.status(200).send(twiml.toString());
 });













//Whatsapp bot















async function mainhandover(email,output){
	let transporter = nodemailer.createTransport({
		host: "mail.contitouch.co.zw",
		port: 25,
		secure: false, // true for 465, false for other ports
		auth: {
		  user: 'admin@conticash.co.zw', // generated ethereal user
		  pass: 'Cont1' // generated ethereal password
		}
	  });
		//console.log(email);
	  // send mail with defined transport object
	  let info = await transporter.sendMail({
		from: '"ContiCash" <admin@conticash.co.zw>', // sender address
		to: email, // list of receivers
		subject: "Hand Over Pin✔", // Subject line
		html: output, // html body
		attachments: [{
			filename: 'logo.png',
			path: __dirname + '/Storage/logo.png',
			cid: 'conticashlogo' //same cid value as in the html img src
    }]
	  });

	 // console.log("Message sent: %s", info.messageId);
	  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

	  // Preview only available when sending through an Ethereal account
	  //console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
	  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

function verifyToken(req,res,next) {
	const bearerHeader = req.headers['authorization'];

	if(typeof bearerHeader !== 'undefined'){
		const bearer = bearerHeader.split(' ');
		const bearerToken = bearer[1];
		req.token = bearerToken;
		next();
	}else{
		res.json({
			message: 'Authorization Failed'
		})
	}
}




app.get('/downloadTemp', function(req, res){
	var file = __dirname + '/Storage/DisburseTemp.csv';
	res.download(file); // Set disposition and send it.
  });


  app.get('/uploadedFile/:id', function(req, res){
	var file = __dirname + '/Storage/'+req.params.id;
	//res.download(file); // Set disposition and send it.
	res.sendFile(file);
  });

  //Upload Images
  //Set Storage Engine
  const storage = multer.diskStorage({
	destination: "./Storage",
	filename: function(req, file, callback) {
	  callback(
		null,
		file.fieldname + "-" + Date.now() + path.extname(file.originalname)
	  );
	}
  });

  //init Upload
  const upload = multer({
	storage: storage,
	limits: { fileSize: 300000 },
	fileFilter: function(req, file, cb) {
	  checkFileType(file, cb);
	}
  }).single("contiflowFile");

  //Check file type
  function checkFileType(file, cb) {
	//Allowed ext
	const filetypes = /.*\.(gif|jpe?g|tiff|png)/;
	//check ext
	const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
	//Check mime
	const mimetype = filetypes.test(file.mimetype);
	if (extname) {
	  return cb(null, true);
	} else {
	  cb("Error: " + file.mimetype + " not allowed!");
	}
  }

  app.post("/upload", (req, res) => {
	upload(req, res, err => {
	  if (err) {
		res.send({
		  msg: err
		});
	  } else {
		if (req.file == undefined) {
		  res.status(500).json({
			msg: "Error : No file has been selected"
		  });
		} else {
		  res.status(200).json({
			msg: req.file
		  });
		}
	  }
	});
  });


app.get('/uploadedFile/:id', function(req, res){
	var file = __dirname + '/Storage/'+req.params.id;
	res.download(file); // Set disposition and send it.
  });


app.post("/assignRoute", (req, res) => {

	jwt.verify(req.body.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let payload = req.body.payload

			jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
				if (!err) {

					contiflow.getConnection(function(err, connection) {
						if (!err) {
							//console.log("Contiflow Transaction connection Succeded.");
								connection.beginTransaction(function(err) {
											if (err) {  connection.release(); throw err; }


													connection.query('INSERT INTO assignedroutes SET ?', decoded.stack, function (error, results, fields) {
													if (error) {
														return connection.rollback(function() {
															connection.release();
														res.send(error);
														});
													}

													//decoded.stack_updates.stack_id = results.insertId;

													connection.query('UPDATE routes SET status = 7,assignTo = ? WHERE id = ?', [decoded.assignTo,decoded.stack_id], function (error, results, fields) {
														if (error) {
															return connection.rollback(function() {
																connection.release();
															res.send(error);
															});
														}


													connection.commit(function(err) {
														if (err) {
														return connection.rollback(function() {
															connection.release();
															res.send(error);
														});
														}
														//console.log('success!');
														connection.release();
														res.send(results);
													});

														});


													});
											});
								} else {
									console.log(
									"Contiflow connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
									);
								}

								});

				}else{
					res.send(err);
				}

			 });


		}
	 })
});


app.post("/deleteRoute", (req, res) => {

	jwt.verify(req.body.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let payload = req.body.payload

			jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
				if (!err) {

					contiflow.getConnection(function(err, connection) {
						if (!err) {
							//console.log("Contiflow Transaction connection Succeded.");
								connection.beginTransaction(function(err) {
											if (err) {  connection.release(); throw err; }


													

													//decoded.stack_updates.stack_id = results.insertId;

													connection.query('DELETE FROM routes WHERE routeId = ?', [decoded.routeId], function (error, results, fields) {
														if (error) {
															return connection.rollback(function() {
																connection.release();
															res.send(error);
															});
														}


													connection.commit(function(err) {
														if (err) {
														return connection.rollback(function() {
															connection.release();
															res.send(error);
														});
														}
														//console.log('success!');
														connection.release();
														res.send(results);
													});

														});


													
											});
								} else {
									console.log(
									"Contiflow connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
									);
								}

								});

				}else{
					res.send(err);
				}

			 });


		}
	 })
});


app.post("/deleteRouteAssigned", (req, res) => {

	jwt.verify(req.body.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let payload = req.body.payload

			jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
				if (!err) {

					contiflow.getConnection(function(err, connection) {
						if (!err) {
							//console.log("Contiflow Transaction connection Succeded.");
								connection.beginTransaction(function(err) {
											if (err) {  connection.release(); throw err; }


													

													//decoded.stack_updates.stack_id = results.insertId;

													connection.query('DELETE FROM assignedroutes WHERE route = ?', [decoded.route], function (error, results, fields) {
														if (error) {
															return connection.rollback(function() {
																connection.release();
															res.send(error);
															});
														}


													connection.commit(function(err) {
														if (err) {
														return connection.rollback(function() {
															connection.release();
															res.send(error);
														});
														}
														//console.log('success!');
														connection.release();
														res.send(results);
													});

														});


													
											});
								} else {
									console.log(
									"Contiflow connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
									);
								}

								});

				}else{
					res.send(err);
				}

			 });


		}
	 })
});



app.post("/addUser", (req, res) => {

	jwt.verify(req.body.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let payload = req.body.payload

			jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
				if (!err) {

					contiflow.getConnection(function(err, connection) {
						if (!err) {
							//console.log("Contiflow Transaction connection Succeded.");
								connection.beginTransaction(function(err) {
											if (err) {  connection.release(); throw err; }
													// connection.query('INSERT INTO company_banking_details SET ?', banking, function (error, results, fields) {
													// if (error) {
													// 	return connection.rollback(function() {
													// 		connection.release();
													// 	res.send(error);
													// 	});
													// }

													// });

													connection.query('INSERT INTO users SET ?', decoded, function (error, results, fields) {
													if (error) {
														return connection.rollback(function() {
															connection.release();
														res.send(error);
														});
													}
													connection.commit(function(err) {
														if (err) {
														return connection.rollback(function() {
															connection.release();
															res.send(error);
														});
														}
														//console.log('success!');
														connection.release();
														res.send(results);
													});
													});
											});
								} else {
									console.log(
									"Contiflow connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
									);
								}

								});

				}else{
					res.send(err);
				}

			 });


		}
	 })
});



app.post("/addRoute", (req, res) => {

	jwt.verify(req.body.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let payload = req.body.payload

			jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
				if (!err) {

					contiflow.getConnection(function(err, connection) {
						if (!err) {
							//console.log("Contiflow Transaction connection Succeded.");
								connection.beginTransaction(function(err) {
											if (err) {  connection.release(); throw err; }


													connection.query('INSERT INTO routes SET ?', decoded, function (error, results, fields) {
													if (error) {
														return connection.rollback(function() {
															connection.release();
														res.send(error);
														});
													}
													connection.commit(function(err) {
														if (err) {
														return connection.rollback(function() {
															connection.release();
															res.send(error);
														});
														}
														//console.log('success!');
														connection.release();
														res.send(results);
													});
													});
											});
								} else {
									console.log(
									"Contiflow connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
									);
								}

								});

				}else{
					res.send(err);
				}

			 });


		}
	 })
});


app.post("/addNoAccess", (req, res) => {

	jwt.verify(req.body.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let payload = req.body.payload

			jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
				if (!err) {

					contiflow.getConnection(function(err, connection) {
						if (!err) {
							//console.log("Contiflow Transaction connection Succeded.");
								connection.beginTransaction(function(err) {
											if (err) {  connection.release(); throw err; }


													connection.query('INSERT INTO noaccess SET ?', decoded, function (error, results, fields) {
													if (error) {
														return connection.rollback(function() {
															connection.release();
														res.send(error);
														});
													}
													connection.commit(function(err) {
														if (err) {
														return connection.rollback(function() {
															connection.release();
															res.send(error);
														});
														}
														//console.log('success!');
														connection.release();
														res.send(results);
													});
													});
											});
								} else {
									console.log(
									"Contiflow connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
									);
								}

								});

				}else{
					res.send(err);
				}

			 });


		}
	 })
});


app.post("/checkUserPin", (req, res) => {

	jwt.verify(req.body.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let payload = req.body.payload

			jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
				if (!err) {

					contiflow.getConnection(function(err, connection) {
						if (!err) {
							//console.log("Contiflow Transaction connection Succeded.");
								connection.beginTransaction(function(err) {
											if (err) {  connection.release(); throw err; }

													connection.query(`SELECT first_name,last_name FROM users WHERE id = ? AND pin = ?`, [decoded.user_id, decoded.pin], function (error, results, fields) {
													if (error) {
														return connection.rollback(function() {
															connection.release();
														res.send(error);
														});
													}
													connection.commit(function(err) {
														if (err) {
														return connection.rollback(function() {
															connection.release();
															res.send(error);
														});
														}
														//console.log('success!');
														connection.release();
														res.send(results);
													});
													});
											});
								} else {
									console.log(
									"Contiflow connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
									);
								}

								});

				}else{
					res.send(err);
				}

			 });


		}
	 })
});


app.put("/passwordRestCheck/:id", (req, res) => {

	jwt.verify(req.body.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let payload = req.body.payload
			let id = req.params.id
			var newid = 0;
			jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
				if (!err) {
					//console.log(decoded);
					contiflow.getConnection(function(err, connection) {
						if (!err) {
							//console.log("Contiflow Transaction connection Succeded.");
								connection.beginTransaction(function(err) {
											if (err) {  connection.release(); throw err; }

													connection.query('SELECT id from users WHERE id = ? and password = ?', [id,decoded.oldpassword], function (error, results, fields) {
													if (error) {
														return connection.rollback(function() {
															connection.release();
														res.send(error);
														});
													}

													newid = results[0].id;
													//console.log(newid);
													connection.query('UPDATE users SET ? WHERE id = ?', [decoded.password, newid], function (error, results, fields) {
														if (error) {
															return connection.rollback(function() {
																connection.release();
															res.send(error);
															});
														}


															connection.commit(function(err) {
																if (err) {
																return connection.rollback(function() {
																	connection.release();
																	res.send(error);
																});
																}
																//console.log('success!');
																connection.release();
																res.send(results);
															});

														});


													});

											});
								} else {
									console.log(
									"Contiflow connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
									);
								}

								});

				}else{
					res.send(err);
				}

			 });


		}
	 })
});


app.put("/pinRestCheck/:id", (req, res) => {

	jwt.verify(req.body.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let payload = req.body.payload
			let id = req.params.id
			var newid = 0;
			jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
				if (!err) {
					//console.log(decoded);
					contiflow.getConnection(function(err, connection) {
						if (!err) {
							//console.log("Contiflow Transaction connection Succeded.");
								connection.beginTransaction(function(err) {
											if (err) {  connection.release(); throw err; }

													connection.query('SELECT id from users WHERE id = ? and pin = ?', [id,decoded.oldpin], function (error, results, fields) {
													if (error) {
														return connection.rollback(function() {
															connection.release();
														res.send(error);
														});
													}

													newid = results[0].id;
													//console.log(newid);

													connection.query('UPDATE users SET ? WHERE id = ?', [decoded.pin, newid], function (error, results, fields) {
														if (error) {
															return connection.rollback(function() {
																connection.release();
															res.send(error);
															});
														}


													connection.commit(function(err) {
														if (err) {
														return connection.rollback(function() {
															connection.release();
															res.send(error);
														});
														}
														//console.log('success!');
														connection.release();
														res.send(results);
													});

														});


													});

											});
								} else {
									console.log(
									"Contiflow connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
									);
								}

								});

				}else{
					res.send(err);
				}

			 });


		}
	 })
});



app.put("/passwordRest/:id", (req, res) => {

	jwt.verify(req.body.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let payload = req.body.payload
			let id = req.params.id
			jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
				if (!err) {

					contiflow.getConnection(function(err, connection) {
						if (!err) {
							//console.log("Contiflow Transaction connection Succeded.");
								connection.beginTransaction(function(err) {
											if (err) {  connection.release(); throw err; }

													connection.query('UPDATE users SET ? WHERE id = ?', [decoded, id], function (error, results, fields) {
													if (error) {
														return connection.rollback(function() {
															connection.release();
														res.send(error);
														});
													}
													connection.commit(function(err) {
														if (err) {
														return connection.rollback(function() {
															connection.release();
															res.send(error);
														});
														}
														//console.log('success!');
														connection.release();
														res.send(results);
													});
													});
											});
								} else {
									console.log(
									"Contiflow connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
									);
								}

								});

				}else{
					res.send(err);
				}

			 });


		}
	 })
});



app.put("/activateUser/:id", (req, res) => {

	jwt.verify(req.body.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let payload = req.body.payload
			let id = req.params.id
			jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
				if (!err) {

					contiflow.getConnection(function(err, connection) {
						if (!err) {
							//console.log("Contiflow Transaction connection Succeded.");
								connection.beginTransaction(function(err) {
											if (err) {  connection.release(); throw err; }

													connection.query('UPDATE users SET ? WHERE id = ?', [decoded, id], function (error, results, fields) {
													if (error) {
														return connection.rollback(function() {
															connection.release();
														res.send(error);
														});
													}
													connection.commit(function(err) {
														if (err) {
														return connection.rollback(function() {
															connection.release();
															res.send(error);
														});
														}
														//console.log('success!');
														connection.release();
														res.send(results);
													});
													});
											});
								} else {
									console.log(
									"Contiflow connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
									);
								}

								});

				}else{
					res.send(err);
				}

			 });


		}
	 })
});

app.put("/disableUser/:id", (req, res) => {

	jwt.verify(req.body.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let payload = req.body.payload
			let id = req.params.id
			jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
				if (!err) {

					contiflow.getConnection(function(err, connection) {
						if (!err) {
							//console.log("Contiflow Transaction connection Succeded.");
								connection.beginTransaction(function(err) {
											if (err) {  connection.release(); throw err; }

													connection.query('UPDATE users SET ? WHERE id = ?', [decoded, id], function (error, results, fields) {
													if (error) {
														return connection.rollback(function() {
															connection.release();
														res.send(error);
														});
													}
													connection.commit(function(err) {
														if (err) {
														return connection.rollback(function() {
															connection.release();
															res.send(error);
														});
														}
														//console.log('success!');
														connection.release();
														res.send(results);
													});
													});
											});
								} else {
									console.log(
									"Contiflow connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
									);
								}

								});

				}else{
					res.send(err);
				}

			 });


		}
	 })
});



app.put("/updateNoAccess/:id", (req, res) => {

	jwt.verify(req.body.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let payload = req.body.payload
			let id = req.params.id
			jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
				if (!err) {

					contiflow.getConnection(function(err, connection) {
						if (!err) {
							//console.log("Contiflow Transaction connection Succeded.");
								connection.beginTransaction(function(err) {
											if (err) {  connection.release(); throw err; }

													connection.query('UPDATE noaccess SET ? WHERE id = ?', [decoded, id], function (error, results, fields) {
													if (error) {
														return connection.rollback(function() {
															connection.release();
														res.send(error);
														});
													}
													connection.commit(function(err) {
														if (err) {
														return connection.rollback(function() {
															connection.release();
															res.send(error);
														});
														}
														//console.log('success!');
														connection.release();
														res.send(results);
													});
													});
											});
								} else {
									console.log(
									"Contiflow connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
									);
								}

								});

				}else{
					res.send(err);
				}

			 });


		}
	 })
});


app.put("/updateUser/:id", (req, res) => {

	jwt.verify(req.body.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let payload = req.body.payload
			let id = req.params.id
			jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
				if (!err) {

					contiflow.getConnection(function(err, connection) {
						if (!err) {
							//console.log("Contiflow Transaction connection Succeded.");
								connection.beginTransaction(function(err) {
											if (err) {  connection.release(); throw err; }

													connection.query('UPDATE users SET ? WHERE id = ?', [decoded, id], function (error, results, fields) {
													if (error) {
														return connection.rollback(function() {
															connection.release();
														res.send(error);
														});
													}
													connection.commit(function(err) {
														if (err) {
														return connection.rollback(function() {
															connection.release();
															res.send(error);
														});
														}
														//console.log('success!');
														connection.release();
														res.send(results);
													});
													});
											});
								} else {
									console.log(
									"Contiflow connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
									);
								}

								});

				}else{
					res.send(err);
				}

			 });


		}
	 })
});

app.put("/adminPasswordReset/:id", (req, res) => {

	jwt.verify(req.body.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let payload = req.body.payload
			let id = req.params.id
			jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
				if (!err) {

					contiflow.getConnection(function(err, connection) {
						if (!err) {
							//console.log("Contiflow Transaction connection Succeded.");
								connection.beginTransaction(function(err) {
											if (err) {  connection.release(); throw err; }

													connection.query('UPDATE users SET ? WHERE id = ?', [decoded, id], function (error, results, fields) {
													if (error) {
														return connection.rollback(function() {
															connection.release();
														res.send(error);
														});
													}
													connection.commit(function(err) {
														if (err) {
														return connection.rollback(function() {
															connection.release();
															res.send(error);
														});
														}
														//console.log('success!');
														connection.release();
														res.send(results);
													});
													});
											});
								} else {
									console.log(
									"Contiflow connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
									);
								}

								});

				}else{
					res.send(err);
				}

			 });


		}
	 })
});

app.put("/adminPasswordResetApp/:id", (req, res) => {

	jwt.verify(req.body.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let payload = req.body.payload
			let id = req.params.id
			jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
				if (!err) {

					contiflow.getConnection(function(err, connection) {
						if (!err) {
							//console.log("Contiflow Transaction connection Succeded.");
								connection.beginTransaction(function(err) {
											if (err) {  connection.release(); throw err; }

													connection.query('UPDATE users SET ? WHERE id = ?', [decoded, id], function (error, results, fields) {
													if (error) {
														return connection.rollback(function() {
															connection.release();
														res.send(error);
														});
													}
													connection.commit(function(err) {
														if (err) {
														return connection.rollback(function() {
															connection.release();
															res.send(error);
														});
														}
														//console.log('success!');
														connection.release();
														res.send(results);
													});
													});
											});
								} else {
									console.log(
									"Contiflow connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
									);
								}

								});

				}else{
					res.send(err);
				}

			 });


		}
	 })
});


app.put("/updateAssignedRouteApp/:id", (req, res) => {

	
	let id = req.params.id
			
					//console.log(req.body.incidentData.status);
					contiflow.getConnection(function(err, connection) {
						if (!err) {
							//console.log("Contiflow Transaction connection Succeded.");
								connection.beginTransaction(function(err) {
											if (err) {  connection.release(); throw err; }

											 connection.query('UPDATE assignedroutes SET ? WHERE id = ?', [req.body.updateData, id], function (error, results, fields) {
												if (error) {
														return connection.rollback(function() {
															connection.release();
															console.log(error);
														res.send(error);
														});
													}
													//console.log(results);
												
													connection.query('INSERT INTO incidents SET ?', req.body.incidentData, function (error, results, fields) {
														if (error) {
															return connection.rollback(function() {
																connection.release();
																console.log(error);
															res.send(error);
															});
														} 
													//  	console.log(req.body.incidentData); 


													connection.commit(function(err) {
														if (err) {
														return connection.rollback(function() {
															connection.release();
															res.send(error);
														});
														}
														
														connection.release();
														//res.send(results);
														res.send(results);
													});

														});


													});

											});
								} else {
									console.log(
									"Contiflow connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
									);
								}

								});

				

			 


	
}); 


app.put("/updateAssignedRouteApp2/:id", (req, res) => {

	
	let id = req.params.id
			
					//console.log(decoded);
					contiflow.getConnection(function(err, connection) {
						if (!err) {
							//console.log("Contiflow Transaction connection Succeded.");
								connection.beginTransaction(function(err) {
											if (err) {  connection.release(); throw err; }

											 

													connection.query('UPDATE assignedroutes SET ? WHERE id = ?', [req.body, id], function (error, results, fields) {
														if (error) {
															return connection.rollback(function() {
																connection.release();
															res.send(error);
															});
														}


													connection.commit(function(err) {
														if (err) {
														return connection.rollback(function() {
															connection.release();
															res.send(error);
														});
														}
														//console.log(results);
														connection.release();
														//res.send(results);
														res.send(results);
													});

														});


												

											});
								} else {
									console.log(
									"Contiflow connection failed  \n Error :" + JSON.stringify(err, undefined, 2)
									);
								}

								});

				

			 


	
});




app.post("/loginUser", (req, res) => {
			let payload = req.body.payload


			jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
				console.log(err)
				if (!err) {
					console.log(decoded)
					contiflow.query("SELECT id, firstName,lastName,userType,status from users where userName = ? and password = ?", [decoded.userName,decoded.password], (err, rows, fields) => {
						if (!err) {
							jwt.sign({rows},'meterlink@@11',{expiresIn:'8h'},(err,token) =>{
								res.json({
									token
								})
							})

						} else {
						res.send(err);
						}
					});
				}else{

					res.send(err);
				}

			  });


});


app.post("/loginUserApp", (req, res) => {

			//console.log(req.body)
			contiflow.query("SELECT id, firstName,lastName,userType,status from users where userName = ? and passwordApp = ?", [req.body.userName,req.body.password], (err, rows, fields) => {
				if (!err) {

						res.json(rows)

				} else {
				res.send(err);
				}
			});


});
app.post("/passwordRest", (req, res) => {

	//console.log(req.body)
	contiflow.query("UPDATE users SET passwordApp = ? WHERE id = ?", [req.body.password,req.body.user_id], (err, rows, fields) => {
		if (!err) {
				console.log(rows)
				res.json(rows)

		} else {
			console.log(err)
		res.send(err);
		
		}
	});


});
app.post("/updateUserStatus", (req, res) => {

	//console.log(req.body)
	contiflow.query("UPDATE users SET status = 1 WHERE id = ?", [req.body.user_id], (err, rows, fields) => {
		if (!err) {
				console.log(rows)
				res.json(rows)

		} else {
			console.log(err)
		res.send(err);
		
		}
	});


});





app.post("/getAllRoutesByUser", (req, res) => {
	let payload = req.body.payload


	jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
		console.log(err)
		if (!err) {
			//console.log(decoded)
			contiflow.query("SELECT T0.*,T1.name,T2.userName from assignedroutes T0 inner join status T1 on T0.status = T1.id inner join users T2 on T0.assignTo = T2.id where T0.assignTo = ? and T0.status != 2", [decoded.assignTo], (err, rows, fields) => {
				if (!err) {
					jwt.sign({rows},'meterlink@@11',{expiresIn:'8h'},(err,token) =>{
						res.json({
							token
						})
					})

				} else {
				res.send(err);
				}
			});
		}else{

			res.send(err);
		}

	  });


});



app.post("/getAllIncidentsByUser", (req, res) => {
	let payload = req.body.payload


	jwt.verify(payload, 'meterlink@@11', (err, decoded) =>{
		console.log(err)
		if (!err) {
			//console.log(decoded)
			contiflow.query(`SELECT T0.*,T1.name as statusName,T2.userName FROM incidents T0
			inner join status T1 on T0.status = T1.id
			inner join users T2 on T0.createdBy = T2.id where T0.createdBy = ? and T0.status = 4`, [decoded.assignTo], (err, rows, fields) => {
				if (!err) {
					jwt.sign({rows},'meterlink@@11',{expiresIn:'8h'},(err,token) =>{
						res.json({
							token
						})
					})

				} else {
				res.send(err);
				}
			});
		}else{

			res.send(err);
		}

	  });


});

app.post("/getAllRoutesByUserApp", (req, res) => {


	        console.log(req.body)
			contiflow.query("SELECT T0.*,T1.name from assignedroutes T0 inner join status T1 on T0.status = T1.id where T0.assignTo = ? and T0.status = 7", [req.body.assignTo], (err, rows, fields) => {
				if (!err) {
					jwt.sign({rows},'meterlink@@11',{expiresIn:'8h'},(err,token) =>{
						res.json(rows)
					})

				} else {
				res.send(err);
				}
			});



});








app.get("/getAllRoutes",verifyToken, (req, res) => {
	jwt.verify(req.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let data = req.body;
			contiflow.query('SELECT T0.*,T1.userName from routes T0 left join users T1 on T0.assignTo = T1.id WHERE T0.status != 2', (err, rows, fields) => {
				if (!err) {
				res.send(rows);
				} else {
				res.send(err);
				}
			});

		}
	 })
  });


app.get("/getAllUserTypes",verifyToken, (req, res) => {
	jwt.verify(req.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let data = req.body;
			contiflow.query('select * from userTypes', (err, rows, fields) => {
				if (!err) {
				res.send(rows);
				} else {
				res.send(err);
				}
			});

		}
	 })
  });

app.get("/getAllUsers",verifyToken, (req, res) => {
	jwt.verify(req.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let data = req.body;
			contiflow.query('SELECT T0.id,T0.userName,T0.firstName,T0.lastName,T1.name as userType,T2.id as status from users T0 inner join usertypes T1 on T0.userType = T1.id inner join status T2 on T0.status = T2.id', (err, rows, fields) => {
				if (!err) {
				res.send(rows);
				} else {
				res.send(err);
				}
			});

		}
	 })
  });



app.get("/getAllNoAccess",verifyToken, (req, res) => {
	jwt.verify(req.token,'meterlink@@11', (err,authData) =>{
		if(err){
			res.json(err)
		}else{
			let data = req.body;
			contiflow.query('SELECT id,description from noaccess', (err, rows, fields) => {
				if (!err) {
				res.send(rows);
				} else {
				res.send(err);
				}
			});

		}
	 })
  });


app.get("/getAllNoAccessApp", (req, res) => {

			let data = req.body;
			contiflow.query('SELECT description as label,description as value from noaccess', (err, rows, fields) => {
				if (!err) {
				res.send(rows);
				} else {
				res.send(err);
				}
			});


  });



app.use(express.static('Storage'));

/*
app.use(express.static(__dirname + '/public/'));

  app.get('/./', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
  });
  */


app.use(express.static('public'));

app.get("/", (req,res) =>{
	res.send('index.html');

});
