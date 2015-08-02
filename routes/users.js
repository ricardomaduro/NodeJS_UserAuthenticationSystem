var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({ dest: 'uploads/' });
var User = require('../models/user');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function(req, res, next) {
  res.render('register',{
  	'title':'Register'
  });
});

router.get('/login', function(req, res, next) {
  res.render('login',{
  	'title':'Login'
  });
});

router.post('/register',upload.single('profileimage'),function(req,res,next){
	// get the form values
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;


	// check for image field

	if (req.files) {
		console.log('Uploading file...');

		var profileimageOriginalName = req.files.profileimage.originalname;
		var profileimageName = req.files.profileimage.name;
		var profileimageMime = req.files.profileimage.mimetype;
		var profileimagePath = req.files.profileimage.path;
		var profileimageExt = req.files.profileimage.extension;
		var profileimageSize = req.files.profileimage.size;

	} else {
		// set a default image
		var profileimageName='noimage.png';
	}

	// form validation

	req.checkBody('name','Name is required').notEmpty();
	req.checkBody('email','Email is required').notEmpty();
	req.checkBody('email','Email is invalid').isEmail();
	req.checkBody('username','Username is required').notEmpty();
	req.checkBody('password','Password is required').notEmpty();
	req.checkBody('password2','Passwords do not match').equals(req.body.password);

	// check for errors

	var errors = req.validationErrors();

	if(errors){
		res.render('register',{
			errors: errors,
			name: name,
			email: email,
			username: username,
			password: password,
			password2: password2
		});
	} else {
		var newUser = new User({
			name: name,
			email: email,
			username: username,
			password: password,
			profileimage: profileimageName
		});

		// create user
		User.createUser(newUser, function(err,user){
			if (err) throw err;
			console.log(user);
		});

		//success message
		req.flash('success','You are now registered you may login');
		res.location('/');
		res.redirect('/');

	}
});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new localStrategy(
	function(username, password, done){
		User.getUserByUsername(username, function(err,user){
			if (err) throw err;
			if(!user) {
				console.log('Unknown user');
				return done(null,false,{message:'Unknown user'});
			}
		
			User.comparePassword(password, user.password, function(err, isMatch){
				if (err) throw err;
				if (isMatch){
					return done(null, user);
				} else {
					console.log('Invalid password');
					return done(null,false,{message:'Invalid password'});
				}
			});
		});
	}
));

router.post('/login',passport.authenticate('local',{failureRedirect:'/users/login',failureFlash:'Invalid user or password'}),function(req,res){
	console.log('Authentication Successful');
	req.flash('success','You are logged in');
	res.redirect('/');
});

router.get('/logout',function(req,res){
	req.logout();
	req.flash('success', 'You have logged out');
	res.redirect('/users/login');
});

module.exports = router;
