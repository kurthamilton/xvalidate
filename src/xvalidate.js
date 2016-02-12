'use strict';

var XValidate = window.XValidate || {};

// classes
(function ($, X) {
    const utils = { 
        // Gets or sets data associated with the element. Gets data if value is undefined, else sets data. 
        data: ($element, key, value) => {
            if (value === undefined) {
                return $element.data(key);
            }
            $element.data(key, value);
        }
    };
    
    const constants = {
        attr: {
            plugins: 'xval',			// An element within a form (see below) to be validated. Required. Set to a comma separated list of plugin names. 
                                        // Evaluated in order. Wrap in square brackets to hide message if predecessors fail.
                                        // Set plugin context in data-xval-{pluginname}. { message: '', url: '', data: { ''somekey'': {0}' } }
            form: 'xval-form',			// A form to be validated. Required. Form elements will be validated on submit. Other elements will be validated on a descendant button click.
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
            let self = this;
            
            return {
                errorLabelFor: function(target) {
                    return $('[data-' + constants.attr.message + '="' + target.name + '"]', $form);
                },
                hideErrors: function (target) {
                    self.errorLabelFor(target)
                        .html('')
                        .removeClass(constants.classes.messageInvalid)
                        .addClass(constants.classes.messageValid);
                },
                invalidCount: function(value) {
                    return utils.data($form, constants.data.invalidCount, value);
                },
                onValidateRequired: function(callback) {                
                    if ($form.is('form')) {
                        $form.on('submit', (e) => {
                            callback(e);
                            return false;
                        });
                        return;
                    }
                    $('button', $form).on('click', callback);
                    return;
                },
                showError: function(target) {
                    self.errorLabelFor(target)
                        .html(self.errorLabelFor(target).html() + 'error message ')
                        .removeClass(constants.classes.messageValid)
                        .addClass(constants.classes.messageInvalid);
                },
                targets: function() {
                    let $elements = $('[data-' + constants.attr.plugins + ']', $form);
                    return $.map($elements, element => new X.Target(self, $(element)));
                },
                trigger: function(name) {
                    $form.trigger(name);
                },
                validating: function(value) {
                    return utils.data($form, constants.data.validating, value);
                }
            };
        },
        Plugin: function(name, callback) {            
            return {
                get name() {
                    return name;
                },            
                validate: function(result) {
                    return callback(result) === true;
                }
            };
        },
        PluginContext: function($element, pluginName) {
            let self = this;
            
            let context = JSON.parse(utils.data($element, `${constants.attr.plugins}-${pluginName}`));                
            
            let dataTemplate = context.data;
            if (dataTemplate) {
                context.dataTemplate = JSON.stringify(dataTemplate);                
            } else {
                context.dataTemplate = `{ "${$element[0].name || $element[0].id}":"{0}"}`;
            }
            
            return {
                data: function() {
                    // todo: string interpolation model binding style?
                    return JSON.parse(self.dataTemplate.replace('{0}', $element.val()));
                },
                get dataTemplate() {
                    return context.dataTemplate;
                },
                get message() {
                    return context.message;
                },
                get pluginName() {
                    return pluginName;
                },                
                get url() {
                    return context.url;
                }
            };
        },
        Plugins: {
            add: function(name, callback) {
                if (!name || typeof callback !== 'function') {
                    return;
                }
                
                // only allow alpha-numeric, underscore and hyphens in plugin names 
                if (/[^\w|\-]+/.test(name)) {
                    console.log(`invalid plugin name '${name}'`);
                }
                
                if (plugins.hasOwnProperty(name)) {
                    console.log(`plugin '${name}' has already been added`);
                    return;
                }
                
                plugins[name] = callback;
            },
            all: function () {
                return plugins;
            },
            get: function(name) {
                return plugins[name];
            }
        },
        Target: function(form, $element) {
            let self = this;                        
            
            let pluginNames = utils.data($element, constants.attr.plugins).split(',');
            let pluginContexts = $.map(pluginNames, pluginName => new X.PluginContext($element, pluginName));
            
            function getPluginContext(pluginName) {
                return pluginContexts[pluginName];
            }
            
            function createRequest(pluginName) {
                let context = getPluginContext(pluginName);
                return $.ajax({
                    url: target.url,
                    data: target.data()
                });
            }
            
            return {
                createRequests: function() {
                    return $.map(pluginNames, pluginName => createRequest);
                },
                get name() {
                    return $element[0].name;
                },
                valid: function(value) {
                    if (value === false) {				
                        form.invalidCount(form.invalidCount() + 1);
                        form.showError(self);
                    }
                    return utils.data($element, constants.data.valid, value);
                }
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
            
            var createRequests = function(targets) {
                let requests = [];
                // todo: review this loop within a loop
                for (let t = 0; t < targets.length; t++) {
                    requests.push(...targets(t).createRequests());
                }
                
                return requests;
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
            
            return {
                validate: function() {
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
                }         
            };                        
        }
    });
    
    return X;
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