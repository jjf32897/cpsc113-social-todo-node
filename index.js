var express = require('express');
var exphbs  = require('express-handlebars');
var hbs = require('handlebars');
var app = express();
var nodemailer = require('nodemailer');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL);
var Users = require('./models/users.js');
var Tasks = require('./models/tasks.js');

var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "cpsc113.todo.notification@gmail.com",
        // https://www.youtube.com/watch?v=bLE7zsJk4AI
        pass: "fourwordsalluppercase"
    }
});

// Configure our app
var store = new MongoDBStore({
  uri: process.env.MONGO_URL,
  collection: 'sessions'
});
app.use(express.static('css'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('views', __dirname + '/views');
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
// Configure session middleware that will parse the cookies
// of an incoming request to see if there is a session for this cookie.
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: 'auto' },
  store: store
}));

// Middleware that looks up the current user for this sesssion, if there
// is one.
app.use(function(req, res, next){
  if(req.session.userId){
    Users.findById(req.session.userId, function(err, user){
      if(!err){
        res.locals.currentUser = user;
      }
      next();
    });
  }else{
    next();
  }
});

// Middleware that checks if a user is logged in. If so, the
// request continues to be processed, otherwise a 403 is returned.
function isLoggedIn(req, res, next){
  if(res.locals.currentUser){
    next();
  }else{
    res.sendStatus(403);
  }
}

// Middleware that loads a users tasks if they are logged in.
function loadUserTasks(req, res, next) {
  if(!res.locals.currentUser){
    return next();
  }
  Tasks.find({}).or([
      {owner: res.locals.currentUser},
      {collaborators: res.locals.currentUser.email}])
    .exec(function(err, tasks){
      if(!err){
        for (var i = 0; i < tasks.length; i++) {
          if (tasks[i].owner.toString() == res.locals.currentUser._id.toString())
          {
            tasks[i].isOwner = 1;
          }else{
            tasks[i].isOwner = 0;
          }
        }
        res.locals.tasks = tasks;
      }
      next();
  });
}

// Return the home page after loading tasks for users, or not.
app.get('/', loadUserTasks, function (req, res) {
      res.render('index');
});

// Handle submitted form for new users
app.post('/user/register', function (req, res) {
  if (req.body.email === '' || req.body.fl_name === '' || req.body.password === '' || req.body.password_confirmation === '') {
    return res.render('index', {errors: "Please fill out all fields"});
  }
  if (req.body.password !== req.body.password_confirmation){
    return res.render('index', {errors: "Password and password confirmation do not match"});
  }
  if (req.body.fl_name.length > 50) {
    return res.render('index', {errors: "Your name cannot exceed 50 characters"});
  }
  if (req.body.password.length > 50) {
    return res.render('index', {errors: "Your password cannot exceed 50 characters"});
  }
  if (req.body.email.length > 50) {
    return res.render('index', {errors: "Your email cannot exceed 50 characters"});rin
  }
  if (req.body.fl_name.length < 1) {
    return res.render('index', {errors: "You must enter a name"});
  }
  var regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
  if (!regex.test(req.body.email))
  {
    return res.render('index', {errors: "Invalid email address"});
  }

  // Save the new user
  var newUser = new Users();
  newUser.hashed_password = req.body.password;
  newUser.email = req.body.email;
  newUser.name = req.body.fl_name;
  newUser.save(function(err, user){
    // If there are no errors, redirect to home page
    if(user && !err){
      req.session.userId = user._id;
      res.redirect('/');
    }
    var errors = "Error registering you.";
    if(err){
      if(err.errmsg && err.errmsg.match(/duplicate/)){
        errors = 'Account with this email already exists!';
      }
      return res.render('index', {errors: errors});
    }
  });
});

//logs the user in
app.post('/user/login', function (req, res) {
  // Try to find this user by email
  Users.findOne({email: req.body.email}, function(err, user){
    if(err || !user){
      return res.render('index', {errors: 'Invalid email address'});
    }

    // See if the hash of their passwords match
    user.comparePassword(req.body.password, function(err, isMatch){
      if(err || !isMatch){
        return res.render('index', {errors: 'Bad password'});
      }else{
        req.session.userId = user._id;
        res.redirect('/');
      }
    });
  });
});

// Log a user out
app.get('/user/logout', function(req, res){
  req.session.destroy(function(){
    res.redirect('/');
  });
});

//  All the controllers and routes below this require
//  the user to be logged in.
app.use(isLoggedIn);

// Handle submission of new task form
app.post('/task/create', function(req, res){
  var newTask = new Tasks();
  newTask.owner = res.locals.currentUser._id;
  newTask.title = req.body.title;
  newTask.description = req.body.description;
  newTask.collaborators = [req.body.collaborator1, req.body.collaborator2, req.body.collaborator3];
  newTask.isComplete = 0;
  newTask.save(function(err, savedTask){
    if(err || !savedTask){
      res.send('Error saving task!');
    }else{
      res.redirect('/');
    }
  });
});

//deletes a task
app.post('/task/delete/:id', function(req, res){
  Tasks.remove({_id: req.params.id}, function(err){
    if (err) {
      res.send('Error deleting task');
    }else{
      res.redirect('/');
    }
  });
});

//marks a task as complete
app.post('/task/complete/:id', function(req, res){
  Tasks.findById(req.params.id, function(err, task){
    if (err) {
      res.send('Error finding task');
    }else{
      var change = 0;
      if (!task.isComplete) {
        change = 1;
        Users.findById(res.locals.currentUser._id, function(err, user){
          if (err) {
            res.send('Database error');
          }else{
            task.collaborators.push(user.email);
          }
        });
        for (var i = 0; i < task.collaborators.length; i++)
        {
          console.log(task.collaborators[i]);
          smtpTransport.sendMail(
            {
              from: 'Jo-Jo\'s CPSC113 Todo Notifier',
              to: task.collaborators[i],
              subject: 'One of your tasks has been completed!',
              text: 'Your task ' + task.title + ' has been completed',
              html: 'Your task <b>' + task.title + '</b> has been completed.'
            }
            , function(error, info){
            if(error)
            {
              return console.log(error);
            }
          });
        }
      }
      Tasks.update({_id: req.params.id}, {isComplete: change}, function(err){
      if (err) {
        res.send('Error updating task');
      }else{
        res.redirect('/');
      }
      });
    }
  });
});

// Start the server
app.listen(process.env.PORT, function () {
  console.log('Example app listening on port ' + process.env.PORT);
});
