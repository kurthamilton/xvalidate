'use strict';

var XValidate = window.XValidate || {};

// classes
(function ($, X) {
    const utils = { 
        data: function($element, name, value) {
            if (value === undefined) {
                return $element.data(name);
            }
            $element.data(name, value);
        }
    };
    
    const constants = {
        attr: {
            data: 'xval-data',			// The data to pass to the request. Optional. Key names must be quoted for JSON.parse. Fallback to an object like: { elementname: elementvalue }.
            element: 'xval',			// An element within a form (see below) to be validated. Required.
            form: 'xval-form',			// A form to be validated. Required. Will be validated on submit if a form, else by a button click if anything else.
            url: 'xval-url',			// The url for the request. Required.
            message: 'xval-message-for'	// The message displaying the validation message. Optional. Set to the name or id of the element.
        },
        classes: {                      // CSS classes added by the validator. Can be used for styling
            messageValid: 'field-validation-valid',
            messageInvalid: 'field-validation-invalid field-validation-error',
            validating: 'x-validating'
        },
        data: {                         // The data-* attributes used privately
            invalidCount: '_xval-invalidCount',
            validating: '_xval-validating',
            valid: '_xval-valid'
        },
        events: {                       // The events triggered during validation.
            validating: 'xval.validating',	// Triggered on the form when validation starts.
            validated: 'xval.validated'		// Triggered on the form when validation ends.
        }
    };
    
    let plugins = {};
    
    $.extend(X, {
        Form: function($form) {
            var self = this;
            
            this.errorLabelFor = function(target) {
                return $('[data-' + constants.attr.message + '="' + target.name() + '"]', $form);
            };
            
            this.hideErrors = function (target) {
                this.errorLabelFor(target)
                    .html('')
                    .removeClass(constants.classes.messageInvalid)
                    .addClass(constants.classes.messageValid);
            };
            
            this.invalidCount = function(value) {
                return utils.data($form, constants.data.invalidCount, value);
            };
            
            this.onValidateRequired = function(callback) {                
                if ($form.is('form')) {
                    $form.on('submit', (e) => {
                        callback(e);
                        return false;
                    });
                    return;
                }
                $('button', $form).on('click', callback);
                return;
            };
            
            this.showError = function(target) {
                this.errorLabelFor(target)
                    .html(self.errorLabelFor(target).html() + 'error message ')
                    .removeClass(constants.classes.messageValid)
                    .addClass(constants.classes.messageInvalid);
            };
            
            this.targets = function() {
                let elements = $('[data-' + constants.attr.element + ']', $form);
                return $.map(elements, (element) => new X.Target(self, $(element)));
            };
            
            this.trigger = function(name) {
                $form.trigger(name);
            };
            
            this.validating = function(value) {
                return utils.data($form, constants.data.validating, value);
            };
            
            return this;
        },
        Plugin: function(name, callback) {
            this.name = name;
            
            this.validate = function(result) {
                return callback(result) === true;
            };
            
            return this;
        },
        Plugins: {
            add: function(name, callback) {
                // todo - validate name. 
                // don't allow overwrite
                // verify callback is a function
                plugins[name] = callback;
            },
            get: function(name) {
                // todo
            }
        },
        Target: function(form, $element) {
            var self = this;
            
            this.data = function() {
                return JSON.parse(self.dataTemplate().replace('{0}', $element.val()));
            };
            
            this.dataTemplate = function() {
                if ($element[0].hasAttribute('data-' + constants.attr.data)) {
                    return JSON.stringify(utils.data($element, constants.attr.data));
                }
                return '{ "' + $element[0].name || $element[0].id + '":"{0}"}';
            };
            
            this.name = function() {
                return $element[0].name;
            };
            
            this.url = function() {
                return utils.data($element, constants.attr.url);
            };
            
            this.valid = function(value) {
                if (value === false) {				
                    form.invalidCount(form.invalidCount() + 1);
                    form.showError(self);
                }
                return utils.data($element, constants.data.valid, value);
            };
        },
        Validator: function(form) {            
            // private functions
            var start = function() {
                form.trigger(constants.events.validating);
                form.validating(true);
                form.invalidCount(0);
            };
            
            var stop = function() {
                form.validating(false);
                form.trigger(constants.events.validated);
            };
            
            var createRequest = function(target) {
                return $.ajax({
                        url: target.url(),
                        data: target.data()
                    });
            };
            
            var createRequests = function(targets) {         
                return $.map(targets, (target) => createRequest(target));
            };
            
            var onFulfilled = function(targets, results) {
                for (let i = 0; i < results.length; i++) {
                    let target = targets[i];
                    // todo: handle multiple vals per target
                    form.hideErrors(target);
                    // todo: review this line. Presumably results are just the array of ajax results
                    let result = results.length === 1 ? results[0] : results[i][0];
                    // todo: configure result eval. ***Plugin***
                    let isValid = result === true;
                    target.valid(isValid);
                }
            };
            
            var onRejected = function() {
                
            };       
            
            // public functions
            this.validate = function() {
                if (form.validating() === true) {
                    return;
                }
                
                start();
                
                let targets = form.targets();
                let requests = createRequests(targets);        
                
                Promise
                    .all(requests)
                    .then((results) => onFulfilled(targets, results), onRejected)
                    .then(stop);         
            };                        
        }
    });
})(jQuery, XValidate);

// jQuery plugin 
(function ($, X) {
    $.fn.xvalidate = function (options) {
        return this.each(() => {            
            let form = new X.Form($(this));
			let validator = new X.Validator(form);
            form.onValidateRequired(validator.validate);
        });
    };
})(jQuery, XValidate);

// invoke
$(function() {
    /*default implementation*/
    let forms = $('[data-xval-form]').xvalidate();
    console.log(forms);
});