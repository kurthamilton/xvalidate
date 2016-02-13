'use strict';

var XValidate = window.XValidate || {};

// classes
(function ($, X) {
    var utils = {
        // Gets or sets data associated with the element. Gets data if value is undefined, else sets data.
        data: function data($element, key, value) {
            if (value === undefined) {
                return $element.data(key);
            }
            return $element.data(key, value);
        }
    };

    var constants = {
        attr: {
            plugins: 'data-xval-plugins', // An element within a form (see below) to be validated. Required. Set to a comma separated list of plugin names.
            // Add an accompanying plugin via XValidate.Plugins.add(options).
            form: 'data-xval-form', // A form to be validated. Required. Form elements will be validated on submit. Other elements will be validated on a descendant button click.
            message: 'data-xval-message-for' // The message displaying the validation message. Optional. Set to the name or id of the element.
        },
        classes: { // CSS classes added by the validator. Can be used for styling
            messageValid: 'field-validation-valid',
            messageInvalid: 'field-validation-invalid field-validation-error',
            validating: 'x-validating'
        },
        data: { // The data-* attributes used privately
            invalidCount: '_xval-invalidCount',
            validating: '_xval-validating',
            valid: '_xval-valid'
        },
        events: { // The events triggered during validation.
            validating: 'xval.validating', // Triggered on the form when validation starts.
            validated: 'xval.validated' // Triggered on the form when validation ends.
        }
    };

    var plugins = {};
    var Plugins = X.Plugins = {
        add: function add(options) {
            var defaults = {
                message: 'invalid',
                data: '{0}',
                callback: function callback(result) {
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
                console.log('invalid plugin name \'' + options.name + '\'');
                return;
            }

            // enforce unique plugin names
            if (plugins.hasOwnProperty(options.name)) {
                console.log('plugin \'' + options.name + '\' has already been added');
                return;
            }

            plugins[options.name] = new Plugin(options);
        },
        get: function get(name) {
            return plugins[name];
        }
    };

    function Form($form) {
        var self = this;

        /* set up validations */
        // todo: handle dynamic forms
        var validations = [];
        $('[' + constants.attr.plugins + ']', $form).each(function () {
            var target = new Target(self, $(this));

            if (!target.name) {
                return true;
            }

            $.each(target.pluginNames, function (i, pluginName) {
                var validation = new Validation(target, pluginName);
                if (!validation.target) {
                    return true;
                }

                validations.push(validation);
            });
        });

        /* set up messages */
        var messages = {};
        $('[' + constants.attr.message + ']', $form).each(function () {
            var message = $(this);
            var targetName = message.attr(constants.attr.message);
            messages[targetName] = message;
        });

        function messageFor(target) {
            return messages[target.name];
        }

        /* public functions */
        this.hideErrors = function (target) {
            var message = messageFor(target);
            message.html('').removeClass(constants.classes.messageInvalid).addClass(constants.classes.messageValid);
        };
        this.invalidCount = function (value) {
            return utils.data($form, constants.data.invalidCount, value);
        };
        this.onValidateRequired = function (callback) {
            if ($form.is('form')) {
                $form.on('submit', function (e) {
                    callback(e);
                    return false;
                });
                return;
            }
            $('button', $form).on('click', callback);
            return;
        };
        this.showError = function (target) {
            var message = messageFor(target);
            message.html(message.html() + 'error message ').removeClass(constants.classes.messageValid).addClass(constants.classes.messageInvalid);
        };
        this.trigger = function (name) {
            $form.trigger(name);
        };
        this.validating = function (value) {
            return utils.data($form, constants.data.validating, value);
        };
        this.validations = function () {
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
        this.isValid = function (result) {
            return options.callback(result) === true;
        };
    }

    function Target(form, $element) {
        var self = this;

        var pluginNameString = $element.attr(constants.attr.plugins);
        if (!pluginNameString) {
            return;
        }

        /* public properties */
        this.name = $element[0].name;
        this.pluginNames = pluginNameString.split(',');

        /* public functions */
        this.valid = function (value) {
            if (value === false) {
                form.invalidCount(form.invalidCount() + 1);
                form.showError(self);
            }
            return utils.data($element, constants.data.valid, value);
        };

        this.value = function () {
            return $element.val();
        };
    }

    function Validation(target, pluginName) {
        var plugin = Plugins.get(pluginName);
        if (!plugin) {
            return;
        }

        function getData() {
            // todo: bind plugin.data to form
            return { key: 1 };
        };

        /* public properties */
        this.plugin = plugin;
        this.target = target;

        /* public functions */
        this.createRequest = function () {
            return $.ajax({
                url: plugin.url,
                data: getData()
            });
        };
    };

    function Validator(form) {
        var start = function start() {
            form.trigger(constants.events.validating);
            form.validating(true);
            form.invalidCount(0);
        };

        var stop = function stop() {
            form.validating(false);
            form.trigger(constants.events.validated);
        };

        var onFulfilled = function onFulfilled(validations, results) {
            $.each(results, function (i, result) {
                var validation = validations[i];
                var target = validation.target;
                form.hideErrors(target);
                var isValid = validation.plugin.isValid(result);
                target.valid(isValid);
            });
        };

        var onFail = function onFail(reason) {
            console.log('an error has occurred: ' + reason);
        };

        /* public functions */
        this.validate = function () {
            if (form.validating() === true) {
                return;
            }

            start();

            var validations = form.validations();
            var requests = $.map(validations, function (validation) {
                return validation.createRequest();
            });

            Promise.all(requests).then(function (results) {
                return onFulfilled(validations, results);
            }, onFail).catch(onFail).then(stop);
        };

        return this;
    }

    // jQuery plugin
    $.fn.xvalidate = function (options) {
        return this.each(function () {
            var form = new Form($(this));
            var validator = new Validator(form);
            form.onValidateRequired(validator.validate);
        });
    };

    return X;
})(jQuery, XValidate);

// invoke
$(function () {
    /*default implementation*/
    var forms = $('[data-xval-form]').xvalidate();
    console.log(forms);
});