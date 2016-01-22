#Email sender

Simple command line tool to automate sending repetitive template based emails to set of users.

Uses Handlebars as a template engine to produce emails to be sent.

Source data from CSV file.

## Usage

```bash
  node send_mail.js --template=<handlebar-template-file> --data=<csv-file-with-data>
```

## Description

Sometimes there is a need to communicate with large pool of users regarding same
subject. E.g. ask customers to provide feedback about particular feature etc.

There are few options to deal with this task: send email manually via web interface
or use some existing email marketing tools like http://mailchimp.com/ or http://www.dotmailer.com/

This little tool provide simple alternative. It allows to compile CSV file with
data for each recipient and feed it into handlebar template.

## Example

Lets assume we have such template for email we want to send:

  template/basic_email.hbs

```html
Email regarding {{application_name}}
=====
Hello {{name}},

We are glad to see you as our customer.

Feel free to contact us via {{contact_email}}

Thanks
{{signature_name}}
```

To define the values for placeholders we would need to have following CSV file (data/users.csv):

```csv
application_name, email, name, contact_email, signature_name
TimeOff.Management,pavlo@timeoff.management,Pavel,test@test.com,PavloV
TimeOff.Management,noreply@timeoff.management,BOT,test@test.com,Pavlo
```

To send emails one needs to run following command:

```bash
node send_mail.js --template="template/basic_email.hbs" --data="data/users.csv"
```

### Notes

* Email template has to sections: subject and body. The delimiter between then is
a line "=====", make sure that it has exactly 5 "=" characters and no leading/trailing
spaces.

* For every placeholder in template there should be a column in a CSV file that is
going to be used in a conjunction.

* CSV file *must* have a column "email" with email address of the user

## Configuration

Prior using make sure that configuration file points to correct SMTP server. Please check config.json

