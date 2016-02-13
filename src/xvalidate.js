'use strict';

var XValidate = window.XValidate || {};

(function ($, X) {
    const utils = { 
        // adds or removes the class from the element based on the set value.
        class: ($element, className, set) => {
            return set === true ? $element.addClass(className) : $element.removeClass(className);            
        },
        // Gets or sets data associated with the element. Gets data if value is undefined, else sets data. 
        data: ($element, key, value) => {
            if (value === undefined) {
                return $element.data(key);
            }
            return $element.data(key, value);
        }
    };
    
    const constants = {
        attr: {
            // An element within a form (see below) to be validated. Required. Set to a comma separated list of plugin names.
            // Add an accompanying plugin via XValidate.Plugins.add(options).
            plugins: 'data-xval-plugins',
            // A form to be validated. Required. Form elements will be validated on submit. Other elements will be validated on a descendant button click.
            form: 'data-xval-form',
            // The message displaying the validation message. Optional. Set to the name or id of the element.
            message: 'data-xval-message-for'
        },
        // CSS classes added by the validator. Can be used for styling
        classes: {
            message: 'validation-message',
            messageInvalid: 'validation-message--invalid',
            target: 'validation-target',
            targetInvalid: 'validation-target--invalid',
            // added to the target and message
            validating: 'x-validating'
        },
        // privately used data keys
        data: {                         
            invalidCount: '_xval-invalidCount',
            validating: '_xval-validating',
            valid: '_xval-valid'
        },
        // The events triggered during validation.
        events: {                       
            // Triggered on the form when validation starts.
            validating: 'xval.validating',
            // Triggered on the form when validation ends.
            validated: 'xval.validated'		
        }
    };
    
    let plugins = {};
    let Plugins = X.Plugins = {
        add: function(options) {
            let defaults = {
                message: 'invalid',
                data: '{0}',
                callback: function(result) {
                    return result === true;
                }
            };
            
            options = $.extend(defaults, options);
            
            /* validate options */
            if (!options.name || !options.url) {
                console.log('plugin name or url not specified');
                return;
            }
            
            // check callback is a function
            if (typeof options.callback !== 'function') {
                console.log('callback is not a function');
                return;
            }
            
            // only allow alpha-numeric, underscore and hyphens in plugin names
            if (/[^\w|\-]+/.test(options.name)) {
                console.log(`invalid plugin name '${options.name}'`);
                return;
            }
            
            // enforce unique plugin names
            if (plugins.hasOwnProperty(options.name)) {
                console.log(`plugin '${options.name}' has already been added`);
                return;
            }
            
            plugins[options.name] = new Plugin(options);
        },
        addRange: function(items) {
            $.each(items, key => {
                Plugins.add(items[key]);
            });
        },
        get: function(name) {
            return plugins[name];
        }
    };
    
    function Form ($form){
        let self = this;
        
        /* set up targets and validations */
        
        let targets = {};
        let validations = [];
        
        // todo: handle dynamic forms
        // todo: handle forms within forms
        let $targets = $('[' + constants.attr.plugins + ']', $form); 
        $targets.each(function() {
            let target = new Target(self, $(this));
            
            if (!target.name) {
                return true;
            }
            
            targets[target.name] = target;
            validations.push(...target.validations);
        });
        
        /* set up messages */
        // todo: move message to target. This would mean a selector per target, unless it is passed in to the constructor
        let messages = {};
        $('[' + constants.attr.message + ']', $form).each(function() {
            let message = $(this);
            message.addClass(constants.classes.message);
            let targetName = message.attr(constants.attr.message);
            messages[targetName] = message;
        });                  
                       
        /* public functions */   
        this.hideMessages = function() {
            $.each(messages, (key, message) => {
                message.html('').removeClass(constants.classes.messageInvalid);
            });
        };
        this.invalidCount = function(value) {
            return utils.data($form, constants.data.invalidCount, value);
        };
        this.messageFor = function(target) {
            return messages[target.name];
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
        this.showError = function(target, messageText) {
            let message = self.messageFor(target);
            message.html(message.html() + messageText + ' ').addClass(constants.classes.messageInvalid);
        };
        this.trigger = function(name) {
            $form.trigger(name);
        };       
        /** Gets or sets a value indicating the form is validating. */ 
        this.validating = function(isValidating) {            
            // update targets and messages if setting a value
            if (isValidating !== undefined) {
                // hide messages if validating
                if (isValidating === true) {
                    self.hideMessages();
                }
                
                // set or remove validating css class on targets and messages
                $.each(targets, (key, target) => target.validating(isValidating));
                $.each(messages, (key, message) => utils.class(message, constants.classes.validating, isValidating));
            }            
            
            // set data on form
            return utils.data($form, constants.data.validating, isValidating);
        };
        this.validations = function() {
            return validations;
        };       
    };
        
    function Plugin(options) {                                    
        /* public properties */
        this.data = options.data;
        this.message = options.message;  
        this.name = options.name;
        this.url = options.url;
        
        /* public functions */
        this.isValid = function(result) {
            return options.callback(result) === true;
        };
    }

    function Target(form, $element) {
        let self = this;                        
        
        /* set up validations */
        let pluginNameString = $element.attr(constants.attr.plugins);
        if (!pluginNameString) {
            return;
        }
        
        $element.addClass(constants.classes.target);
        
        let pluginNames = pluginNameString.split(',');
        let validations = [];
        $.each(pluginNames, function(i, pluginName) {
            let validation = new Validation(self, pluginName);
            if (!validation.plugin) {
                return true;
            }
            
            validations.push(validation);
        });

        /* public properties */
        this.name = $element[0].name;
        this.validations = validations;
        
        /* public functions */                 
        this.valid = function(isValid, message) {
            if (isValid === false) {				
                form.invalidCount(form.invalidCount() + 1);
                form.showError(self, message);
                $element.addClass(constants.classes.targetInvalid);
            }
            return utils.data($element, constants.data.valid, isValid);
        };
        this.validating = function(isValidating) {
            if (isValidating === true) {
                $element.removeClass(constants.classes.targetInvalid);                
            }            
            utils.class($element, constants.classes.validating, isValidating);
        };       
        this.value = function() {
            return $element.val();
        };
    }
    
    function Validation(target, pluginName) {
        let plugin = Plugins.get(pluginName);
        if (!plugin) {
            return;
        }
        
        function getData() {
            // todo: bind plugin.data to form
            return { key: 1 };
        }
        
        function getMessage() {
            // todo: bind plugin.message to form
            return plugin.message;
        }
        
        /* public properties */
        this.plugin = plugin;
        this.target = target;
        
        /* public functions */
        this.createRequest = function() {
            return $.ajax({
                url: plugin.url,
                data: getData()
            });
        };        
        
        this.validate = function(result) {
            let isValid = plugin.isValid(result);
            target.valid(isValid, getMessage());
        };
    };
    
    function Validator(form) {
        function start() {
            form.trigger(constants.events.validating);
            form.validating(true);
            form.invalidCount(0);
        }
        
        function stop() {
            form.validating(false);
            form.trigger(constants.events.validated);
        }
        
        function onFulfilled(validations, results) {
            $.each(results, (i, result) => {                   
                validations[i].validate(result);
            });
        };
        
        function onFail(reason) {
            console.log('an error has occurred:');
            console.log(reason);            
        };
        
        /* public functions */   
        this.validate = function() {
            if (form.validating() === true) {
                return;
            }
            
            start();
            
            let validations = form.validations();
            let requests = $.map(validations, validation => validation.createRequest());        
            
            Promise
                .all(requests)
                .then(results => onFulfilled(validations, results), onFail)
                .catch(onFail)
                .then(stop);
        };
        
        return this;                        
    }
    
    // jQuery plugin
    $.fn.xvalidate = function (options) {
        return this.each(function() {            
            let form = new Form($(this));
			let validator = new Validator(form);
            form.onValidateRequired(validator.validate);
        });
    };
    
    return X;
})(jQuery, XValidate);

 

// invoke
$(function() {
    /*default implementation*/
    $('[data-xval-form]').xvalidate();
});