# xvalidate
XValidate is a jQuery extension for validating a form via ajax requests.

Associate yourHTML form elements with your own plugin configuration. XValidate takes care of the rest.

## Getting started
Decorate your form and elements. Validation will be triggered by a form submit.
```html
<form data-xval-form>
  <input type="text" name="myControl" data-xval-plugins="myPlugin,myOtherPlugin" />
  <span data-xval-message-for="myControl"></span>
</form>
```

You can also validate any other elements as if they were forms. Validation will be triggered by a button click.
```html
<div data-xval-form>
  ...
  <button>Add</button>
  ... OR
  <a href="#" data-xval-submit>Add</a>
</div>
```


And add a corresponding plugin:
```javascript
XValidate.plugins.add({
  name: 'myPlugin',
  url: '/myapi/method',
  message: '${0} is already taken',
  validateResult: function(result){
    return result.length === 0;
  }
});
```

## Pre-requisites
XValidate is written against jQuery 2.2.0

XValidate is written in ES6. It is very much an experimental journey for me into the world of ES6, and is not intended for production use. 

I am transpiling to ES5 using babel via gulp. To run the gulp task in Node.js, ensure the following are installed in the project folder:

```
npm install gulp -g
npm install gulp --save-dev
npm install gulp-babel --save-dev
npm install babel-preset-es2015 --save-dev
npm install gulp-plumber --save-dev
```
