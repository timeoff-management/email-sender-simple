
"use strict";

var minimist = require('minimist'),
    bluebird = require('bluebird'),
    _        = require('underscore'),
    fs       = require('fs'),
    handlebars= require('handlebars'),
    csv      = bluebird.promisifyAll(require('csv')),
    nconf    = require('nconf'),
    nodemailer = require('nodemailer'),
    smtpTransport = require('nodemailer-smtp-transport');

nconf
  .argv()
  .file({ file: './config.json' });

bluebird.promisifyAll(fs);


var argv = minimist(process.argv.slice(2)),
    template_file,
    data_file;

// DEBUG
//console.dir(nconf);

// Validate passed parameters
if ( ! argv.hasOwnProperty('template') ) {
  console.warn('Missed mandatory parameter "template" that should point to file with template to use.');
  process.exit();
} else {
  template_file = argv.template;
}

if ( ! argv.hasOwnProperty('data') ) {
  console.log('Missed mandatory parameter "data" that should point to CSV file with data to use for template.');
  process.exit();
} else {
  data_file = argv.data;
}

// Make sure that files exist
bluebird.all([
  bluebird.try(check_file_exists, template_file),
  bluebird.try(check_file_exists, data_file)
])

// read files and prepare emails for sending
.then(function(){
  return bluebird.join(
    // Read the template
    fs.readFileAsync(template_file, "utf8"),
    // Read and parse the CSV file
    fs.readFileAsync(data_file, "utf8")
      .then(function(csv_content){ return csv.parseAsync(csv_content,{trim:true}); }),
    // Deal with results
    function(template_content, parsed_data){

      var template = handlebars.compile( template_content );
      var headers = parsed_data.shift();
      var emails = _.map(
        parsed_data,
        function(arr) {
          var data = _.object(headers, arr);
          return {
            body  : template( data ),
            email : data.email,
          };
        }
      );

      return bluebird.resolve(emails);
  });
})

// Convert emails from strings into objects
.then(function(emails){
  emails = _.map(
    emails,
    function(email){
      var subject_and_body = email.body.split(/\n=====\n/);
      email.subject = subject_and_body[0];
      email.body = subject_and_body[1];

      return email;
    }
  );

  return bluebird.resolve(emails);
})

.then(function(emails){
  console.dir(emails);

  var send_email = get_send_mail();

  return bluebird.all(
    _.map(emails, function(email){
      return send_email({
        from    : nconf.get("sender_email"),
        to      : email.email,
        subject : email.subject,
        text    : email.body,
      })
      .then(function(){
        return bluebird.resolve(email.email);
      });
    })
  );
})

.then(function(email_addresses){
  console.log(' Successfully sent emails to: '+email_addresses.join(', ') );
})

.then(function(){ console.log('done') })
.catch(function(error){ console.log('failed: '+ error) });


// Check that necessary files are accessible
function check_file_exists(file_name) {
  return fs.statAsync(file_name)
    .then(function(stat){
      if ( stat && stat.isFile() ) {
        return bluebird.resolve(1);
      } else {
        return bluebird.reject('File '+file_name+' does not exist');
      }
    })
    .catch(function(){
      return bluebird.reject('File '+file_name+' does not exist');
    });
}

function get_send_mail(){

  var transporter = nodemailer.createTransport(smtpTransport(
    nconf.get("email_transporter")
  ));

  var send_mail = bluebird.promisify(transporter.sendMail, transporter);

  return send_mail;
};

