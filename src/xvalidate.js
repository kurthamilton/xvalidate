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

    class Form {
        constructor($form) {
            let self = this;

            this.$form = $form;
            /* set up targets and validations */

            let targets = this.targets = {};
            let validations = this.validations = [];

            // todo: handle dynamic forms
            // todo: handle forms within forms
            let $targets = $('[' + constants.attr.plugins + ']', $form);
            $targets.each(function() {
                let target = new Target(self, $(this));
                targets[target.name] = target;
                validations.push(...target.validations);
            });

            /* set up messages */
            // todo: move message to target. This would mean a selector per target, unless it is passed in to the constructor
            let messages = this.messages = {};
            $('[' + constants.attr.message + ']', $form).each(function() {
                let message = $(this);
                message.addClass(constants.classes.message);
                let targetName = message.attr(constants.attr.message);
                messages[targetName] = message;
            });
        }

        hideMessages() {
            $.each(this.messages, (key, message) => {
                message.html('').removeClass(constants.classes.messageInvalid);
            });
        }

        invalidCount(value) {
            return utils.data(this.$form, constants.data.invalidCount, value);
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
            $('button', this.$form).on('click', callback);
            return;
        }

        showError(target, messageText) {
            let message = this.messageFor(target);
            message.html(message.html() + messageText + ' ').addClass(constants.classes.messageInvalid);
        }

        trigger(name) {
            this.$form.trigger(name);
        }

        /** Gets or sets a value indicating the form is validating. */
        validating(isValidating) {
            // update targets and messages if setting a value
            if (isValidating !== undefined) {
                // hide messages if validating
                if (isValidating === true) {
                    this.hideMessages();
                }

                // set or remove validating css class on targets and messages
                $.each(this.targets, (key, target) => target.validating(isValidating));
                $.each(this.messages, (key, message) => utils.class(message, constants.classes.validating, isValidating));
            }

            // set data on form
            return utils.data(this.$form, constants.data.validating, isValidating);
        }
    }

    class Plugin {
        constructor(options) {
            this.callback = options.callback;
            this.data = options.data;
            this.message = options.message;
            this.name = options.name;
            this.url = options.url;
        }

        isValid(result) {
            return this.callback(result) === true;
        }
    }

    class Target {
        constructor(form, $element) {
            /* set up validations */
            let pluginNameString = $element.attr(constants.attr.plugins);
            if (!pluginNameString) {
                return;
            }

            $element.addClass(constants.classes.target);

            let pluginNames = pluginNameString.split(',');
            let validations = this.validations = [];
            $.each(pluginNames, (i, pluginName) => {
                let plugin = Plugins.get(pluginName);
                if (plugin) {
                    let validation = new Validation(this, plugin);
                    validations.push(validation);
                }
            });

            this.$element = $element;
            this.form = form;
            this.name = $element[0].name;
        }

        valid(isValid, message) {
            if (isValid === false) {
                this.form.invalidCount(this.form.invalidCount() + 1);
                this.form.showError(this, message);
                this.$element.addClass(constants.classes.targetInvalid);
            }
            return utils.data(this.$element, constants.data.valid, isValid);
        }

        validating(isValidating) {
            if (isValidating === true) {
                this.$element.removeClass(constants.classes.targetInvalid);
            }
            utils.class(this.$element, constants.classes.validating, isValidating);
        }
    }

    class Validation {
        constructor(target, plugin) {
            this.plugin = plugin;
            this.target = target;
        }

        createRequest() {
            return $.ajax({
                url: this.plugin.url,
                data: this.data()
            });
        }

        data() {
            // todo: bind plugin.data to form
            return { key: 1 };
        }

         message() {
            // todo: bind plugin.message to form
            return this.plugin.message;
        }

        validate(result) {
            let isValid = this.plugin.isValid(result);
            this.target.valid(isValid, this.message());
        }
    }

    class Validator {
        constructor($form) {
            let form = this.form = new Form($form);
            form.onValidateRequired(() => this.validate());
        }

        onFail(reason) {
            console.log('an error has occurred:');
            console.log(reason);
        }

        onFulfilled(validations, results) {
            $.each(results, (i, result) => {
                this.form.validations[i].validate(result);
            });
        }

        start() {
            this.form.trigger(constants.events.validating);
            this.form.validating(true);
            this.form.invalidCount(0);
        }

        stop() {
            this.form.validating(false);
            this.form.trigger(constants.events.validated);
        }

        validate() {
            if (this.form.validating() === true) {
                return;
            }

            this.start();

            let validations = this.form.validations;
            let requests = $.map(validations, validation => validation.createRequest());

            Promise
                .all(requests)
                .then(results => this.onFulfilled(validations, results), reason => this.onFail(reason))
                .catch(reason => this.onFail(reason))
                .then(() => this.stop());
        }
    }

    // jQuery plugin
    let validators = [];
    $.fn.xvalidate = function (options) {
        return this.each((i, form) => validators.push(new Validator($(form))));
    };

    return X;
})(jQuery, XValidate);

// invoke default implementation
$(function() {
    $('[data-xval-form]').xvalidate();
});