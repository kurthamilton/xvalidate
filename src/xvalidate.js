'use strict';

var XValidate = window.XValidate || {};

(function ($, X) {
    const utils = {
        // adds or removes the class from the element based on the set value.
        setClass: ($element, className, set) => {
            return set === true ? $element.addClass(className) : $element.removeClass(className);
        }
    };

    const constants = {
        attr: {
            // A form to be validated. Required. Form elements will be validated on submit. Other elements will be validated on a descendant button click.
            form: 'data-xval-form',
            // The plugins an element within a form requires to be validated. Required. Set to a comma separated list of plugin names.
            // Add an accompanying plugin via XValidate.Plugins.add(options).
            plugins: 'data-xval-plugins',
            // The message displaying the validation message. Optional. Set to the name of the element.
            message: 'data-xval-message-for',
            // The element whose click event triggers a form validation. Optional. Not required if validating a form element or a non-form element with a button.
            submit: 'data-xval-submit'
        },
        // CSS classes added by the validator for styling. Can be overridden by setting options.classes on setup.
        classes: {
            // todo: match bootstrap conventions?
            message: 'validation-message',
            messageInvalid: 'validation-message--invalid',
            target: 'validation-target',
            targetInvalid: 'validation-target--invalid',
            // added to the target and message
            validating: 'validating'
        },
        // privately used data keys
        data: {
            invalidCount: '_xval-invalidCount',
            validating: '_xval-validating'
        },
        // The events triggered during validation.
        events: {
            // Triggered on the form when validation starts.
            validating: 'xval.validating',
            // Triggered on the form when validation ends. Returns event args with params: valid
            validated: 'xval.validated'
        }
    };

    let plugins = {};
    let Plugins = {
        add: function(options) {
            /* validate options */
            if (!options.name || !options.url) {
                console.log('plugin name or url not specified');
                return;
            }

            // check validateResult is a function
            if (options.validateResult && typeof options.validateResult !== 'function') {
                console.log('validateResult is not a function');
                return;
            }

            // check getData is a function
            if (options.getData && typeof options.getData !== 'function') {
                console.log('getData is not a function');
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

    class Form {
        constructor($form, options) {
            let self = this;

            // set classes. this is required by the Target constructor
            this.classes = $.extend({}, constants.classes, options ? options.classes : null);

            /* set up targets and validations */
            let targets = [];
            let validations = [];

            // todo: handle dynamic forms
            // todo: optimise
            let $nestedTargets = $(`[${constants.attr.form}] [${constants.attr.plugins}]`, $form);
            let $targets = $(`[${constants.attr.plugins}]`, $form).not($nestedTargets);
            $targets.each(function() {
                let target = new Target(self, $(this));
                if (target.validations.length > 0) {
                    targets.push(target);
                    validations.push(...target.validations);
                }
            });

            /* set up messages */
            let messages = {};
            $(`[${constants.attr.message}]`, $form).each(function() {
                let message = $(this);
                message.addClass(self.classes.message);
                let targetName = message.attr(constants.attr.message);
                messages[targetName] = message;
            });

            this.$form = $form;
            this.messages = messages;
            this.targets = targets;
            this.validations = validations;
        }

        get invalidCount() {
            return this.$form.data(constants.data.invalidCount);
        }
        set invalidCount(value) {
            this.$form.data(constants.data.invalidCount, value);
        }

        get validating() {
            return this.$form.data(constants.data.validating);
        }
        set validating(value) {
            this.$form.data(constants.data.validating, value);
        }

        clearMessages() {
            $.each(this.messages, (key, message) =>
                message.html('')
                       .removeClass(this.classes.messageInvalid)
                );
        }

        messageFor(target) {
            return this.messages[target.name];
        }

        onValidateRequired(callback) {
            if (this.$form.is('form')) {
                this.$form.on('submit', (e) => {
                    callback(e);
                    return false;
                });
                return;
            }
            $(`button,[${constants.attr.submit}]`, this.$form).on('click', callback);
            return;
        }

        onValidateStart() {
            this.trigger(constants.events.validating);
            this.validating = true;
            this.setChildrenValidating(true);
            this.clearMessages();
            this.invalidCount = 0;
        }

        onValidateStop() {
            this.validating = false;
            this.setChildrenValidating(false);
            this.trigger(constants.events.validated, {
                valid: this.invalidCount === 0
            });
        }

        setChildrenValidating(value) {
            // update target validating values
            $.each(this.targets, (i, target) => {
                target.validating = value;
                return true; // to stay in loop
            });

            // add or remove validating css class on messages
            $.each(this.messages, (key, message) => utils.setClass(message, this.classes.validating, value));
        }

        trigger(eventType, e) {
            this.$form.trigger(eventType, e);
        }
    }

    class Plugin {
        constructor(options) {
            let defaults = {
                message: 'invalid',
                getData: function(target) {
                    return { [`${target.name}`]: `'${target.value}'` };
                },
                validateResult: function(result) {
                    return result === true;
                }
            };

            options = $.extend({}, defaults, options);

            this.ajaxOptions = options.ajaxOptions;
            this.message = options.message;
            this.name = options.name;
            this.getData = options.getData;
            this.validateResult = options.validateResult;
            this.url = options.url;
        }

        isValid(result) {
            return this.validateResult(result) === true;
        }
    }

    class Target {
        constructor(form, $element) {
            $element.addClass(form.classes.target);

            /* set up validations */
            let validations = [];

            let pluginNames = $element.attr(constants.attr.plugins).split(',');
            $.each(pluginNames, (i, pluginName) => {
                if (pluginName) {
                    let plugin = Plugins.get(pluginName);
                    if (plugin) {
                        validations.push(new Validation(this, plugin));
                    } else {
                        console.log(`plugin ${pluginName} not found`);
                    }
                }
            });

            this.$element = $element;
            this.form = form;
            this.name = $element[0].name;
            this.validations = validations;
        }

        set validating(value) {
            if (value === true) {
                this.$element.removeClass(this.form.classes.targetInvalid);
            }
            utils.setClass(this.$element, this.form.classes.validating, value);
        }

        get value() {
            return this.$element.val();
        }

        showError(messageText) {
            this.$element.addClass(this.form.classes.targetInvalid);
            let message = this.form.messageFor(this);
            message.html(message.html() + messageText + ' ')
                   .addClass(this.form.classes.messageInvalid);
        }
    }

    class Validation {
        constructor(target, plugin) {
            this.plugin = plugin;
            this.target = target;
        }

        createRequest() {
            return $.ajax($.extend({}, this.plugin.ajaxOptions, {
                url: this.plugin.url,
                data: this.plugin.getData(this.target)
            }));
        }

        message() {
            // todo: bind plugin.message to form
            return this.plugin.message;
        }

        validate(result) {
            let isValid = this.plugin.isValid(result);
            if (isValid === false) {
                this.target.form.invalidCount++;
                this.target.showError(this.message());
            }
        }
    }

    class Validator {
        constructor($form, options) {
            let form = new Form($form, options);
            form.onValidateRequired(() => this.validate());

            this.form = form;
        }

        onFail(reason) {
            console.log('an error has occurred:');
            console.log(reason);
        }

        onFulfilled(results) {
            $.each(results, (i, result) => this.form.validations[i].validate(result));
        }

        validate() {
            if (this.form.validating === true) {
                return;
            }

            this.form.onValidateStart();

            let requests = $.map(this.form.validations, validation => validation.createRequest());

            Promise
                .all(requests)
                .then(results => this.onFulfilled(results), this.onFail)
                .catch(this.onFail)
                .then(() => this.form.onValidateStop());
        }
    }

    // jQuery plugin
    let validators = [];
    $.fn.xvalidate = function (options) {
        return this.each((i, form) => validators.push(new Validator($(form), options)));
    };

    // expose public functions
    $.extend(X, {
        Constants: constants,
        Plugins: Plugins
    });

    return X;
})(jQuery, XValidate);

// invoke default implementation
$(function() {
    $('[data-xval-form]').xvalidate();
});