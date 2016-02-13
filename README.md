# xvalidate
XValidate is a jQuery extension for validating a form via ajax requests.

Associate yourHTML form elements with your own plugin configuration. XValidate takes care of the rest.

## Getting started
Decorate your form and elements
```html
<form data-xval-form>
  <input type="text" name="myControl" data-xval-plugins="myPlugin" />
  <span data-xval-message-form="myControl"></span>
</form>
```

You can also validate any other elements as if they were forms
```html
<div data-xval-form>
  ...
</div>
```

And add a corresponding plugin:
```javascript
TODO
```

## Pre-requisites
XValidate is written against jQuery 2.2.0

XValidate is written in ES6. It is very much an experimental journey for me into the world of ES6, and is not intended for production use. 

I am transpiling to ES5 using babel via gulp. To run the gulp task in Node.js, ensure the following are installed in the project folder:

```
$ npm init
$ npm install gulp -g
$ npm install gulp --save-dev
$ npm install gulp-babel --save-dev
$ npm install babel-preset-es2015 --save-dev
$ npm install gulp-plumber --save-dev
```
